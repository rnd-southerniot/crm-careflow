import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Basic service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    // Quick DB connectivity check.
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, timestamp: new Date().toISOString() };
  }
}

