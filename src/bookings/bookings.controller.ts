import { Controller, Get, Post, Param, Delete, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post(':offeringId')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Parent: Book an offering (books all sessions)' })
  book(
    @Param('offeringId', ParseUUIDPipe) offeringId: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.bookOffering(offeringId, user);
  }

  @Get('my')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Parent: Get my bookings with session times in my timezone' })
  @ApiQuery({ name: 'timezone', required: false, example: 'America/New_York' })
  myBookings(@CurrentUser() user: User, @Query('timezone') timezone?: string) {
    return this.bookingsService.getParentBookings(user.id, timezone || user.timezone);
  }

  @Delete(':bookingId')
  @Roles(Role.PARENT)
  @ApiOperation({ summary: 'Parent: Cancel a booking' })
  cancel(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancelBooking(bookingId, user.id);
  }
}
