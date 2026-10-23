import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('linkedin_invites')
@Index(['profileUrl'], { unique: true })
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'profile_url', type: 'varchar', length: 500 })
  profileUrl!: string;

  @Column({ type: 'varchar', length: 64, default: 'Pending' })
  status!: string;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  steps!: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
