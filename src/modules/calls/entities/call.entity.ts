import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Assuming you have a User entity for clients and interpreters
import { BaseEntity } from 'src/base.entity';
import { paymentStatus } from '../enums/paymentStatus.enum';

@Entity('call_history')
export class CallHistory extends BaseEntity {
  @ManyToOne(() => User, (user) => user.clientCallHistories, {
    nullable: false,
  })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @ManyToOne(() => User, (user) => user.interpreterCallHistories, {
    nullable: false,
  })
  @JoinColumn({ name: 'interpreter_id' })
  interpreter: User;

  @Column({ type: 'time' })
  duration: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  bill: number;

  @Column({
    type: 'enum',
    enum: paymentStatus,
    default: paymentStatus.PENDING,
  })
  status: string;
}
