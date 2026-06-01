import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OfferingsService } from './offerings.service';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { AddSessionDto } from '../sessions/dto/add-session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Offerings')
@ApiBearerAuth()
@Controller('offerings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OfferingsController {
  constructor(private offeringsService: OfferingsService) {}

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Teacher: Create an offering' })
  create(@Body() dto: CreateOfferingDto, @CurrentUser() user: User) {
    return this.offeringsService.createOffering(dto, user);
  }

  @Post(':id/sessions')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Teacher: Add a session to an offering (time in teacher timezone)' })
  addSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddSessionDto,
    @CurrentUser() user: User,
  ) {
    return this.offeringsService.addSession(id, dto, user);
  }

  @Get('my')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Teacher: Get my offerings with sessions' })
  @ApiQuery({ name: 'timezone', required: false, example: 'Asia/Kolkata' })
  myOfferings(@CurrentUser() user: User, @Query('timezone') timezone?: string) {
    return this.offeringsService.getTeacherOfferings(user.id, timezone || user.timezone);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available offerings (sessions in viewer timezone)' })
  @ApiQuery({ name: 'timezone', required: false, example: 'America/New_York' })
  findAll(@CurrentUser() user: User, @Query('timezone') timezone?: string) {
    return this.offeringsService.getAllOfferings(timezone || user.timezone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offering details by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offeringsService.getOfferingById(id);
  }
}
