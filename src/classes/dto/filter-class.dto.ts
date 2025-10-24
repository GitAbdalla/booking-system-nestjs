import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ClassAvailability {
  ALL = 'all',
  AVAILABLE = 'available',
  FULL = 'full',
}

export class FilterClassDto {
  @ApiProperty({
    example: '2025-10-25',
    description: 'Filter classes starting from this date (ISO 8601 format)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'From date must be a valid ISO 8601 date' })
  fromDate?: string;

  @ApiProperty({
    example: '2025-10-30',
    description: 'Filter classes until this date (ISO 8601 format)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'To date must be a valid ISO 8601 date' })
  toDate?: string;

  @ApiProperty({
    example: 'available',
    description: 'Filter by availability status',
    enum: ClassAvailability,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClassAvailability, { message: 'Availability must be one of: all, available, full' })
  availability?: ClassAvailability;
}