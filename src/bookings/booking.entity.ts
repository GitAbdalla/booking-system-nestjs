import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';

export enum BookingStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'credits_used', type: 'int' })
  creditsUsed: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.ACTIVE,
  })
  status: BookingStatus;

  @Column({ name: 'booked_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  bookedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.bookings, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Class, (classEntity) => classEntity.bookings, { eager: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  // Helper method to check if cancellation is eligible for refund
  canRefund(): boolean {
    if (this.status !== BookingStatus.ACTIVE) {
      return false;
    }

    const now = new Date();
    const classStartTime = new Date(this.class.startTime);
    const hoursUntilClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Can refund if more than 2 hours before class
    return hoursUntilClass > 2;
  }
}