import { Module, forwardRef } from '@nestjs/common';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';
import { QrCodeService } from './qr-code.service';
import { DeviceTrackingService } from './device-tracking.service';
import { HardwareCatalogService } from './hardware-catalog.service';
import { HardwareCatalogController } from './hardware-catalog.controller';
import { HardwareCategoryService } from './hardware-category.service';
import { HardwareCategoryController } from './hardware-category.controller';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [forwardRef(() => WorkflowModule)],
  controllers: [HardwareController, HardwareCatalogController, HardwareCategoryController],
  providers: [HardwareService, QrCodeService, DeviceTrackingService, HardwareCatalogService, HardwareCategoryService],
  exports: [HardwareService, QrCodeService, HardwareCatalogService, HardwareCategoryService],
})
export class HardwareModule { }