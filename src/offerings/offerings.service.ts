import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';
import { Offering } from './offering.entity';
import { Session } from '../sessions/session.entity';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { AddSessionDto } from '../sessions/dto/add-session.dto';
import { User } from '../users/user.entity';

@Injectable()
export class OfferingsService {
  constructor(
    @InjectRepository(Offering) private offeringRepo: Repository<Offering>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
  ) {}

  async createOffering(dto: CreateOfferingDto, teacher: User) {
    const offering = this.offeringRepo.create({
      ...dto,
      teacherId: teacher.id,
      teacherTimezone: teacher.timezone,
    });
    return this.offeringRepo.save(offering);
  }

  async addSession(offeringId: string, dto: AddSessionDto, teacher: User) {
    const offering = await this.offeringRepo.findOne({ where: { id: offeringId } });
    if (!offering) throw new NotFoundException('Offering not found');
    if (offering.teacherId !== teacher.id) throw new ForbiddenException('Not your offering');

    const tz = teacher.timezone || 'UTC';
    const startUtc = moment.tz(dto.startTime, tz).utc().toDate();
    const endUtc = moment.tz(dto.endTime, tz).utc().toDate();

    const session = this.sessionRepo.create({
      offeringId,
      teacherId: teacher.id,
      startTime: startUtc,
      endTime: endUtc,
    });
    return this.sessionRepo.save(session);
  }

  async getTeacherOfferings(teacherId: string, viewerTimezone?: string) {
    const offerings = await this.offeringRepo.find({
      where: { teacherId },
      relations: { sessions: true, course: true },
      order: { createdAt: 'DESC' },
    });
    return this.formatOfferingsForTimezone(offerings, viewerTimezone || 'UTC');
  }

  async getAllOfferings(viewerTimezone?: string) {
    const offerings = await this.offeringRepo.find({
      relations: { sessions: true, course: true, teacher: true },
      order: { createdAt: 'DESC' },
    });
    return this.formatOfferingsForTimezone(offerings, viewerTimezone || 'UTC');
  }

  async getOfferingById(id: string) {
    const offering = await this.offeringRepo.findOne({
      where: { id },
      relations: { sessions: true, course: true, teacher: true },
    });
    if (!offering) throw new NotFoundException('Offering not found');
    return offering;
  }

  private formatOfferingsForTimezone(offerings: Offering[], timezone: string) {
    return offerings.map((offering) => ({
      ...offering,
      sessions: offering.sessions?.map((session) => ({
        ...session,
        startTimeLocal: moment.utc(session.startTime).tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
        endTimeLocal: moment.utc(session.endTime).tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
        timezone,
      })),
    }));
  }
}
