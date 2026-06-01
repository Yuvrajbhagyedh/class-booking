import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Teacher: Create a course' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: User) {
    return this.coursesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('my')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Teacher: Get my courses' })
  myC(@CurrentUser() user: User) {
    return this.coursesService.findByTeacher(user.id);
  }
}
