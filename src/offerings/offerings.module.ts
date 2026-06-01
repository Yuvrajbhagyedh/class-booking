import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offering } from './offering.entity';
import { Session } from '../sessions/session.entity';
import { OfferingsService } from './offerings.service';
import { OfferingsController } from './offerings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Offering, Session])],
  providers: [OfferingsService],
  controllers: [OfferingsController],
  exports: [OfferingsService],
})
export class OfferingsModule {}
