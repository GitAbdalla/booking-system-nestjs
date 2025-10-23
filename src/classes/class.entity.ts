import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Booking } from '../bookings/booking.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ name: 'current_bookings', type: 'int', default: 0 })
  currentBookings: number;

  @Column({ name: 'credits_required', type: 'int', default: 1 })
  creditsRequired: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationship: One class can have many bookings
  @OneToMany(() => Booking, (booking) => booking.class)
  bookings: Booking[];

  // Virtual property to check if class is full
  get isFull(): boolean {
    return this.currentBookings >= this.capacity;
  }

  // Virtual property to get available slots
  get availableSlots(): number {
    return Math.max(0, this.capacity - this.currentBookings);
  }
}