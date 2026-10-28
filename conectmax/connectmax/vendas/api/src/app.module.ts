import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientConnectionLinkedin } from './client-connections-linkedin/client-connection-linkedin.entity';
import { ClientConnectionsLinkedinModule } from './client-connections-linkedin/client-connections-linkedin.module';
import { ClientLinkedinMessage } from './client-linkedin-messages/client-linkedin-message.entity';
import { ClientLinkedinMessagesModule } from './client-linkedin-messages/client-linkedin-messages.module';
import { ClienteLinkedin } from './clientes/cliente-linkedin.entity';
import { Cliente } from './clientes/cliente.entity';
import { ClientesModule } from './clientes/clientes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { Empresa } from './empresas/empresa.entity';
import { EmpresasModule } from './empresas/empresas.module';
import { ExtractModule } from './extract/extract.module';
import { LinkedinBaseModule } from './linkedin-base/linkedin-base.module';
import { ProfileDetailsModule } from './profile-details/profile-details.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AgentJob } from './agente/agent-job.entity';
import { AgentRuntime } from './agente/agent-runtime.entity';
import { AgenteModule } from './agente/agente.module';
import { Agente } from './agentes/agente.entity';
import { AgentesModule } from './agentes/agentes.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { GestorAgente } from './gestores/gestor-agente.entity';
import { GestoresModule } from './gestores/gestores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'connectmax'),
        password: config.get<string>('DB_PASSWORD', 'connectmax'),
        database: config.get<string>('DB_NAME', 'connectmax'),
        entities: [
          Cliente,
          ClienteLinkedin,
          ClientConnectionLinkedin,
          ClientLinkedinMessage,
          Empresa,
          Agente,
          GestorAgente,
          AgentJob,
          AgentRuntime,
          User,
        ],
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    AuthModule,
    ProfilesModule,
    ProfileDetailsModule,
    ClientesModule,
    EmpresasModule,
    AgentesModule,
    GestoresModule,
    AgenteModule,
    ClientConnectionsLinkedinModule,
    ClientLinkedinMessagesModule,
    LinkedinBaseModule,
    DashboardModule,
    ExtractModule,
  ],
})
export class AppModule {}
