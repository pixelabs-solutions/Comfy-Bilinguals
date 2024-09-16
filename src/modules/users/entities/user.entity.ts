import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { Roles } from '../enums/roles.enum';
import { gender } from '../enums/gender.enum';
import { BaseEntity } from 'src/base.entity';
import { CallHistory } from 'src/modules/calls/entities/call.entity';
import { Billing_History } from 'src/modules/billing/entities/billing_history.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'enum', enum: Roles, default: Roles.USER_MANAGER })
  role: string;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50, nullable: true })
  middleName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'enum', enum: gender, default: 'male' })
  gender: string;

  @Column()
  password: string;

  @Column({ nullable: true, default: 'Offline' })
  status: string;

  @Column({ nullable: true, default: 'false' })
  approved: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  skypeId: string;

  @Column({ nullable: true })
  organization: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  position: string;

  @Column('text', { array: true, nullable: true })
  profilePicture: string[];

  // Relationships
  @OneToMany(() => CallHistory, (callHistory) => callHistory.client)
  clientCallHistories: CallHistory[];

  @OneToMany(() => CallHistory, (callHistory) => callHistory.interpreter)
  interpreterCallHistories: CallHistory[];

  @OneToMany(() => Billing_History, (billing) => billing.interpreter)
  billingHistories: Billing_History[];

  // Self-referential relationship to track who added the user
  @ManyToOne(() => User, (user) => user.addedUsers, { nullable: true })
  addedBy: User;

  @OneToMany(() => User, (user) => user.addedBy)
  addedUsers: User[];
}
