import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { SopTemplateService } from './sop-template.service';
import { ReportSchemaService } from './report-schema.service';
import { ProductHardwareConfigService, CreateProductHardwareConfigDto, UpdateProductHardwareConfigDto } from './product-hardware-config.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly sopTemplateService: SopTemplateService,
    private readonly reportSchemaService: ReportSchemaService,
    private readonly productHardwareConfigService: ProductHardwareConfigService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @RequirePermissions('products', ['read'])
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @RequirePermissions('products', ['read'])
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get(':id/variations')
  @ApiOperation({ summary: 'Get product variations' })
  @ApiResponse({ status: 200, description: 'Product variations retrieved successfully' })
  @RequirePermissions('products', ['read'])
  async findVariations(@Param('id') id: string) {
    return this.productsService.findVariations(id);
  }

  @Get(':id/sop-template')
  @ApiOperation({ summary: 'Get SOP template for product' })
  @ApiResponse({ status: 200, description: 'SOP template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'SOP template not found' })
  @RequirePermissions('products', ['read'])
  async getSopTemplate(@Param('id') id: string) {
    return this.sopTemplateService.findByProductId(id);
  }

  @Get(':id/report-schema')
  @ApiOperation({ summary: 'Get report schema for product' })
  @ApiResponse({ status: 200, description: 'Report schema retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report schema not found' })
  @RequirePermissions('products', ['read'])
  async getReportSchema(@Param('id') id: string) {
    return this.reportSchemaService.findByProductId(id);
  }

  // ==================== Hardware Configs ====================

  @Get(':id/hardware-configs')
  @ApiOperation({ summary: 'Get compatible hardware configurations for product' })
  @ApiResponse({ status: 200, description: 'Hardware configs retrieved successfully' })
  @RequirePermissions('products', ['read'])
  async getHardwareConfigs(@Param('id') id: string) {
    return this.productHardwareConfigService.getConfigsForProduct(id);
  }

  @Get(':id/hardware-configs/for-provisioning')
  @ApiOperation({ summary: 'Get compatible hardware for device provisioning' })
  @ApiResponse({ status: 200, description: 'Compatible hardware retrieved successfully' })
  @RequirePermissions('products', ['read'])
  async getHardwareForProvisioning(@Param('id') id: string) {
    return this.productHardwareConfigService.getCompatibleHardwareForProvisioning(id);
  }

  @Post(':id/hardware-configs')
  @ApiOperation({ summary: 'Add hardware configuration to product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Hardware config added successfully' })
  @ApiResponse({ status: 409, description: 'Config already exists for this hardware' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async addHardwareConfig(
    @Param('id') id: string,
    @Body() createDto: CreateProductHardwareConfigDto
  ) {
    return this.productHardwareConfigService.addConfig(id, createDto);
  }

  @Put(':id/hardware-configs/:configId')
  @ApiOperation({ summary: 'Update hardware configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Hardware config updated successfully' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async updateHardwareConfig(
    @Param('configId') configId: string,
    @Body() updateDto: UpdateProductHardwareConfigDto
  ) {
    return this.productHardwareConfigService.updateConfig(configId, updateDto);
  }

  @Delete(':id/hardware-configs/:configId')
  @ApiOperation({ summary: 'Remove hardware configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Hardware config removed successfully' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async removeHardwareConfig(@Param('configId') configId: string) {
    return this.productHardwareConfigService.removeConfig(configId);
  }

  @Post(':id/hardware-configs/:configId/set-default')
  @ApiOperation({ summary: 'Set hardware as default for product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Default hardware set successfully' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async setDefaultHardware(@Param('configId') configId: string) {
    return this.productHardwareConfigService.setDefaultHardware(configId);
  }

  // ==================== Product CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create new product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Product code already exists' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['create'])
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product code already exists' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete product with variations or associated tasks' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['delete'])
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post(':id/sop-template')
  @ApiOperation({ summary: 'Create SOP template for product (Admin only)' })
  @ApiResponse({ status: 201, description: 'SOP template created successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'SOP template already exists' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async createSopTemplate(@Param('id') id: string, @Body() createSopDto: import('./dto/create-sop-template.dto').CreateSOPTemplateDto) {
    // Ensure productId matches route param
    createSopDto.productId = id;
    return this.sopTemplateService.create(createSopDto);
  }

  @Post(':id/report-schema')
  @ApiOperation({ summary: 'Create report schema for product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Report schema created successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Report schema already exists' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async createReportSchema(@Param('id') id: string, @Body() createSchemaDto: import('./dto/create-report-schema.dto').CreateReportSchemaDto) {
    // Ensure productId matches route param
    createSchemaDto.productId = id;
    return this.reportSchemaService.create(createSchemaDto);
  }

  @Put(':id/sop-template')
  @ApiOperation({ summary: 'Update SOP template for product (Admin only)' })
  @ApiResponse({ status: 200, description: 'SOP template updated successfully' })
  @ApiResponse({ status: 404, description: 'Product or SOP template not found' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async updateSopTemplate(@Param('id') id: string, @Body() updateSopDto: import('./dto/update-sop-template.dto').UpdateSOPTemplateDto) {
    return this.sopTemplateService.updateByProductId(id, updateSopDto);
  }

  @Put(':id/report-schema')
  @ApiOperation({ summary: 'Update report schema for product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report schema updated successfully' })
  @ApiResponse({ status: 404, description: 'Product or report schema not found' })
  @Roles('ADMIN')
  @RequirePermissions('products', ['update'])
  async updateReportSchema(@Param('id') id: string, @Body() updateSchemaDto: import('./dto/update-report-schema.dto').UpdateReportSchemaDto) {
    return this.reportSchemaService.updateByProductId(id, updateSchemaDto);
  }
}