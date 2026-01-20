import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LorawanProvisionPayloadDto, LorawanDeviceDto } from './dto/lorawan-provision.dto';
import { LorawanProvisioningStatus, WebhookStatus } from '@prisma/client';

@Injectable()
export class LorawanWebhookService {
  private readonly logger = new Logger(LorawanWebhookService.name);
  private readonly lorawanManagerUrl: string;
  private readonly lorawanManagerApiKey: string;
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000]; // Exponential backoff delays in ms

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.lorawanManagerUrl = this.configService.get<string>('LORAWAN_MANAGER_URL', '');
    this.lorawanManagerApiKey = this.configService.get<string>('LORAWAN_MANAGER_API_KEY', '');
  }

  /**
   * Check if LoRaWAN integration is configured
   */
  isConfigured(): boolean {
    return !!(this.lorawanManagerUrl && this.lorawanManagerApiKey);
  }

  /**
   * Send a provisioning webhook to LoRaWAN Manager
   * @param taskId - The onboarding task ID
   * @returns boolean indicating success
   */
  async sendProvisioningWebhook(taskId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn('LoRaWAN Manager integration not configured, skipping webhook');
      return false;
    }

    try {
      // 1. Load task with all related data
      const task = await this.prisma.onboardingTask.findUnique({
        where: { id: taskId },
        include: {
          product: true,
          deviceProvisionings: {
            include: { hardware: true },
          },
        },
      });

      if (!task) {
        this.logger.error(`Task ${taskId} not found`);
        return false;
      }

      // 2. Check if this is a LoRaWAN product
      if (!task.product.isLorawanProduct) {
        this.logger.debug(`Task ${taskId} product is not a LoRaWAN product, skipping webhook`);
        return false;
      }

      // 3. Build the webhook payload
      const payload = this.buildPayload(task);

      // 4. Create webhook log entry
      const webhookLog = await this.prisma.webhookLog.create({
        data: {
          taskId,
          webhookType: 'lorawan_provision',
          endpoint: `${this.lorawanManagerUrl}/webhooks/crm-careflow/provision`,
          payload: payload as any,
          status: WebhookStatus.PENDING,
          attempts: 0,
        },
      });

      // 5. Update device provisioning statuses to IN_PROGRESS
      await this.updateDeviceStatuses(taskId, LorawanProvisioningStatus.IN_PROGRESS);

      // 6. Send with retry logic
      const success = await this.sendWithRetry(webhookLog.id, payload);

      // 7. Update final statuses based on result
      if (success) {
        await this.updateDeviceStatuses(taskId, LorawanProvisioningStatus.COMPLETED);
      } else {
        await this.updateDeviceStatuses(taskId, LorawanProvisioningStatus.FAILED, 'Webhook delivery failed after retries');
      }

      return success;
    } catch (error) {
      this.logger.error(`Failed to send LoRaWAN provisioning webhook for task ${taskId}:`, error);
      await this.updateDeviceStatuses(taskId, LorawanProvisioningStatus.FAILED, error.message);
      return false;
    }
  }

  /**
   * Build the webhook payload from task data
   */
  private buildPayload(task: any): LorawanProvisionPayloadDto {
    // Map device provisionings to LoRaWAN device DTOs
    const devices: LorawanDeviceDto[] = task.deviceProvisionings.map((device: any) => ({
      id: device.id,
      deviceSerial: device.deviceSerial,
      deviceType: device.deviceType,
      firmwareVersion: device.firmwareVersion,
      hardwareId: device.hardwareId,
      devEui: device.devEui,
      appKey: device.appKey,
      notes: device.notes,
    }));

    // Identify gateway device (typically the first device of gateway type or marked as gateway)
    const gatewayDevice = task.deviceProvisionings.find((d: any) =>
      d.deviceType?.toLowerCase().includes('gateway') ||
      d.hardware?.name?.toLowerCase().includes('gateway')
    );

    const payload: LorawanProvisionPayloadDto = {
      eventType: 'task.ready_for_provisioning',
      taskId: task.id,
      clientName: task.clientName,
      clientAddress: task.clientAddress,
      productName: task.product.name,
      productCode: task.product.code,
      region: task.product.lorawanRegion || 'EU868',
      devices,
      contactEmail: task.clientEmail,
      contactPhone: task.clientPhone,
      latitude: task.latitude,
      longitude: task.longitude,
    };

    // Add gateway info if identified
    if (gatewayDevice) {
      payload.gateway = {
        id: gatewayDevice.id,
        deviceSerial: gatewayDevice.deviceSerial,
        deviceType: gatewayDevice.deviceType,
        firmwareVersion: gatewayDevice.firmwareVersion,
        devEui: gatewayDevice.devEui,
        notes: gatewayDevice.notes,
      };
    }

    return payload;
  }

  /**
   * Send webhook with exponential backoff retry logic
   */
  private async sendWithRetry(webhookLogId: string, payload: LorawanProvisionPayloadDto): Promise<boolean> {
    const endpoint = `${this.lorawanManagerUrl}/webhooks/crm-careflow/provision`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Update attempt count
        await this.prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            attempts: attempt + 1,
            lastAttempt: new Date(),
            status: attempt > 0 ? WebhookStatus.RETRYING : WebhookStatus.PENDING,
          },
        });

        this.logger.debug(`Sending LoRaWAN webhook (attempt ${attempt + 1}/${this.maxRetries})`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.lorawanManagerApiKey,
          },
          body: JSON.stringify(payload),
        });

        const responseBody = await response.text();
        let responseJson: any = null;
        try {
          responseJson = JSON.parse(responseBody);
        } catch {
          // Response is not JSON
        }

        if (response.ok) {
          // Success
          await this.prisma.webhookLog.update({
            where: { id: webhookLogId },
            data: {
              status: WebhookStatus.SUCCESS,
              statusCode: response.status,
              response: responseJson || { raw: responseBody },
            },
          });
          this.logger.log(`LoRaWAN webhook sent successfully for task ${payload.taskId}`);
          return true;
        } else {
          // Non-success status code
          this.logger.warn(`LoRaWAN webhook attempt ${attempt + 1} failed with status ${response.status}: ${responseBody}`);

          // Don't retry on client errors (4xx) except 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            await this.prisma.webhookLog.update({
              where: { id: webhookLogId },
              data: {
                status: WebhookStatus.FAILED,
                statusCode: response.status,
                response: responseJson || { raw: responseBody },
                errorMessage: `HTTP ${response.status}: ${responseBody.substring(0, 500)}`,
              },
            });
            return false;
          }
        }
      } catch (error) {
        this.logger.error(`LoRaWAN webhook attempt ${attempt + 1} error:`, error);

        if (attempt === this.maxRetries - 1) {
          // Final attempt failed
          await this.prisma.webhookLog.update({
            where: { id: webhookLogId },
            data: {
              status: WebhookStatus.FAILED,
              errorMessage: error.message || 'Unknown error',
            },
          });
          return false;
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.maxRetries - 1) {
        const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
        this.logger.debug(`Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }

    return false;
  }

  /**
   * Update the LoRaWAN provisioning status for all devices in a task
   */
  private async updateDeviceStatuses(
    taskId: string,
    status: LorawanProvisioningStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = {
      lorawanProvisioningStatus: status,
    };

    if (status === LorawanProvisioningStatus.COMPLETED) {
      updateData.lorawanProvisionedAt = new Date();
      updateData.lorawanProvisioningError = null;
    }

    if (errorMessage) {
      updateData.lorawanProvisioningError = errorMessage;
    }

    // First, get the task to check if product is LoRaWAN
    const task = await this.prisma.onboardingTask.findUnique({
      where: { id: taskId },
      include: { product: true },
    });

    if (!task?.product?.isLorawanProduct) {
      // Don't update status for non-LoRaWAN products
      return;
    }

    await this.prisma.deviceProvisioning.updateMany({
      where: { taskId },
      data: updateData,
    });
  }

  /**
   * Helper method for sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get webhook logs for a task (for debugging/monitoring)
   */
  async getWebhookLogs(taskId: string) {
    return this.prisma.webhookLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retry a failed webhook manually
   */
  async retryWebhook(webhookLogId: string): Promise<boolean> {
    const webhookLog = await this.prisma.webhookLog.findUnique({
      where: { id: webhookLogId },
    });

    if (!webhookLog) {
      throw new Error('Webhook log not found');
    }

    if (webhookLog.status !== WebhookStatus.FAILED) {
      throw new Error('Can only retry failed webhooks');
    }

    return this.sendWithRetry(webhookLogId, webhookLog.payload as unknown as LorawanProvisionPayloadDto);
  }
}
