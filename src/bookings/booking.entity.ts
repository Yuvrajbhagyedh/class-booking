import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Offering } from '../offerings/offering.entity';

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
@Index(['parentId', 'offeringId'], { unique: true }) // One booking per offering per parent
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column()
  offeringId: string;

  @ManyToOne(() => Offering)
  @JoinColumn({ name: 'offeringId' })
  offering: Offering;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @CreateDateColumn()
  bookedAt: Date;
}
