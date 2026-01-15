import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Hardware, Prisma } from '@prisma/client';

export interface CreateHardwareDto {
    name: string;
    code: string;
    description?: string;
    categoryId: string;
    manufacturer?: string;
}

export interface UpdateHardwareDto {
    name?: string;
    code?: string;
    description?: string;
    categoryId?: string;
    manufacturer?: string;
    isActive?: boolean;
}

@Injectable()
export class HardwareCatalogService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(includeInactive = false): Promise<Hardware[]> {
        const where: Prisma.HardwareWhereInput = includeInactive ? {} : { isActive: true };
        return this.prisma.hardware.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                category: true,
                productConfigs: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async findById(id: string): Promise<Hardware> {
        const hardware = await this.prisma.hardware.findUnique({
            where: { id },
            include: {
                category: true,
                productConfigs: {
                    include: {
                        product: true,
                    },
                },
                provisionings: {
                    take: 10,
                    orderBy: { provisionedAt: 'desc' },
                },
            },
        });

        if (!hardware) {
            throw new NotFoundException(`Hardware with ID ${id} not found`);
        }

        return hardware;
    }

    async findByCode(code: string): Promise<Hardware | null> {
        return this.prisma.hardware.findUnique({
            where: { code },
            include: { category: true },
        });
    }

    async create(data: CreateHardwareDto): Promise<Hardware> {
        // Check if code already exists
        const existing = await this.findByCode(data.code);
        if (existing) {
            throw new ConflictException(`Hardware with code ${data.code} already exists`);
        }

        // Verify category exists
        const category = await this.prisma.hardwareCategory.findUnique({
            where: { id: data.categoryId },
        });
        if (!category) {
            throw new NotFoundException(`Hardware category with ID ${data.categoryId} not found`);
        }

        return this.prisma.hardware.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                categoryId: data.categoryId,
                manufacturer: data.manufacturer,
            },
            include: {
                category: true,
                productConfigs: true,
            },
        });
    }

    async update(id: string, data: UpdateHardwareDto): Promise<Hardware> {
        // Check if hardware exists
        await this.findById(id);

        // If updating code, check for conflicts
        if (data.code) {
            const existing = await this.findByCode(data.code);
            if (existing && existing.id !== id) {
                throw new ConflictException(`Hardware with code ${data.code} already exists`);
            }
        }

        // If updating category, verify it exists
        if (data.categoryId) {
            const category = await this.prisma.hardwareCategory.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new NotFoundException(`Hardware category with ID ${data.categoryId} not found`);
            }
        }

        return this.prisma.hardware.update({
            where: { id },
            data,
            include: {
                category: true,
                productConfigs: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async delete(id: string): Promise<Hardware> {
        // Check if hardware exists
        await this.findById(id);

        // Soft delete by setting isActive to false
        return this.prisma.hardware.update({
            where: { id },
            data: { isActive: false },
            include: { category: true },
        });
    }

    async hardDelete(id: string): Promise<Hardware> {
        // Check if hardware exists and has no provisionings
        const hardware = await this.prisma.hardware.findUnique({
            where: { id },
            include: {
                provisionings: true,
                productConfigs: true,
                category: true,
            },
        });

        if (!hardware) {
            throw new NotFoundException(`Hardware with ID ${id} not found`);
        }

        if (hardware.provisionings.length > 0) {
            throw new ConflictException(
                `Cannot delete hardware with existing device provisionings. Use soft delete instead.`
            );
        }

        // Delete product configs first
        await this.prisma.productHardwareConfig.deleteMany({
            where: { hardwareId: id },
        });

        return this.prisma.hardware.delete({
            where: { id },
        });
    }

    async getByCategoryId(categoryId: string): Promise<Hardware[]> {
        return this.prisma.hardware.findMany({
            where: {
                categoryId,
                isActive: true,
            },
            orderBy: { name: 'asc' },
            include: { category: true },
        });
    }
}

