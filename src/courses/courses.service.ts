import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(@InjectRepository(Course) private courseRepo: Repository<Course>) {}

  create(dto: CreateCourseDto, teacherId: string) {
    const course = this.courseRepo.create({ ...dto, teacherId });
    return this.courseRepo.save(course);
  }

  findAll() {
    return this.courseRepo.find({ relations: { teacher: true } });
  }

  findByTeacher(teacherId: string) {
    return this.courseRepo.find({ where: { teacherId }, relations: { teacher: true } });
  }
}
