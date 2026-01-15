import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  async generateDeviceQRCode(deviceSerial: string, taskId: string): Promise<string> {
    const qrData = {
      deviceSerial,
      taskId,
      timestamp: new Date().toISOString(),
    };

    return this.generateQRCode(JSON.stringify(qrData));
  }

  /**
   * Generate a QR code for a device with full client tracking information.
   * This QR code can be used to identify:
   * 1. Which client the hardware was provisioned for
   * 2. Which specific hardware piece the QR code represents
   */
  async generateDeviceQRCodeWithClientInfo(params: {
    deviceSerial: string;
    deviceType: string;
    hardwareId: string;
    taskId: string;
    clientName: string;
    clientAddress?: string;
    contactPerson?: string;
  }): Promise<string> {
    const qrData = {
      // Hardware identification
      deviceSerial: params.deviceSerial,
      deviceType: params.deviceType,
      hardwareId: params.hardwareId,
      // Client tracking
      taskId: params.taskId,
      clientName: params.clientName,
      clientAddress: params.clientAddress,
      contactPerson: params.contactPerson,
      // Metadata
      generatedAt: new Date().toISOString(),
    };

    return this.generateQRCode(JSON.stringify(qrData));
  }

  generateUniqueSerial(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `DEV-${timestamp}-${random}`.toUpperCase();
  }
}