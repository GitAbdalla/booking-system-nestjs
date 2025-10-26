import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/user.entity';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Book a class' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    schema: {
      example: {
        id: 'booking-uuid',
        userId: 'user-uuid',
        classId: 'class-uuid',
        creditsUsed: 1,
        status: 'active',
        bookedAt: '2025-10-23T00:00:00.000Z',
        class: {
          name: 'Morning Yoga',
          startTime: '2025-10-26T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Insufficient credits, class full, or overlapping booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Class not found',
  })
  async createBooking(
    @GetUser() user: User,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.id, createBookingDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all bookings',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllBookings() {
    return this.bookingsService.getAllBookings();
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({
    status: 200,
    description: 'List of user bookings',
    schema: {
      example: [
        {
          id: 'booking-uuid',
          classId: 'class-uuid',
          creditsUsed: 1,
          status: 'active',
          bookedAt: '2025-10-23T00:00:00.000Z',
          class: {
            name: 'Morning Yoga',
            startTime: '2025-10-26T08:00:00.000Z',
            endTime: '2025-10-26T09:00:00.000Z',
          },
        },
      ],
    },
  })
  async getMyBookings(@GetUser() user: User) {
    return this.bookingsService.getUserBookings(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async getBookingById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.getBookingById(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully. Credits refunded if >2 hours before class.',
    schema: {
      example: {
        id: 'booking-uuid',
        status: 'cancelled',
        cancelledAt: '2025-10-23T00:00:00.000Z',
        class: {
          name: 'Morning Yoga',
          startTime: '2025-10-26T08:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Booking already cancelled or completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only cancel own bookings',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async cancelBooking(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.cancelBooking(user.id, id);
  }
}