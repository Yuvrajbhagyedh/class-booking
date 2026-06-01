import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferingDto {
  @ApiProperty({ example: 'Saturday Batch' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Weekend coding sessions' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-course' })
  @IsUUID()
  courseId: string;
}
