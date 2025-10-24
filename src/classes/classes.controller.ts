import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new class (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Class created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Yoga Beginner',
        description: 'A relaxing yoga class',
        startTime: '2025-10-25T10:00:00.000Z',
        endTime: '2025-10-25T11:00:00.000Z',
        capacity: 20,
        currentBookings: 0,
        creditsRequired: 1,
        createdAt: '2025-10-23T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid class data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes with optional filters' })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: 'Filter classes from this date',
    example: '2025-10-25',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: 'Filter classes until this date',
    example: '2025-10-30',
  })
  @ApiQuery({
    name: 'availability',
    required: false,
    description: 'Filter by availability',
    enum: ['all', 'available', 'full'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of classes',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Yoga Beginner',
          description: 'A relaxing yoga class',
          startTime: '2025-10-25T10:00:00.000Z',
          endTime: '2025-10-25T11:00:00.000Z',
          capacity: 20,
          currentBookings: 5,
          creditsRequired: 1,
          isFull: false,
          availableSlots: 15,
        },
      ],
    },
  })
  async findAll(@Query() filterDto: FilterClassDto) {
    return this.classesService.findAll(filterDto);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get all upcoming classes' })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming classes',
  })
  async findUpcoming() {
    return this.classesService.findUpcoming();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID with bookings' })
  @ApiParam({
    name: 'id',
    description: 'Class UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Class details with bookings',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Yoga Beginner',
        startTime: '2025-10-25T10:00:00.000Z',
        capacity: 20,
        currentBookings: 5,
        bookings: [
          {
            id: 'booking-id',
            user: {
              email: 'user@example.com',
            },
            bookedAt: '2025-10-23T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Class not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check class availability' })
  @ApiParam({
    name: 'id',
    description: 'Class UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Class availability information',
    schema: {
      example: {
        available: true,
        availableSlots: 15,
        capacity: 20,
        currentBookings: 5,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Class not found',
  })
  async checkAvailability(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.checkAvailability(id);
  }
}