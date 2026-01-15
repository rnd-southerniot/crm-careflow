import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard, RequirePermissions } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HardwareService } from './hardware.service';
import { QrCodeService } from './qr-code.service';
import { DeviceTrackingService } from './device-tracking.service';

@ApiTags('Hardware')
@Controller('hardware')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class HardwareController {
  constructor(
    private readonly hardwareService: HardwareService,
    private readonly qrCodeService: QrCodeService,
    private readonly deviceTrackingService: DeviceTrackingService,
  ) { }

  @Get('task/:taskId/devices')
  @ApiOperation({ summary: 'Get devices for a task' })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  @RequirePermissions('hardware', ['read'])
  async findByTask(@Param('taskId') taskId: string) {
    return this.hardwareService.findByTaskId(taskId);
  }

  @Get('device/:serial')
  @ApiOperation({ summary: 'Get device by serial number' })
  @ApiResponse({ status: 200, description: 'Device retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @RequirePermissions('hardware', ['read'])
  async findBySerial(@Param('serial') serial: string) {
    return this.hardwareService.findBySerial(serial);
  }

  @Get('device/:serial/qr-code')
  @ApiOperation({ summary: 'Get QR code for device' })
  @ApiResponse({ status: 200, description: 'QR code retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @RequirePermissions('hardware', ['read'])
  async getDeviceQRCode(@Param('serial') serial: string) {
    const device = await this.hardwareService.findBySerial(serial);
    if (!device) {
      throw new Error(`Device with serial ${serial} not found`);
    }

    return {
      deviceSerial: serial,
      qrCode: device.qrCode,
    };
  }

  @Get('device/:serial/history')
  @ApiOperation({ summary: 'Get device history' })
  @ApiResponse({ status: 200, description: 'Device history retrieved successfully' })
  @RequirePermissions('hardware', ['read'])
  async getDeviceHistory(@Param('serial') serial: string) {
    return this.deviceTrackingService.getDeviceHistory(serial);
  }

  @Post('generate-serial')
  @ApiOperation({ summary: 'Generate a unique device serial' })
  @ApiResponse({ status: 201, description: 'Serial generated successfully' })
  @Roles('HARDWARE_ENGINEER', 'ADMIN')
  @RequirePermissions('hardware', ['create'])
  async generateSerial() {
    let serial: string;
    let isUnique = false;

    // Keep generating until we get a unique serial
    do {
      serial = this.qrCodeService.generateUniqueSerial();
      isUnique = await this.deviceTrackingService.isSerialUnique(serial);
    } while (!isUnique);

    return { deviceSerial: serial };
  }

  @Post('generate-preview-qr-codes/:taskId')
  @ApiOperation({ summary: 'Generate preview QR codes for all devices in a task (without persisting)' })
  @ApiResponse({ status: 201, description: 'Preview QR codes generated successfully' })
  @ApiResponse({ status: 404, description: 'Tasks or devices not found' })
  @Roles('HARDWARE_ENGINEER', 'ADMIN')
  @RequirePermissions('hardware', ['read'])
  async generatePreviewQrCodes(@Param('taskId') taskId: string) {
    // Get all devices for this task with related task info
    const devices = await this.hardwareService.findByTaskId(taskId) as any[];

    if (devices.length === 0) {
      return { devices: [], message: 'No devices found for this task' };
    }

    // Get task info for client details
    const task = devices[0]?.task;
    if (!task) {
      throw new Error('Task information not found');
    }

    // Generate QR codes for each device
    const qrCodes = await Promise.all(
      devices.map(async (device) => {
        const qrCode = await this.qrCodeService.generateDeviceQRCodeWithClientInfo({
          deviceSerial: device.deviceSerial,
          deviceType: device.deviceType,
          hardwareId: device.hardwareId || '',
          taskId: taskId,
          clientName: (task as any).clientName || '',
          clientAddress: (task as any).clientAddress || '',
          contactPerson: (task as any).contactPerson || '',
        });

        return {
          id: device.id,
          deviceSerial: device.deviceSerial,
          deviceType: device.deviceType,
          firmwareVersion: device.firmwareVersion,
          qrCode: qrCode, // Base64 PNG data URL
        };
      })
    );

    return {
      taskId,
      clientName: (task as any).clientName,
      devices: qrCodes,
    };
  }
}