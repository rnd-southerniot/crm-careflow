import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeviceHistory(deviceSerial: string) {
    return this.prisma.deviceProvisioning.findMany({
      where: { deviceSerial },
      include: {
        task: {
          include: {
            product: true,
            assignedUser: true,
          },
        },
        provisioner: true,
      },
      orderBy: {
        provisionedAt: 'desc',
      },
    });
  }

  async getTaskDevices(taskId: string) {
    return this.prisma.deviceProvisioning.findMany({
      where: { taskId },
      include: {
        provisioner: true,
      },
      orderBy: {
        provisionedAt: 'desc',
      },
    });
  }

  async isSerialUnique(deviceSerial: string): Promise<boolean> {
    const existing = await this.prisma.deviceProvisioning.findUnique({
      where: { deviceSerial },
    });
    return !existing;
  }
}