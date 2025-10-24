import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Class } from './class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { FilterClassDto, ClassAvailability } from './dto/filter-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<Class> {
    const { startTime, endTime, ...rest } = createClassDto;

    
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    
    const now = new Date();
    if (start < now) {
      throw new BadRequestException('Cannot create a class in the past');
    }

    const classEntity = this.classRepository.create({
      ...rest,
      startTime: start,
      endTime: end,
      creditsRequired: createClassDto.creditsRequired || 1,
      currentBookings: 0,
    });

    return this.classRepository.save(classEntity);
  }

  async findAll(filterDto?: FilterClassDto): Promise<Class[]> {
    const query = this.classRepository.createQueryBuilder('class');

    
    if (filterDto?.fromDate) {
      query.andWhere('class.startTime >= :fromDate', {
        fromDate: new Date(filterDto.fromDate),
      });
    }

    if (filterDto?.toDate) {
      query.andWhere('class.startTime <= :toDate', {
        toDate: new Date(filterDto.toDate),
      });
    }

    
    if (filterDto?.availability === ClassAvailability.AVAILABLE) {
      query.andWhere('class.currentBookings < class.capacity');
    } else if (filterDto?.availability === ClassAvailability.FULL) {
      query.andWhere('class.currentBookings >= class.capacity');
    }

    
    query.orderBy('class.startTime', 'ASC');

    const classes = await query.getMany();

    
    return classes.map((classEntity) => ({
      ...classEntity,
      isFull: classEntity.isFull,
      availableSlots: classEntity.availableSlots,
    }));
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['bookings', 'bookings.user'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async findUpcoming(): Promise<Class[]> {
    const now = new Date();
    
    const classes = await this.classRepository.find({
      where: {
        startTime: MoreThanOrEqual(now),
      },
      order: {
        startTime: 'ASC',
      },
    });

    return classes.map((classEntity) => ({
      ...classEntity,
      isFull: classEntity.isFull,
      availableSlots: classEntity.availableSlots,
    }));
  }

  async incrementBookings(classId: string): Promise<Class> {
    const classEntity = await this.findOne(classId);
    
    if (classEntity.isFull) {
      throw new BadRequestException('Class is already full');
    }

    classEntity.currentBookings += 1;
    return this.classRepository.save(classEntity);
  }

  async decrementBookings(classId: string): Promise<Class> {
    const classEntity = await this.findOne(classId);
    
    if (classEntity.currentBookings > 0) {
      classEntity.currentBookings -= 1;
      return this.classRepository.save(classEntity);
    }

    return classEntity;
  }

  async checkAvailability(classId: string): Promise<{
    available: boolean;
    availableSlots: number;
    capacity: number;
    currentBookings: number;
  }> {
    const classEntity = await this.findOne(classId);

    return {
      available: !classEntity.isFull,
      availableSlots: classEntity.availableSlots,
      capacity: classEntity.capacity,
      currentBookings: classEntity.currentBookings,
    };
  }
}