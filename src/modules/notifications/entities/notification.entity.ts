import { BaseEntity } from 'src/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { NotificationStatus } from '../enums/NotificationStatus.enum';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'text' })
  notificationText: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user: User;
}
