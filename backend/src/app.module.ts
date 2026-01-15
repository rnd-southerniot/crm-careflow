import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ReportsModule } from './reports/reports.module';
import { HardwareModule } from './hardware/hardware.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommonModule } from './common/common.module';
import { ClientsModule } from './clients/clients.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    WorkflowModule,
    ReportsModule,
    HardwareModule,
    NotificationsModule,
    ClientsModule,
    HealthModule,
  ],
})
export class AppModule { }
