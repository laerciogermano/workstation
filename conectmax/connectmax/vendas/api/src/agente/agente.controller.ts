import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AuthPrincipal } from '../auth/auth-user';
import { Resource } from '../auth/resource.decorator';
import { assertAgentScope } from './agent-scope';
import { CompleteJobDto, FailJobDto } from './complete-job.dto';
import { DeviceStatusDto } from './device-status.dto';
import { HeartbeatDto } from './heartbeat.dto';
import { AgenteService } from './agente.service';

@Controller('agente')
@Resource('agente')
export class AgenteController {
  constructor(private readonly agente: AgenteService) {}

  /**
   * Capacidade por host (default máx. 4 ativos) + candidatos a wake.
   * Declarado antes de `:agentId` para não capturar "slots" como id.
   */
  @Get('slots')
  slots(@Query('hostKey') hostKey?: string) {
    return this.agente.slots(hostKey);
  }

  /**
   * Próximo job por prioridade (AC-01…04). Materializa filas + SKIP LOCKED.
   */
  @Post(':agentId/claim')
  claim(
    @Param('agentId') agentId: string,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.claimNext(agentId);
  }

  /** Presença do worker (online se lastHeartbeat < AGENT_HEARTBEAT_STALE_MS). */
  @Post(':agentId/heartbeat')
  heartbeat(
    @Param('agentId') agentId: string,
    @Body() dto: HeartbeatDto,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.heartbeat(agentId, {
      hostInstanceId: dto?.hostInstanceId,
      workerVersion: dto?.workerVersion,
    });
  }

  /**
   * Sincroniza status após docker start/stop **local** no host do worker.
   * Não executa SSH/docker na API.
   */
  @Post(':agentId/device-status')
  deviceStatus(
    @Param('agentId') agentId: string,
    @Body() dto: DeviceStatusDto,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.setDeviceStatus(agentId, dto.status);
  }

  /** Preview sem claim: pending counts + próximo candidato. */
  @Get(':agentId/peek')
  peek(
    @Param('agentId') agentId: string,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.peek(agentId);
  }

  @Get(':agentId/jobs')
  listJobs(
    @Param('agentId') agentId: string,
    @Req() req: { user?: AuthPrincipal },
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.listJobs(agentId, {
      status,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':agentId/runtime')
  runtime(
    @Param('agentId') agentId: string,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.runtimeStatus(agentId);
  }

  @Post(':agentId/jobs/:jobId/complete')
  complete(
    @Param('agentId') agentId: string,
    @Param('jobId') jobId: string,
    @Body() dto: CompleteJobDto,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.complete(agentId, jobId, { result: dto?.result });
  }

  @Post(':agentId/jobs/:jobId/fail')
  fail(
    @Param('agentId') agentId: string,
    @Param('jobId') jobId: string,
    @Body() dto: FailJobDto,
    @Req() req: { user?: AuthPrincipal },
  ) {
    assertAgentScope(req.user, agentId);
    return this.agente.fail(agentId, jobId, dto.error);
  }
}
