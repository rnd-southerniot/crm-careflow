import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany();
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({
      data,
    });
  }

  async update(id: string, data: Prisma.RoleUpdateInput): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Role> {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}