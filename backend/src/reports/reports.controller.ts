import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { DynamicFormService } from './dynamic-form.service';
import { CreateTechnicalReportDto } from './dto/create-technical-report.dto';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly dynamicFormService: DynamicFormService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a technical report' })
  @ApiResponse({ status: 201, description: 'Technical report created successfully' })
  @ApiResponse({ status: 404, description: 'Task or User not found' })
  @Roles('IMPLEMENTATION_LEAD')
  @RequirePermissions('reports', ['create'])
  async create(@Body() createReportDto: CreateTechnicalReportDto, @Req() req: any) {
    return this.reportsService.create({
      taskId: createReportDto.taskId,
      submissionData: createReportDto.submissionData,
      submittedBy: req.user.id,
    });
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get reports for a task' })
  @ApiResponse({ status: 200, description: 'List of technical reports retrieved successfully' })
  @RequirePermissions('reports', ['read'])
  async findByTask(@Param('taskId') taskId: string) {
    return this.reportsService.findByTaskId(taskId);
  }

  @Get('task/:taskId/form-schema')
  @ApiOperation({ summary: 'Get dynamic form schema for a task' })
  @ApiResponse({ status: 200, description: 'Form schema retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @RequirePermissions('reports', ['read'])
  async getFormSchema(@Param('taskId') taskId: string) {
    // Get task to find product
    const task = await this.reportsService.findTaskById(taskId);

    // Get form schema for the product
    const formSchema = await this.dynamicFormService.getFormSchemaForProduct(task.productId);

    return {
      taskId,
      productId: task.productId,
      formFields: this.dynamicFormService.generateFormFields(formSchema.formStructure as any),
    };
  }

  @Get('schema/:productId')
  @ApiOperation({ summary: 'Get report schema for a product' })
  @ApiResponse({ status: 200, description: 'Report schema retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Schema not found' })
  @RequirePermissions('reports', ['read'])
  async getReportSchemaByProduct(@Param('productId') productId: string) {
    const reportSchema = await this.dynamicFormService.getFormSchemaForProduct(productId);

    if (!reportSchema || !reportSchema.formStructure) {
      return null;
    }

    return {
      id: reportSchema.id,
      productId: reportSchema.productId,
      title: `Technical Report`,
      description: `Complete the technical report for this product`,
      formStructure: this.dynamicFormService.generateFormFields(reportSchema.formStructure as any),
      version: 1,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Technical report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Technical report not found' })
  @RequirePermissions('reports', ['read'])
  async findOne(@Param('id') id: string) {
    return this.reportsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a technical report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Technical report updated successfully' })
  @ApiResponse({ status: 404, description: 'Technical report not found' })
  @Roles('ADMIN')
  @RequirePermissions('reports', ['update'])
  async update(
    @Param('id') id: string,
    @Body() updateData: { submissionData: Record<string, any> },
  ) {
    return this.reportsService.update(id, updateData);
  }
}