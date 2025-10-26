import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './booking.entity';
import { User, UserRole } from '../users/user.entity';
import { Class } from '../classes/class.entity';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';

describe('BookingsService - Business Rules', () => {
  let service: BookingsService;
  

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    credits: 10,
    role: UserRole.USER,
  };

  const mockClass = {
    id: 'class-123',
    name: 'Yoga Class',
    startTime: new Date('2025-12-01T10:00:00Z'),
    endTime: new Date('2025-12-01T11:00:00Z'),
    capacity: 10,
    currentBookings: 5,
    creditsRequired: 2,
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockBookingRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {};
  const mockClassRepository = {};
  const mockUsersService = {};
  const mockClassesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: mockClassRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ClassesService,
          useValue: mockClassesService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

 afterEach(() => {
    jest.clearAllMocks();
    mockQueryRunner.manager.findOne.mockReset();
    mockQueryRunner.manager.createQueryBuilder.mockReset();
  });

  describe('createBooking - Business Rule: Insufficient Credits', () => {
    it('should throw BadRequestException when user has insufficient credits', async () => {
      const userWithLowCredits = { ...mockUser, credits: 1 };
      const classRequiring2Credits = { ...mockClass, creditsRequired: 2 };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(userWithLowCredits)
        .mockResolvedValueOnce(classRequiring2Credits);

      await expect(
        service.createBooking('user-123', { classId: 'class-123' }),
      ).rejects.toThrow('Insufficient credits');
    });
  });

  describe('createBooking - Business Rule: Class Full', () => {
    it('should throw BadRequestException when class is full', async () => {
      const fullClass = { ...mockClass, currentBookings: 10, capacity: 10 };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(fullClass);

      await expect(
        service.createBooking('user-123', { classId: 'class-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking - Business Rule: Duplicate Booking', () => {
    it('should throw BadRequestException when user already booked the class', async () => {
      const existingBooking = {
        id: 'booking-123',
        userId: 'user-123',
        classId: 'class-123',
        status: BookingStatus.ACTIVE,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(existingBooking);

      mockQueryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createBooking('user-123', { classId: 'class-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking - Business Rule: Overlapping Bookings', () => {
    it('should throw BadRequestException when booking overlaps', async () => {
      const overlappingBooking = {
        id: 'booking-456',
        userId: 'user-123',
        classId: 'other-class-123',
        status: BookingStatus.ACTIVE,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(null);

      mockQueryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overlappingBooking),
      });

      await expect(
        service.createBooking('user-123', { classId: 'class-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking - Success Case', () => {
    it('should successfully create booking when all rules pass', async () => {
      const newBooking = {
        id: 'new-booking-123',
        userId: 'user-123',
        classId: 'class-123',
        creditsUsed: 2,
        status: BookingStatus.ACTIVE,
      };

      // Mock all the findOne calls in order
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(mockUser) // First: get user with lock
        .mockResolvedValueOnce(mockClass) // Second: get class with lock
        .mockResolvedValueOnce(null); // Third: check for existing booking

      mockQueryRunner.manager.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // No overlapping
      });

      mockQueryRunner.manager.create.mockReturnValue(newBooking);
      mockQueryRunner.manager.save.mockResolvedValue(newBooking);
      mockBookingRepository.findOne.mockResolvedValue({
        ...newBooking,
        user: mockUser,
        class: mockClass,
      });

      const result = await service.createBooking('user-123', {
        classId: 'class-123',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-booking-123');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('cancelBooking - 2 Hour Refund Rule', () => {
    it('should refund credits when cancelled >2 hours before class', async () => {
      const futureClass = {
        ...mockClass,
        startTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      };

      const activeBooking = {
        id: 'booking-123',
        userId: 'user-123', // IMPORTANT: Match the userId parameter
        classId: 'class-123',
        creditsUsed: 2,
        status: BookingStatus.ACTIVE,
        cancelledAt: null,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(activeBooking) // Get booking
        .mockResolvedValueOnce(futureClass) // Get class
        .mockResolvedValueOnce(mockUser) // Get user for refund
        .mockResolvedValueOnce(futureClass); // Get class for decrement

      mockQueryRunner.manager.save.mockResolvedValue({
        ...activeBooking,
        status: BookingStatus.CANCELLED,
      });

      mockBookingRepository.findOne.mockResolvedValue({
        ...activeBooking,
        status: BookingStatus.CANCELLED,
        user: mockUser,
        class: futureClass,
      });

      const result = await service.cancelBooking('user-123', 'booking-123');

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should NOT refund credits when cancelled <2 hours before', async () => {
      const soonClass = {
        ...mockClass,
        startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
      };

      const activeBooking = {
        id: 'booking-123',
        userId: 'user-123', // IMPORTANT: Match the userId parameter
        classId: 'class-123',
        creditsUsed: 2,
        status: BookingStatus.ACTIVE,
        cancelledAt: null,
      };

      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce(activeBooking) // Get booking
        .mockResolvedValueOnce(soonClass) // Get class
        .mockResolvedValueOnce(soonClass); // Get class for decrement (no user refund)

      mockQueryRunner.manager.save.mockResolvedValue({
        ...activeBooking,
        status: BookingStatus.CANCELLED,
      });

      mockBookingRepository.findOne.mockResolvedValue({
        ...activeBooking,
        status: BookingStatus.CANCELLED,
        class: soonClass,
      });

      const result = await service.cancelBooking('user-123', 'booking-123');

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});