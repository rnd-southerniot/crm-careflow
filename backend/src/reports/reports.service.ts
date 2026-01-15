import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TechnicalReport, Prisma, TaskStatus } from '@prisma/client';
import { ReportSchemaService, FormField } from '../products/report-schema.service';
import { DynamicFormService } from './dynamic-form.service';
import { FormValidationService } from './form-validation.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportSchemaService: ReportSchemaService,
    private readonly dynamicFormService: DynamicFormService,
    private readonly formValidationService: FormValidationService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Finds all technical reports associated with a specific task ID.
   *
   * @param taskId - The ID of the task.
   * @returns A list of technical reports, including task and submitter details.
   */
  async findByTaskId(taskId: string): Promise<TechnicalReport[]> {
    return this.prisma.technicalReport.findMany({
      where: { taskId },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        submitter: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }

  /**
   * Creates a new technical report.
   *
   * @param data - The data for the new report (taskId, submissionData, submittedBy, client info).
   * @returns The created technical report.
   * @throws NotFoundException if the task or user is not found.
   */
  async create(data: {
    taskId: string;
    submissionData: Record<string, any>;
    submittedBy: string;
    clientPhoneNumber?: string;
    clientName?: string;
  }): Promise<TechnicalReport> {
    // Check if task exists
    const task = await this.prisma.onboardingTask.findUnique({
      where: { id: data.taskId },
      include: { product: true },
    });

    if (!task) {
      throw new NotFoundException(`Onboarding task with ID ${data.taskId} not found`);
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.submittedBy },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${data.submittedBy} not found`);
    }

    // Get report schema for validation
    const reportSchema = await this.reportSchemaService.findByProductId(task.productId);
    const formStructure = reportSchema.formStructure as unknown as FormField[];

    // Validate and sanitize submission data against schema using FormValidationService
    const sanitizedData = this.formValidationService.enforceValidationRules(
      formStructure,
      data.submissionData
    );

    // Create the technical report
    const report = await this.prisma.technicalReport.create({
      data: {
        taskId: data.taskId,
        submissionData: sanitizedData as any,
        submittedBy: data.submittedBy,
      },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        submitter: {
          include: {
            role: true,
          },
        },
      },
    });

    // Status update is now handled manually via WorkflowService
    // await this.prisma.onboardingTask.update({
    //   where: { id: data.taskId },
    //   data: { currentStatus: TaskStatus.REQUIREMENTS_COMPLETE },
    // });

    // Send WhatsApp notification if client information is provided
    if (data.clientPhoneNumber && data.clientName) {
      try {
        await this.notificationsService.notifyReportSubmitted(
          data.clientPhoneNumber,
          data.clientName,
          data.taskId
        );
      } catch (error) {
        // Log error but don't fail the report creation
        console.error('Failed to send report submission notification:', error);
      }
    }

    return report;
  }

  /**
   * Finds a technical report by its ID.
   *
   * @param id - The ID of the technical report.
   * @returns The technical report object.
   * @throws NotFoundException if the report is not found.
   */
  async findById(id: string): Promise<TechnicalReport | null> {
    const report = await this.prisma.technicalReport.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        submitter: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Technical report with ID ${id} not found`);
    }

    return report;
  }

  /**
   * Updates an existing technical report.
   *
   * @param id - The ID of the report to update.
   * @param data - The data to update (submissionData).
   * @returns The updated technical report.
   * @throws NotFoundException if the report is not found.
   */
  async update(id: string, data: {
    submissionData?: Record<string, any>;
  }): Promise<TechnicalReport> {
    // Check if report exists
    const existingReport = await this.prisma.technicalReport.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingReport) {
      throw new NotFoundException(`Technical report with ID ${id} not found`);
    }

    // If updating submission data, validate against schema
    let sanitizedData = data.submissionData;
    if (data.submissionData) {
      const reportSchema = await this.reportSchemaService.findByProductId(
        existingReport.task.productId
      );
      const formStructure = reportSchema.formStructure as unknown as FormField[];

      // Validate and sanitize submission data using FormValidationService
      sanitizedData = this.formValidationService.enforceValidationRules(
        formStructure,
        data.submissionData
      );
    }

    return this.prisma.technicalReport.update({
      where: { id },
      data: {
        submissionData: sanitizedData as any,
      },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        submitter: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Finds an task by its ID.
   *
   * @param taskId - The ID of the task.
   * @returns The task object with product relation.
   * @throws NotFoundException if the task is not found.
   */
  async findTaskById(taskId: string) {
    const task = await this.prisma.onboardingTask.findUnique({
      where: { id: taskId },
      include: { product: true },
    });

    if (!task) {
      throw new NotFoundException(`Onboarding task with ID ${taskId} not found`);
    }

    return task;
  }

  /**
   * Deletes a technical report.
   *
   * @param id - The ID of the report to delete.
   * @returns The deleted technical report.
   * @throws NotFoundException if the report is not found.
   */
  async delete(id: string): Promise<TechnicalReport> {
    // Check if report exists
    await this.findById(id);

    return this.prisma.technicalReport.delete({
      where: { id },
    });
  }
}