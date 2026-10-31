import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export type PublicUser = {
  id: string
  email: string
  name: string
  photoUrl: string | null
  hasPassword: boolean
  providers: { google: boolean; apple: boolean }
  eventTypes: string[]
  city: string | null
  locationGranted: boolean
  radiusKm: number
  onboarded: boolean
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOneBy({ id })
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email: normalizeEmail(email) })
  }

  findBySocial(key: 'googleSub' | 'appleSub', sub: string) {
    return this.repo.findOneBy({ [key]: sub })
  }

  async getOrFail(id: string) {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('Usuário não encontrado.')
    return user
  }

  async create(data: Partial<User> & { email: string }) {
    if (await this.findByEmail(data.email)) {
      throw new ConflictException('Já existe uma conta com este e-mail.')
    }
    return this.repo.save(this.repo.create({ ...data, email: normalizeEmail(data.email) }))
  }

  async update(user: User, patch: Partial<User>) {
    if (patch.email !== undefined) {
      patch.email = normalizeEmail(patch.email)
      if (patch.email !== user.email) {
        const other = await this.findByEmail(patch.email)
        if (other && other.id !== user.id) {
          throw new ConflictException('Este e-mail já está em uso por outra conta.')
        }
      }
    }
    Object.assign(user, patch)
    return this.repo.save(user)
  }

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      photoUrl: user.photoFile
        ? `/api/uploads/${user.photoFile}?v=${user.updatedAt?.getTime() ?? 0}`
        : null,
      hasPassword: !!user.passwordHash,
      providers: { google: !!user.googleSub, apple: !!user.appleSub },
      eventTypes: user.eventTypes ?? [],
      city: user.city,
      locationGranted: user.locationGranted,
      radiusKm: user.radiusKm,
      onboarded: !!user.onboardedAt,
    }
  }
}
