import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column()
  userId: string

  // sha256 do token; o token em claro só vai no e-mail
  @Index({ unique: true })
  @Column()
  tokenHash: string

  @Column({ type: 'datetime' })
  expiresAt: Date

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date | null

  @CreateDateColumn()
  createdAt: Date
}
