import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Python Coding' })
  @IsString() @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Learn Python from scratch' })
  @IsOptional() @IsString()
  description?: string;
}
