import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSessionDto {
  @ApiProperty({
    example: '2025-06-07T17:00:00',
    description: 'Start time in teacher local timezone (ISO 8601 without Z, e.g. 2025-06-07T17:00:00)',
  })
  @IsDateString() @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '2025-06-07T18:00:00',
    description: 'End time in teacher local timezone (ISO 8601 without Z)',
  })
  @IsDateString() @IsNotEmpty()
  endTime: string;
}
