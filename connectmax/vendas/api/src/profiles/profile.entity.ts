import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('linkedin_profiles')
@Index(['name', 'current'], { unique: true })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  level!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  connection!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  city!: string | null;

  @Column({ name: 'mutual_connections', type: 'varchar', length: 200, nullable: true })
  mutualConnections!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  current!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  past!: string | null;

  @Column({ name: 'extracted_at', type: 'timestamptz', nullable: true })
  extractedAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  round!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
