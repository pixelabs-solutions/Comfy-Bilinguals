import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from 'src/base.entity';

@Entity('ratings')
export class Rating extends BaseEntity {
  @Column({ type: 'int', width: 1 })
  stars: number; // rating on a scale of 1-5

  @Column({ type: 'text', nullable: true })
  content: string; // review content

  @ManyToOne(() => User, (user) => user.givenRatings)
  @JoinColumn({ name: 'client_id' })
  client: User; // client who gives the rating

  @ManyToOne(() => User, (user) => user.receivedRatings)
  @JoinColumn({ name: 'interpreter_id' })
  interpreter: User; // interpreter who receives the rating
}
