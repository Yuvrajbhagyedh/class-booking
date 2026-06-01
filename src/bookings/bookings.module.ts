import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { Offering } from '../offerings/offering.entity';
import { Session } from '../sessions/session.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Offering, Session])],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
