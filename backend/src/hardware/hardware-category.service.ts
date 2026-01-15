import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HardwareCategory } from '@prisma/client';

export interface CreateHardwareCategoryDto {
    name: string;
    description?: string;
    icon?: string;
}

export interface UpdateHardwareCategoryDto {
    name?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
}

@Injectable()
export class HardwareCategoryService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(includeInactive = false): Promise<HardwareCategory[]> {
        return this.prisma.hardwareCategory.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { hardware: true },
                },
            },
        });
    }

    async findById(id: string): Promise<HardwareCategory> {
        const category = await this.prisma.hardwareCategory.findUnique({
            where: { id },
            include: {
                hardware: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                },
                _count: {
                    select: { hardware: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Hardware category with ID ${id} not found`);
        }

        return category;
    }

    async findByName(name: string): Promise<HardwareCategory | null> {
        return this.prisma.hardwareCategory.findUnique({
            where: { name },
        });
    }

    async create(data: CreateHardwareCategoryDto): Promise<HardwareCategory> {
        // Check if name already exists
        const existing = await this.findByName(data.name);
        if (existing) {
            throw new ConflictException(`Hardware category "${data.name}" already exists`);
        }

        return this.prisma.hardwareCategory.create({
            data: {
                name: data.name,
                description: data.description,
                icon: data.icon,
            },
            include: {
                _count: {
                    select: { hardware: true },
                },
            },
        });
    }

    async update(id: string, data: UpdateHardwareCategoryDto): Promise<HardwareCategory> {
        // Check if category exists
        await this.findById(id);

        // If updating name, check for conflicts
        if (data.name) {
            const existing = await this.findByName(data.name);
            if (existing && existing.id !== id) {
                throw new ConflictException(`Hardware category "${data.name}" already exists`);
            }
        }

        return this.prisma.hardwareCategory.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: { hardware: true },
                },
            },
        });
    }

    async delete(id: string): Promise<HardwareCategory> {
        // Check if category exists and has no hardware
        const category = await this.prisma.hardwareCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { hardware: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Hardware category with ID ${id} not found`);
        }

        // @ts-ignore - _count is included
        if (category._count?.hardware > 0) {
            // Soft delete if hardware exists
            return this.prisma.hardwareCategory.update({
                where: { id },
                data: { isActive: false },
            });
        }

        // Hard delete if no hardware references
        return this.prisma.hardwareCategory.delete({
            where: { id },
        });
    }

    async reactivate(id: string): Promise<HardwareCategory> {
        const category = await this.prisma.hardwareCategory.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException(`Hardware category with ID ${id} not found`);
        }

        return this.prisma.hardwareCategory.update({
            where: { id },
            data: { isActive: true },
            include: {
                _count: {
                    select: { hardware: true },
                },
            },
        });
    }
}
