import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SopTemplateService } from './sop-template.service';
import { ReportSchemaService } from './report-schema.service';
import { ProductHardwareConfigService } from './product-hardware-config.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, SopTemplateService, ReportSchemaService, ProductHardwareConfigService],
  exports: [ProductsService, SopTemplateService, ReportSchemaService, ProductHardwareConfigService],
})
export class ProductsModule { }