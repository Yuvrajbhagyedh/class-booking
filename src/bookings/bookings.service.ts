import {
  Injectable, NotFoundException, ConflictException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as moment from 'moment-timezone';
import { Booking, BookingStatus } from './booking.entity';
import { Offering } from '../offerings/offering.entity';
import { Session } from '../sessions/session.entity';
import { User } from '../users/user.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Offering) private offeringRepo: Repository<Offering>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  /**
   * Book an offering. Uses pessimistic_write lock inside a transaction
   * to prevent race conditions on concurrent booking attempts.
   */
  async bookOffering(offeringId: string, parent: User): Promise<Booking> {
    return this.dataSource.transaction(async (manager) => {
      // Lock offering row to serialize concurrent attempts
      const offering = await manager
        .createQueryBuilder(Offering, 'offering')
        .setLock('pessimistic_write')
        .where('offering.id = :offeringId', { offeringId })
        .leftJoinAndSelect('offering.sessions', 'sessions')
        .getOne();

      if (!offering) throw new NotFoundException('Offering not found');
      if (!offering.sessions?.length) {
        throw new BadRequestException('This offering has no sessions yet');
      }

      // Prevent duplicate booking
      const already = await manager.findOne(Booking, {
        where: { parentId: parent.id, offeringId, status: BookingStatus.CONFIRMED },
      });
      if (already) throw new ConflictException('You already booked this offering');

      // Conflict detection: check if any session of new offering overlaps
      // with any session from a parent's existing confirmed bookings
      const conflict = await manager
        .createQueryBuilder(Session, 'ns')
        .innerJoin(Booking, 'b', 'b.parentId = :parentId AND b.status = :status', {
          parentId: parent.id,
          status: BookingStatus.CONFIRMED,
        })
        .innerJoin(Session, 'bs', 'bs.offeringId = b.offeringId')
        .where('ns.offeringId = :offeringId', { offeringId })
        .andWhere('ns.startTime < bs.endTime')
        .andWhere('ns.endTime > bs.startTime')
        .getOne();

      if (conflict) {
        throw new ConflictException(
          'One or more sessions overlap with your existing bookings',
        );
      }

      const booking = manager.create(Booking, {
        parentId: parent.id,
        offeringId,
        status: BookingStatus.CONFIRMED,
      });
      const saved = await manager.save(Booking, booking);
      this.logger.log(`Booking ${saved.id} created: parent=${parent.id}, offering=${offeringId}`);
      return saved;
    });
  }

  async getParentBookings(parentId: string, viewerTimezone?: string) {
    const bookings = await this.bookingRepo.find({
      where: { parentId, status: BookingStatus.CONFIRMED },
      relations: { offering: { sessions: true, course: true, teacher: true } },
      order: { bookedAt: 'DESC' },
    });

    const tz = viewerTimezone || 'UTC';
    return bookings.map((booking) => ({
      ...booking,
      offering: {
        ...booking.offering,
        sessions: booking.offering?.sessions?.map((session) => ({
          ...session,
          startTimeLocal: moment.utc(session.startTime).tz(tz).format('YYYY-MM-DD HH:mm:ss'),
          endTimeLocal: moment.utc(session.endTime).tz(tz).format('YYYY-MM-DD HH:mm:ss'),
          timezone: tz,
        })),
      },
    }));
  }

  async cancelBooking(bookingId: string, parentId: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId, parentId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking already cancelled');
    }
    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }
}
