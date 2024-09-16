import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Assuming you have a User entity for interpreters
import { BaseEntity } from 'src/base.entity';
import { Billing_Status } from '../enum/billingStatus.enum';

@Entity('billing_history')
export class Billing_History extends BaseEntity {
  @ManyToOne(() => User, (user) => user.billingHistories, { nullable: false })
  @JoinColumn({ name: 'interpreter_id' })
  interpreter: User;

  @Column({
    type: 'enum',
    enum: Billing_Status,
    default: Billing_Status.PENDING,
  })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;
}
