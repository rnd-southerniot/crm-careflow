import { Module, forwardRef } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { StatusTransitionService } from './status-transition.service';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HardwareModule } from '../hardware/hardware.module';
import { LorawanModule } from '../integrations/lorawan';

@Module({
  imports: [ProductsModule, NotificationsModule, forwardRef(() => HardwareModule), LorawanModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, StatusTransitionService],
  exports: [WorkflowService],
})
export class WorkflowModule {}