import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesModule } from './courses/courses.module';
import { OfferingsModule } from './offerings/offerings.module';
import { SessionsModule } from './sessions/sessions.module';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'class_booking'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Use migrations in production
        timezone: 'Z',     // Store UTC in DB
      }),
    }),
    UsersModule,
    CoursesModule,
    OfferingsModule,
    SessionsModule,
    BookingsModule,
  ],
})
export class AppModule {}
