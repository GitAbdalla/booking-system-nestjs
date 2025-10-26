import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the class to book',
  })
  @IsUUID('4', { message: 'Class ID must be a valid UUID' })
  classId: string;
}