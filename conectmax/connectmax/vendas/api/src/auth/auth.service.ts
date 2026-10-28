import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './create-user.dto';
import {
  normalizeRoles,
  permissionsForRoles,
  UserRole,
  userHasRole,
} from './roles';
import { User } from './user.entity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.migrateRolesColumn();
    await this.ensureSeedAdmin();
  }

  /** Garante `roles` jsonb + espelho `role`; corrige admin seed se ficou viewer. */
  private async migrateRolesColumn() {
    const stmts = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS roles jsonb DEFAULT '["viewer"]'::jsonb`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(32) DEFAULT 'viewer'`,
      `UPDATE users
          SET roles = jsonb_build_array(role)
        WHERE (roles IS NULL OR roles = 'null'::jsonb OR roles = '[]'::jsonb)
          AND role IS NOT NULL AND role <> ''`,
      `UPDATE users
          SET role = COALESCE(roles->>0, 'viewer')
        WHERE role IS NULL OR role = ''`,
    ];
    try {
      for (const sql of stmts) {
        await this.users.query(sql);
      }
      const adminEmail = (
        this.config.get<string>('AUTH_ADMIN_EMAIL') ?? 'admin@connectmax.local'
      )
        .trim()
        .toLowerCase();
      await this.users.query(
        `UPDATE users
           SET roles = '["admin"]'::jsonb, role = 'admin'
         WHERE email = $1
           AND NOT (roles @> '"admin"'::jsonb)`,
        [adminEmail],
      );
    } catch (err) {
      console.warn(
        '[auth] migrateRolesColumn:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async ensureSeedAdmin() {
    const email = (
      this.config.get<string>('AUTH_ADMIN_EMAIL') ?? 'admin@connectmax.local'
    )
      .trim()
      .toLowerCase();
    const password =
      this.config.get<string>('AUTH_ADMIN_PASSWORD') ?? 'ChangeMeAdmin!2026';
    const existing = await this.users.findOne({ where: { email } });
    if (existing) return;
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.users.save(
      this.users.create({
        email,
        nome: 'Admin',
        passwordHash,
        roles: [UserRole.Admin],
        role: UserRole.Admin,
        active: true,
      }),
    );
    console.log(`[auth] admin seed criado: ${email}`);
  }

  /** Aceita `roles` jsonb ou legado `role` varchar (se ainda existir na row). */
  userRoles(user: User & { role?: string }): UserRole[] {
    const fromArray = normalizeRoles(user.roles);
    if (fromArray.length) return fromArray;
    return normalizeRoles((user as { role?: string }).role);
  }

  primaryRole(roles: UserRole[]): UserRole {
    if (roles.includes(UserRole.Admin)) return UserRole.Admin;
    if (roles.includes(UserRole.Dev)) return UserRole.Dev;
    if (roles.includes(UserRole.Gestor)) return UserRole.Gestor;
    if (roles.includes(UserRole.Operador)) return UserRole.Operador;
    return roles[0] ?? UserRole.Viewer;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.users.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const roles = this.userRoles(user);
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      roles,
      role: this.primaryRole(roles),
    });
    return {
      accessToken,
      user: this.toPublic(user),
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  toPublic(user: User) {
    const roles = this.userRoles(user);
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      roles,
      /** Compat com UI antiga (role singular). */
      role: this.primaryRole(roles),
      active: user.active,
      permissions: permissionsForRoles(roles),
      createdAt: user.createdAt,
    };
  }

  async listUsers() {
    const rows = await this.users.find({ order: { createdAt: 'ASC' } });
    return rows.map((u) => this.toPublic(u));
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const clash = await this.users.findOne({ where: { email } });
    if (clash) throw new ConflictException('E-mail já cadastrado');
    const roles = normalizeRoles(dto.roles);
    if (!roles.length) {
      throw new BadRequestException('Informe ao menos uma role');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.save(
      this.users.create({
        email,
        nome: dto.nome.trim(),
        passwordHash,
        roles,
        role: this.primaryRole(roles),
        active: true,
      }),
    );
    return this.toPublic(user);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const hadGestor = userHasRole(this.userRoles(user), UserRole.Gestor);
    if (dto.nome != null) user.nome = dto.nome.trim();
    if (dto.roles != null) {
      const roles = normalizeRoles(dto.roles);
      if (!roles.length) {
        throw new BadRequestException('Informe ao menos uma role');
      }
      user.roles = roles;
      user.role = this.primaryRole(roles);
    }
    if (dto.active != null) user.active = dto.active;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    await this.users.save(user);

    const hasGestor = userHasRole(this.userRoles(user), UserRole.Gestor);
    if (hadGestor && !hasGestor) {
      await this.users.manager
        .createQueryBuilder()
        .delete()
        .from('gestor_agentes')
        .where('gestor_id = :id', { id })
        .execute();
    }

    return this.toPublic(user);
  }
}
