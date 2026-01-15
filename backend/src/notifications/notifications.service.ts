import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export interface NotificationTemplate {
  taskCreated: (clientName: string, productName: string) => WhatsAppMessage;
  reportSubmitted: (clientName: string, taskId: string) => WhatsAppMessage;
  deviceProvisioned: (clientName: string, deviceSerial: string) => WhatsAppMessage;
  taskCompleted: (clientName: string, productName: string) => WhatsAppMessage;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly whatsappApiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private readonly configService: ConfigService) {
    this.whatsappApiUrl = this.configService.get<string>('WHATSAPP_API_URL') || 'https://graph.facebook.com/v18.0';
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
  }

  private readonly templates: NotificationTemplate = {
    taskCreated: (clientName: string, productName: string): WhatsAppMessage => ({
      to: '', // Will be set when sending
      type: 'text',
      text: {
        body: `Hello ${clientName}! Your onboarding task for ${productName} has been created. Our team will contact you soon to schedule the next steps.`,
      },
    }),

    reportSubmitted: (clientName: string, taskId: string): WhatsAppMessage => ({
      to: '',
      type: 'text',
      text: {
        body: `Hello ${clientName}! Technical report for task ${taskId} has been submitted. We're now preparing your hardware for installation.`,
      },
    }),

    deviceProvisioned: (clientName: string, deviceSerial: string): WhatsAppMessage => ({
      to: '',
      type: 'text',
      text: {
        body: `Hello ${clientName}! Your device (Serial: ${deviceSerial}) has been provisioned and is ready for installation. Our team will contact you to schedule the installation.`,
      },
    }),

    taskCompleted: (clientName: string, productName: string): WhatsAppMessage => ({
      to: '',
      type: 'text',
      text: {
        body: `Hello ${clientName}! Your ${productName} installation has been completed successfully. Thank you for choosing our services!`,
      },
    }),
  };

  /**
   * Sends a WhatsApp message to a specific phone number.
   *
   * @param phoneNumber - The recipient's phone number.
   * @param message - The message payload to send.
   * @returns `true` if the message was sent successfully, `false` otherwise.
   */
  async sendWhatsAppMessage(phoneNumber: string, message: WhatsAppMessage): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) {
      this.logger.warn('WhatsApp API credentials not configured. Message not sent.');
      return false;
    }

    const messagePayload = {
      ...message,
      to: phoneNumber,
      messaging_product: 'whatsapp',
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response: AxiosResponse = await axios.post(
          `${this.whatsappApiUrl}/${this.phoneNumberId}/messages`,
          messagePayload,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 seconds timeout
          }
        );

        if (response.status === 200) {
          this.logger.log(`WhatsApp message sent successfully to ${phoneNumber}`);
          return true;
        }
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`WhatsApp message attempt ${attempt} failed: ${error.message}`);

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    this.logger.error(`Failed to send WhatsApp message after ${this.retryAttempts} attempts: ${lastError?.message}`);
    return false;
  }

  /**
   * Sends a notification specifically for task creation.
   *
   * @param phoneNumber - The recipient's phone number.
   * @param clientName - The name of the client.
   * @param productName - The name of the product.
   * @returns `true` if successful, `false` otherwise.
   */
  async notifyTaskCreated(phoneNumber: string, clientName: string, productName: string): Promise<boolean> {
    const message = this.templates.taskCreated(clientName, productName);
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  /**
   * Sends a notification when a technical report is submitted.
   *
   * @param phoneNumber - The recipient's phone number.
   * @param clientName - The name of the client.
   * @param taskId - The ID of the task.
   * @returns `true` if successful, `false` otherwise.
   */
  async notifyReportSubmitted(phoneNumber: string, clientName: string, taskId: string): Promise<boolean> {
    const message = this.templates.reportSubmitted(clientName, taskId);
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  /**
   * Sends a notification when a device is provisioned.
   *
   * @param phoneNumber - The recipient's phone number.
   * @param clientName - The name of the client.
   * @param deviceSerial - The serial number of the provisioned device.
   * @returns `true` if successful, `false` otherwise.
   */
  async notifyDeviceProvisioned(phoneNumber: string, clientName: string, deviceSerial: string): Promise<boolean> {
    const message = this.templates.deviceProvisioned(clientName, deviceSerial);
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  /**
   * Sends a notification when a task is completed.
   *
   * @param phoneNumber - The recipient's phone number.
   * @param clientName - The name of the client.
   * @param productName - The name of the product.
   * @returns `true` if successful, `false` otherwise.
   */
  async notifyTaskCompleted(phoneNumber: string, clientName: string, productName: string): Promise<boolean> {
    const message = this.templates.taskCompleted(clientName, productName);
    return this.sendWhatsAppMessage(phoneNumber, message);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Checks the health of the WhatsApp API connection.
   *
   * @returns `true` if the API is reachable and authorized, `false` otherwise.
   */
  async checkWhatsAppApiHealth(): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) {
      return false;
    }

    try {
      const response = await axios.get(
        `${this.whatsappApiUrl}/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          timeout: 5000,
        }
      );
      return response.status === 200;
    } catch (error) {
      this.logger.error(`WhatsApp API health check failed: ${error.message}`);
      return false;
    }
  }
}