import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DynamicFormService } from './dynamic-form.service';
import { FormValidationService } from './form-validation.service';
import { ProductsModule } from '../products/products.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ProductsModule, WorkflowModule, NotificationsModule],
  controllers: [ReportsController],
  providers: [ReportsService, DynamicFormService, FormValidationService],
  exports: [ReportsService, DynamicFormService, FormValidationService],
})
export class ReportsModule {}