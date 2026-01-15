import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkflowService } from './workflow.service';
import { StatusTransitionService } from './status-transition.service';
import { CreateOnboardingTaskDto } from './dto/create-onboarding-task.dto';
import { TaskStatus } from '@prisma/client';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';

@ApiTags('Workflow')
@Controller('workflow')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly statusTransitionService: StatusTransitionService,
  ) { }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all onboarding tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @RequirePermissions('onboarding', ['read'])
  async findAllTasks() {
    return this.workflowService.findAll();
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get onboarding task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @RequirePermissions('onboarding', ['read'])
  async findTask(@Param('id') id: string) {
    return this.workflowService.findById(id);
  }

  @Get('tasks/:id/sop-snapshot')
  @ApiOperation({ summary: 'Get SOP snapshot for task' })
  @ApiResponse({ status: 200, description: 'SOP snapshot retrieved successfully' })
  @RequirePermissions('onboarding', ['read'])
  async getSopSnapshot(@Param('id') id: string) {
    return this.workflowService.getSopSnapshot(id);
  }

  @Get('tasks/client/:clientName')
  @ApiOperation({ summary: 'Get tasks by client Name' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @RequirePermissions('onboarding', ['read'])
  async findTasksByClient(@Param('clientName') clientName: string) {
    return this.workflowService.findByClientName(clientName);
  }

  @Get('tasks/user/:userId')
  @ApiOperation({ summary: 'Get tasks assigned to user' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @RequirePermissions('onboarding', ['read'])
  async findTasksByUser(@Param('userId') userId: string) {
    return this.workflowService.findByAssignedUser(userId);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create new onboarding task (Sales/Admin only)' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Roles('SALES', 'ADMIN')
  @RequirePermissions('onboarding', ['create'])
  async createTask(@Body() createTaskDto: CreateOnboardingTaskDto) {
    return this.workflowService.create(createTaskDto);
  }

  @Put('tasks/:id/status/:status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @RequirePermissions('onboarding', ['update'])
  async updateTaskStatus(
    @Param('id') id: string,
    @Param('status') status: TaskStatus,
    @Body() updateData: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.workflowService.updateStatus(id, status, req.user?.role?.name, req.user?.id, updateData);
  }

  @Put('tasks/:id/assign/:userId')
  @ApiOperation({ summary: 'Assign task to user' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 404, description: 'Task or user not found' })
  @RequirePermissions('onboarding', ['update'])
  async assignTask(@Param('id') id: string, @Param('userId') userId: string) {
    return this.workflowService.assignUser(id, userId);
  }
}