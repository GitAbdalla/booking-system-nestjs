import { IsString, IsNotEmpty, IsInt, Min, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    example: 'Yoga Beginner',
    description: 'Name of the class',
  })
  @IsString()
  @IsNotEmpty({ message: 'Class name is required' })
  name: string;

  @ApiProperty({
    example: 'A relaxing yoga class for beginners',
    description: 'Description of the class',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '2025-10-25T10:00:00Z',
    description: 'Start time of the class (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'Start time must be a valid ISO 8601 date' })
  startTime: string;

  @ApiProperty({
    example: '2025-10-25T11:00:00Z',
    description: 'End time of the class (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'End time must be a valid ISO 8601 date' })
  endTime: string;

  @ApiProperty({
    example: 20,
    description: 'Maximum number of participants',
    minimum: 1,
  })
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;

  @ApiProperty({
    example: 1,
    description: 'Number of credits required to book this class',
    minimum: 1,
    default: 1,
  })
  @IsInt({ message: 'Credits required must be an integer' })
  @Min(1, { message: 'Credits required must be at least 1' })
  @IsOptional()
  creditsRequired?: number;
}