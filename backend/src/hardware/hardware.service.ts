import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceProvisioning } from '@prisma/client';

@Injectable()
export class HardwareService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Finds all device provisionings associated with a specific task ID.
   *
   * @param taskId - The ID of the task.
   * @returns A list of device provisionings including task and provisioner details.
   */
  async findByTaskId(taskId: string): Promise<DeviceProvisioning[]> {
    return this.prisma.deviceProvisioning.findMany({
      where: { taskId },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        provisioner: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        provisionedAt: 'desc',
      },
    });
  }

  /**
   * Finds a device provisioning by its ID.
   *
   * @param id - The ID of the device provisioning.
   * @returns The device provisioning object.
   * @throws NotFoundException if the device provisioning is not found.
   */
  async findById(id: string): Promise<DeviceProvisioning | null> {
    const device = await this.prisma.deviceProvisioning.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        provisioner: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device provisioning with ID ${id} not found`);
    }

    return device;
  }

  /**
   * Finds a device provisioning by its serial number.
   *
   * @param deviceSerial - The serial number of the device.
   * @returns The device provisioning object if found, or null otherwise.
   */
  async findBySerial(deviceSerial: string): Promise<DeviceProvisioning | null> {
    return this.prisma.deviceProvisioning.findUnique({
      where: { deviceSerial },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        provisioner: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Updates a device provisioning record.
   *
   * @param id - The ID of the device to update.
   * @param data - The data to update (firmware version, notes).
   * @returns The updated device provisioning object.
   * @throws NotFoundException if the device is not found.
   */
  async updateDevice(id: string, data: {
    firmwareVersion?: string;
    notes?: string;
  }): Promise<DeviceProvisioning> {
    // Check if device exists
    await this.findById(id);

    return this.prisma.deviceProvisioning.update({
      where: { id },
      data: {
        firmwareVersion: data.firmwareVersion,
        notes: data.notes,
      },
      include: {
        task: {
          include: {
            product: true,
          },
        },
        provisioner: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}