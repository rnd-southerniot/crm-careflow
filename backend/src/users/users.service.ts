import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Finds a user by their ID.
   *
   * @param id - The ID of the user.
   * @returns The user object with role details, or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  /**
   * Finds a user by their email address.
   *
   * @param email - The email address of the user.
   * @returns The user object with role details, or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  /**
   * Retrieves all users.
   *
   * @returns A list of all users with their role details.
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { role: true },
    });
  }

  /**
   * Creates a new user.
   *
   * @param data - The data for the new user (email, password, fullName, roleId).
   * @returns The created user object.
   */
  async create(data: {
    email: string;
    password: string;
    fullName: string;
    roleId: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        fullName: data.fullName,
        roleId: data.roleId,
      },
      include: { role: true },
    });
  }

  /**
   * Updates an existing user.
   *
   * @param id - The ID of the user to update.
   * @param data - The data to update (email, password, fullName, roleId).
   * @returns The updated user object.
   */
  async update(id: string, data: {
    email?: string;
    password?: string;
    fullName?: string;
    roleId?: string;
  }): Promise<User> {
    const updateData: any = {};

    if (data.email) updateData.email = data.email;
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });
  }

  /**
   * Deletes a user.
   *
   * @param id - The ID of the user to delete.
   * @returns The deleted user object.
   * @throws NotFoundException if the user is not found.
   * @throws BadRequestException if the user has related data (tasks, reports, provisionings).
   */
  async delete(id: string): Promise<User> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: true,
        technicalReports: true,
        deviceProvisionings: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for related data that would prevent deletion
    const relatedData: string[] = [];

    if (user.assignedTasks.length > 0) {
      relatedData.push(`${user.assignedTasks.length} assigned task(s)`);
    }

    if (user.technicalReports.length > 0) {
      relatedData.push(`${user.technicalReports.length} technical report(s)`);
    }

    if (user.deviceProvisionings.length > 0) {
      relatedData.push(`${user.deviceProvisionings.length} device provisioning(s)`);
    }

    if (relatedData.length > 0) {
      throw new BadRequestException(
        `Cannot delete user ${user.fullName} (${user.email}). ` +
        `This user has related data: ${relatedData.join(', ')}. ` +
        `Please reassign or remove these items before deleting the user.`
      );
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}