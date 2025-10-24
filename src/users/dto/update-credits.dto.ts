import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCreditsDto {
  @ApiProperty({
    example: 20,
    description: 'Number of credits to assign to the user',
    minimum: 0,
  })
  @IsInt({ message: 'Credits must be an integer' })
  @Min(0, { message: 'Credits cannot be negative' })
  credits: number;
}