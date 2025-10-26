import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, MoreThan } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private dataSource: DataSource,
    private usersService: UsersService,
    private classesService: ClassesService,
  ) {}

  async createBooking(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const { classId } = createBookingDto;

    // Start a database transaction - ALL operations must succeed or ALL fail
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get user and class with locks (prevent race conditions)
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }, // Lock this row
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const classEntity = await queryRunner.manager.findOne(Class, {
        where: { id: classId },
        lock: { mode: 'pessimistic_write' }, // Lock this row
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      // 2. BUSINESS RULE: Check if user has enough credits
      if (user.credits < classEntity.creditsRequired) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${classEntity.creditsRequired}, Available: ${user.credits}`,
        );
      }

      // 3. BUSINESS RULE: Check if class is full
      if (classEntity.currentBookings >= classEntity.capacity) {
        throw new BadRequestException('Class is full');
      }

      // 4. BUSINESS RULE: Check for overlapping bookings (same user, same time)
      const overlappingBooking = await queryRunner.manager
        .createQueryBuilder(Booking, 'booking')
        .innerJoin('booking.class', 'class')
        .where('booking.userId = :userId', { userId })
        .andWhere('booking.status = :status', { status: BookingStatus.ACTIVE })
        .andWhere(
          '(class.startTime < :endTime AND class.endTime > :startTime)',
          {
            startTime: classEntity.startTime,
            endTime: classEntity.endTime,
          },
        )
        .getOne();

      if (overlappingBooking) {
        throw new BadRequestException(
          'You already have a booking that overlaps with this class time',
        );
      }

      // 5. BUSINESS RULE: Check if user already booked this specific class
      const existingBooking = await queryRunner.manager.findOne(Booking, {
        where: {
          userId,
          classId,
          status: BookingStatus.ACTIVE,
        },
      });

      if (existingBooking) {
        throw new BadRequestException('You have already booked this class');
      }

      // 6. Create booking
      const booking = queryRunner.manager.create(Booking, {
        userId,
        classId,
        creditsUsed: classEntity.creditsRequired,
        status: BookingStatus.ACTIVE,
      });

      await queryRunner.manager.save(booking);

      // 7. Deduct credits from user
      user.credits -= classEntity.creditsRequired;
      await queryRunner.manager.save(user);

      // 8. Increment class bookings count
      classEntity.currentBookings += 1;
      await queryRunner.manager.save(classEntity);

      // Commit transaction - all changes are saved
      await queryRunner.commitTransaction();

      // Return booking with relations
      return this.bookingRepository.findOne({
        where: { id: booking.id },
        relations: ['user', 'class'],
      });
    } catch (error) {
      // Rollback transaction - undo all changes
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async cancelBooking(userId: string, bookingId: string): Promise<Booking> {
    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get booking WITHOUT relations (to allow locking)
      const booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // 2. Load class separately (needed for time calculation)
      const classEntity = await queryRunner.manager.findOne(Class, {
        where: { id: booking.classId },
      });

      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }

      // 2. Check if booking belongs to user
      if (booking.userId !== userId) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }

      // 3. Check if booking is already cancelled
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking is already cancelled');
      }

      // 4. Check if booking is completed
      if (booking.status === BookingStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed booking');
      }

      // 5. BUSINESS RULE: Check if cancellation is more than 2 hours before class
      const now = new Date();
      const classStartTime = new Date(classEntity.startTime);
      const hoursUntilClass =
        (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const canRefund = hoursUntilClass > 2;

      // 6. Update booking status
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = now;
      await queryRunner.manager.save(booking);

      // 7. BUSINESS RULE: Refund credits if cancelled >2 hours before
      if (canRefund) {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });

        user.credits += booking.creditsUsed;
        await queryRunner.manager.save(user);
      }

      // 8. Decrement class bookings count
      const classToUpdate = await queryRunner.manager.findOne(Class, {
        where: { id: booking.classId },
        lock: { mode: 'pessimistic_write' },
      });

      if (classToUpdate && classToUpdate.currentBookings > 0) {
        classToUpdate.currentBookings -= 1;
        await queryRunner.manager.save(classToUpdate);
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return updated booking
      return this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['user', 'class'],
      });
    } catch (error) {
      // Rollback transaction
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId },
      relations: ['class'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'class'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['user', 'class'],
      order: { createdAt: 'DESC' },
    });
  }
}