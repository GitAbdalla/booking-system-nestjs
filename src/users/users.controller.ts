import {
  Controller,
  Get,
  Param,
  Patch,
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
import { UsersService } from './users.service';
import { UpdateCreditsDto } from './dto/update-credits.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from './user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard) 
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          credits: 10,
          createdAt: '2025-10-23T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with bookings' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile with booking history',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        credits: 10,
        bookings: [
          {
            id: 'booking-id',
            status: 'active',
            class: {
              name: 'Yoga Class',
              startTime: '2025-10-24T10:00:00.000Z',
            },
          },
        ],
      },
    },
  })
  async getMyProfile(@GetUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard) 
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/credits')
  @UseGuards(RolesGuard) 
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user credits (admin function)' })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Credits updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        credits: 50,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateCredits(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCreditsDto: UpdateCreditsDto,
  ) {
    return this.usersService.updateCredits(id, updateCreditsDto);
  }
}