import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingTask, Prisma, TaskStatus } from '@prisma/client';
import { SopTemplateService, SOPStep } from '../products/sop-template.service';
import { StatusTransitionService } from './status-transition.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QrCodeService } from '../hardware/qr-code.service';
import { LorawanWebhookService } from '../integrations/lorawan';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sopTemplateService: SopTemplateService,
    private readonly statusTransitionService: StatusTransitionService,
    private readonly notificationsService: NotificationsService,
    private readonly qrCodeService: QrCodeService,
    private readonly lorawanWebhookService: LorawanWebhookService,
  ) {}

  /**
   * Retrieves all onboarding tasks.
   *
   * @returns A list of all onboarding tasks with related data (client, product, assigned user, reports, provisionings).
   */
  async findAll(): Promise<OnboardingTask[]> {
    return this.prisma.onboardingTask.findMany({
      include: {
        client: true,
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
        technicalReports: true,
        deviceProvisionings: true,
        hardwareProcurements: {
          include: { hardware: { include: { category: true } } }
        },
      },
    });
  }

  /**
   * Finds an onboarding task by its ID.
   *
   * @param id - The ID of the task.
   * @returns The onboarding task object with all relations.
   * @throws NotFoundException if the task is not found.
   */
  async findById(id: string): Promise<OnboardingTask | null> {
    const task = await this.prisma.onboardingTask.findUnique({
      where: { id },
      include: {
        client: true,
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
        technicalReports: true,
        deviceProvisionings: true,
        hardwareProcurements: {
          include: { hardware: { include: { category: true } } }
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Onboarding task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Finds onboarding tasks associated with a specific client name.
   *
   * @param clientName - The name of the client.
   * @returns A list of onboarding tasks.
   */
  async findByClientName(clientName: string): Promise<OnboardingTask[]> {
    return this.prisma.onboardingTask.findMany({
      where: { clientName },
      include: {
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
        technicalReports: true,
        deviceProvisionings: true,
        hardwareProcurements: {
          include: { hardware: { include: { category: true } } }
        },
      },
    });
  }

  /**
   * Finds onboarding tasks assigned to a specific user.
   *
   * @param userId - The ID of the user.
   * @returns A list of onboarding tasks.
   */
  async findByAssignedUser(userId: string): Promise<OnboardingTask[]> {
    return this.prisma.onboardingTask.findMany({
      where: { assignedUserId: userId },
      include: {
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
        technicalReports: true,
        deviceProvisionings: true,
        hardwareProcurements: {
          include: { hardware: { include: { category: true } } }
        },
      },
    });
  }

  /**
   * Creates a new onboarding task.
   *
   * @param data - The data for the new task (client info, productId, assignedUserId).
   * @returns The created onboarding task.
   * @throws NotFoundException if client, product, or assigned user is not found.
   * @throws BadRequestException if client is inactive or required client info is missing.
   */
  async create(data: {
    clientId?: string;
    clientName?: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress?: string;
    contactPerson: string;
    productId: string;
    assignedUserId?: string;
  }): Promise<OnboardingTask> {
    // Resolve client data - either from clientId or direct input
    let resolvedClientName: string;
    let resolvedClientAddress: string;
    let resolvedClientId: string | undefined;
    if (data.clientId) {
      // Fetch client data
      const client = await this.prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${data.clientId} not found`);
      }

      if (!client.isActive) {
        throw new BadRequestException(`Client "${client.name}" is inactive`);
      }

      resolvedClientId = client.id;
      resolvedClientName = client.name;
      // Allow address override (for different factory locations)
      resolvedClientAddress = data.clientAddress || client.address;
    } else {
      // Direct input - require clientName and clientAddress
      if (!data.clientName) {
        throw new BadRequestException('Client name is required when not selecting an existing client');
      }
      if (!data.clientAddress) {
        throw new BadRequestException('Client address is required when not selecting an existing client');
      }

      // Find or create the client record to ensure persistence in the "Clients" section
      const client = await this.prisma.client.upsert({
        where: { name: data.clientName },
        update: {
          address: data.clientAddress, // Update address in case it changed
          isActive: true, // Re-activate if it was inactive
        },
        create: {
          name: data.clientName,
          address: data.clientAddress,
        },
      });

      resolvedClientId = client.id;
      resolvedClientName = client.name;
      resolvedClientAddress = data.clientAddress;
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Check if assigned user exists (if provided)
    if (data.assignedUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.assignedUserId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${data.assignedUserId} not found`);
      }
    }

    // Create SOP snapshot
    const sopSnapshot = await this.sopTemplateService.createSnapshot(data.productId);

    const task = await this.prisma.onboardingTask.create({
      data: {
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientAddress: resolvedClientAddress,
        contactPerson: data.contactPerson,
        productId: data.productId,
        assignedUserId: data.assignedUserId,
        currentStatus: TaskStatus.INITIALIZATION,
        sopSnapshot: sopSnapshot as any,
      },
      include: {
        client: true,
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
      },
    });

    // Send WhatsApp notification
    try {
      await this.notificationsService.notifyTaskCreated(
        data.clientPhone,
        resolvedClientName,
        product.name
      );
    } catch (error) {
      // Log error but don't fail the task creation
      console.error('Failed to send task creation notification:', error);
    }

    return task;
  }

  /**
   * Updates the status of an onboarding task.
   * Handles validation, side effects (notifications, cleanups), and specific transition logic.
   *
   * @param id - The ID of the task to update.
   * @param status - The new status to transition to.
   * @param userRole - The role of the user performing the update.
   * @param userId - The ID of the user performing the update.
   * @param updateData - Additional data required for the transition (e.g., scheduledDate, reportData).
   * @returns The updated onboarding task.
   * @throws BadRequestException if the transition is invalid or required data is missing.
   * @throws NotFoundException if the task is not found.
   */
  async updateStatus(id: string, status: TaskStatus, userRole?: string, userId?: string, updateData?: any): Promise<OnboardingTask> {
    // Check if task exists
    const existingTask = await this.findById(id) as any;

    // Validate status transition using StatusTransitionService
    this.statusTransitionService.validateTransition(
      existingTask.currentStatus,
      status,
      userRole
    );

    // Handle cleanup when reverting to earlier statuses
    // Reversion to REQUIREMENTS_COMPLETE: clean up hardware procurements and device provisionings
    if (status === TaskStatus.REQUIREMENTS_COMPLETE &&
      (existingTask.currentStatus === TaskStatus.HARDWARE_PROCUREMENT_COMPLETE ||
        existingTask.currentStatus === TaskStatus.HARDWARE_PREPARED_COMPLETE ||
        existingTask.currentStatus === TaskStatus.READY_FOR_INSTALLATION)) {
      // Delete device provisionings first (due to potential foreign key constraints)
      await this.prisma.deviceProvisioning.deleteMany({ where: { taskId: id } });
      // Delete hardware procurements
      await this.prisma.hardwareProcurement.deleteMany({ where: { taskId: id } });
    }

    // Reversion to HARDWARE_PROCUREMENT_COMPLETE: clean up device provisionings
    if (status === TaskStatus.HARDWARE_PROCUREMENT_COMPLETE &&
      (existingTask.currentStatus === TaskStatus.HARDWARE_PREPARED_COMPLETE ||
        existingTask.currentStatus === TaskStatus.READY_FOR_INSTALLATION)) {
      await this.prisma.deviceProvisioning.deleteMany({ where: { taskId: id } });
    }

    // Reversion to HARDWARE_PREPARED_COMPLETE: reset QR codes on device provisionings
    if (status === TaskStatus.HARDWARE_PREPARED_COMPLETE &&
      existingTask.currentStatus === TaskStatus.READY_FOR_INSTALLATION) {
      // Reset QR codes to PENDING since they should be regenerated when moving forward again
      await this.prisma.deviceProvisioning.updateMany({
        where: { taskId: id },
        data: { qrCode: 'PENDING' }
      });
    }

    // Determine if this is a forward transition or revert
    const isForwardTransition = this.statusTransitionService.isValidTransition(
      existingTask.currentStatus,
      status
    );

    // Specific validation based on target status (only for forward transitions)
    if (status === TaskStatus.SCHEDULED_VISIT && isForwardTransition) {
      if (!updateData?.scheduledDate) {
        throw new BadRequestException('Scheduled date is required for this transition');
      }
    }

    if (status === TaskStatus.REQUIREMENTS_COMPLETE && isForwardTransition) {
      // Check if report data is provided in the transition payload
      if (updateData?.reportData) {
        // Create the technical report during the transition
        const submitterId = userId || existingTask.assignedUserId;
        if (!submitterId) {
          throw new BadRequestException('A valid user ID is required to submit a report');
        }
        await this.prisma.technicalReport.create({
          data: {
            taskId: id,
            submittedBy: submitterId,
            submissionData: updateData.reportData,
          }
        });
      } else if (!existingTask.technicalReports || existingTask.technicalReports.length === 0) {
        // No existing report and no new report data provided
        throw new BadRequestException('A technical report must be submitted before completing requirements');
      }
    }

    // Handle Hardware Procurement - Create HardwareProcurement records (not devices yet)
    if (status === TaskStatus.HARDWARE_PROCUREMENT_COMPLETE && isForwardTransition) {
      if (!updateData?.hardwareList || !Array.isArray(updateData.hardwareList) || updateData.hardwareList.length === 0) {
        throw new BadRequestException('List of hardware is required for this transition');
      }

      // Check if procurement records already exist for this task
      const existingProcurements = await this.prisma.hardwareProcurement.count({ where: { taskId: id } });
      if (existingProcurements > 0) {
        // Delete existing procurements to allow re-submission
        await this.prisma.hardwareProcurement.deleteMany({ where: { taskId: id } });
      }

      // Create hardware procurement records (hardware + quantity, no serial/firmware yet)
      for (const item of updateData.hardwareList) {
        if (!item.hardwareId || !item.quantity || item.quantity < 1) {
          throw new BadRequestException('Each procurement item must have a valid hardwareId and quantity >= 1');
        }

        await this.prisma.hardwareProcurement.create({
          data: {
            taskId: id,
            hardwareId: item.hardwareId,
            quantity: item.quantity,
            notes: item.notes || null,
          }
        });
      }
    }

    // Handle Hardware Prepared - Create DeviceProvisioning records with serial and firmware
    if (status === TaskStatus.HARDWARE_PREPARED_COMPLETE && isForwardTransition) {
      if (!updateData?.deviceList || !Array.isArray(updateData.deviceList) || updateData.deviceList.length === 0) {
        throw new BadRequestException('List of prepared devices with serial numbers and firmware versions is required');
      }

      // Validate that we have procurement records
      const procurements = await this.prisma.hardwareProcurement.findMany({
        where: { taskId: id },
        include: { hardware: true }
      });

      if (procurements.length === 0) {
        throw new BadRequestException('No hardware procurement records found. Please complete hardware procurement first.');
      }

      // Calculate total expected devices from procurements
      const expectedDeviceCount = procurements.reduce((sum, p) => sum + p.quantity, 0);

      if (updateData.deviceList.length !== expectedDeviceCount) {
        throw new BadRequestException(
          `Expected ${expectedDeviceCount} devices based on procurement, but received ${updateData.deviceList.length}`
        );
      }

      // Check for existing device provisionings
      const existingDevices = await this.prisma.deviceProvisioning.count({ where: { taskId: id } });
      if (existingDevices > 0) {
        // Delete existing devices to allow re-submission
        await this.prisma.deviceProvisioning.deleteMany({ where: { taskId: id } });
      }

      const provisionerId = userId || existingTask.assignedUserId;

      if (!provisionerId) {
        throw new BadRequestException('A valid user ID is required to provision devices');
      }

      // Get product to check if it's a LoRaWAN product
      const product = await this.prisma.product.findUnique({ where: { id: existingTask.productId } });
      const isLorawanProduct = product?.isLorawanProduct ?? false;

      // Create device provisioning records
      for (const device of updateData.deviceList) {
        if (!device.deviceSerial || !device.firmwareVersion || !device.hardwareId) {
          throw new BadRequestException('Each device must have deviceSerial, firmwareVersion, and hardwareId');
        }

        // Get hardware info for deviceType
        const hardware = await this.prisma.hardware.findUnique({ where: { id: device.hardwareId } });

        await this.prisma.deviceProvisioning.create({
          data: {
            taskId: id,
            deviceSerial: device.deviceSerial,
            deviceType: hardware?.name || device.deviceType || 'Unknown',
            hardwareId: device.hardwareId,
            firmwareVersion: device.firmwareVersion,
            qrCode: 'PENDING', // Will be generated in READY_FOR_INSTALLATION step
            provisionedBy: provisionerId,
            notes: device.notes || null,
            // LoRaWAN fields
            devEui: device.devEui || null,
            appKey: device.appKey || null,
            lorawanProvisioningStatus: isLorawanProduct ? 'PENDING' : 'NOT_APPLICABLE',
          }
        });
      }
    }

    // Handle Ready for Installation - Generate QR Codes with client tracking info
    if (status === TaskStatus.READY_FOR_INSTALLATION) {
      const devices = await this.prisma.deviceProvisioning.findMany({
        where: { taskId: id },
        include: { hardware: true }
      });

      for (const device of devices) {
        // Generate a base64 QR code image with full client tracking information
        // This QR code includes:
        // 1. Which client the hardware was provisioned for (clientName, clientAddress, contactPerson)
        // 2. Which specific hardware piece the QR code is for (deviceSerial, deviceType, hardwareId)
        const qrCode = await this.qrCodeService.generateDeviceQRCodeWithClientInfo({
          deviceSerial: device.deviceSerial,
          deviceType: device.deviceType,
          hardwareId: device.hardwareId || '',
          taskId: id,
          clientName: existingTask.clientName,
          clientAddress: existingTask.clientAddress,
          contactPerson: existingTask.contactPerson,
        });

        await this.prisma.deviceProvisioning.update({
          where: { id: device.id },
          data: { qrCode }
        });
      }

      // Fire-and-forget LoRaWAN provisioning webhook (don't block status update)
      this.lorawanWebhookService.sendProvisioningWebhook(id).catch(err => {
        this.logger.error(`LoRaWAN webhook failed for task ${id}: ${err.message}`);
      });
    }

    const updatePayload: any = { currentStatus: status };
    if (status === TaskStatus.SCHEDULED_VISIT && updateData?.scheduledDate) {
      updatePayload.scheduledDate = new Date(updateData.scheduledDate);
    }

    return this.prisma.onboardingTask.update({
      where: { id },
      data: updatePayload,
      include: {
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
        technicalReports: true,
        deviceProvisionings: true,
        hardwareProcurements: {
          include: { hardware: { include: { category: true } } }
        },
      },
    });
  }

  /**
   * Assigns a user to an onboarding task.
   *
   * @param taskId - The ID of the task.
   * @param userId - The ID of the user to assign.
   * @returns The updated onboarding task.
   * @throws NotFoundException if task or user is not found.
   */
  async assignUser(taskId: string, userId: string): Promise<OnboardingTask> {
    // Check if task exists
    await this.findById(taskId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.onboardingTask.update({
      where: { id: taskId },
      data: { assignedUserId: userId },
      include: {
        product: true,
        assignedUser: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves the SOP snapshot for a specific task.
   *
   * @param taskId - The ID of the task.
   * @returns A list of SOP steps.
   */
  async getSopSnapshot(taskId: string): Promise<SOPStep[]> {
    const task = await this.findById(taskId);
    return (task.sopSnapshot as unknown) as SOPStep[];
  }
}