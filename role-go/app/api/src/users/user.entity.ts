import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { RADIUS_DEFAULT_KM } from '../common/catalog'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  // null quando a conta só existe via Google/Apple
  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null

  @Column({ default: '' })
  name: string

  @Column({ type: 'varchar', nullable: true })
  photoFile: string | null

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleSub: string | null

  @Column({ type: 'varchar', nullable: true, unique: true })
  appleSub: string | null

  @Column({ type: 'simple-json', default: '[]' })
  eventTypes: string[]

  @Column({ type: 'varchar', nullable: true })
  city: string | null

  @Column({ default: false })
  locationGranted: boolean

  @Column({ type: 'float', nullable: true })
  latitude: number | null

  @Column({ type: 'float', nullable: true })
  longitude: number | null

  @Column({ type: 'int', default: RADIUS_DEFAULT_KM })
  radiusKm: number

  @Column({ type: 'datetime', nullable: true })
  onboardedAt: Date | null

  // Incrementa ao redefinir senha: invalida sessões abertas.
  @Column({ type: 'int', default: 0 })
  tokenVersion: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
