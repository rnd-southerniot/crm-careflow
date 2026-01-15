import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductHardwareConfig } from '@prisma/client';

export interface CreateProductHardwareConfigDto {
    hardwareId: string;
    firmwareVersion: string;
    firmwareUrl?: string;
    isDefault?: boolean;
    notes?: string;
}

export interface UpdateProductHardwareConfigDto {
    firmwareVersion?: string;
    firmwareUrl?: string;
    isDefault?: boolean;
    notes?: string;
}

@Injectable()
export class ProductHardwareConfigService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Retrieves all hardware configurations for a specific product.
     *
     * @param productId - The ID of the product.
     * @returns A list of hardware configurations, ordered by default status and hardware name.
     * @throws NotFoundException if the product is not found.
     */
    async getConfigsForProduct(productId: string): Promise<ProductHardwareConfig[]> {
        // Verify product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        return this.prisma.productHardwareConfig.findMany({
            where: { productId },
            include: {
                hardware: true,
            },
            orderBy: [
                { isDefault: 'desc' },
                { hardware: { name: 'asc' } },
            ],
        });
    }

    /**
     * Retrieves a specific product hardware configuration by its ID.
     *
     * @param configId - The ID of the configuration.
     * @returns The configuration object including product and hardware details.
     * @throws NotFoundException if the configuration is not found.
     */
    async getConfigById(configId: string): Promise<ProductHardwareConfig> {
        const config = await this.prisma.productHardwareConfig.findUnique({
            where: { id: configId },
            include: {
                product: true,
                hardware: true,
            },
        });

        if (!config) {
            throw new NotFoundException(`Product hardware config with ID ${configId} not found`);
        }

        return config;
    }

    /**
     * Adds a new hardware configuration to a product.
     *
     * @param productId - The ID of the product.
     * @param data - The configuration data (hardwareId, firmware info, etc.).
     * @returns The created configuration object.
     * @throws NotFoundException if product or hardware is not found.
     * @throws BadRequestException if the hardware is inactive.
     * @throws ConflictException if a configuration for this hardware already exists for the product.
     */
    async addConfig(
        productId: string,
        data: CreateProductHardwareConfigDto
    ): Promise<ProductHardwareConfig> {
        // Verify product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        // Verify hardware exists
        const hardware = await this.prisma.hardware.findUnique({
            where: { id: data.hardwareId },
        });

        if (!hardware) {
            throw new NotFoundException(`Hardware with ID ${data.hardwareId} not found`);
        }

        if (!hardware.isActive) {
            throw new BadRequestException(`Hardware ${hardware.name} is inactive and cannot be added to products`);
        }

        // Check if config already exists
        const existing = await this.prisma.productHardwareConfig.findUnique({
            where: {
                productId_hardwareId: {
                    productId,
                    hardwareId: data.hardwareId,
                },
            },
        });

        if (existing) {
            throw new ConflictException(
                `Product already has a configuration for hardware ${hardware.name}`
            );
        }

        // If setting as default, unset other defaults
        if (data.isDefault) {
            await this.prisma.productHardwareConfig.updateMany({
                where: { productId },
                data: { isDefault: false },
            });
        }

        return this.prisma.productHardwareConfig.create({
            data: {
                productId,
                hardwareId: data.hardwareId,
                firmwareVersion: data.firmwareVersion,
                firmwareUrl: data.firmwareUrl,
                isDefault: data.isDefault ?? false,
                notes: data.notes,
            },
            include: {
                product: true,
                hardware: true,
            },
        });
    }

    /**
     * Updates an existing hardware configuration.
     *
     * @param configId - The ID of the configuration to update.
     * @param data - The data to update.
     * @returns The updated configuration object.
     * @throws NotFoundException if the configuration is not found.
     */
    async updateConfig(
        configId: string,
        data: UpdateProductHardwareConfigDto
    ): Promise<ProductHardwareConfig> {
        // Verify config exists
        const config = await this.getConfigById(configId);

        // If setting as default, unset other defaults
        if (data.isDefault) {
            await this.prisma.productHardwareConfig.updateMany({
                where: {
                    productId: config.productId,
                    id: { not: configId },
                },
                data: { isDefault: false },
            });
        }

        return this.prisma.productHardwareConfig.update({
            where: { id: configId },
            data,
            include: {
                product: true,
                hardware: true,
            },
        });
    }

    /**
     * Removes a hardware configuration from a product.
     *
     * @param configId - The ID of the configuration to remove.
     * @returns The deleted configuration object.
     * @throws NotFoundException if the configuration is not found.
     */
    async removeConfig(configId: string): Promise<ProductHardwareConfig> {
        // Verify config exists
        await this.getConfigById(configId);

        return this.prisma.productHardwareConfig.delete({
            where: { id: configId },
            include: {
                product: true,
                hardware: true,
            },
        });
    }

    /**
     * Sets a specific hardware configuration as the default for its product.
     *
     * @param configId - The ID of the configuration to set as default.
     * @returns The updated configuration object.
     * @throws NotFoundException if the configuration is not found.
     */
    async setDefaultHardware(configId: string): Promise<ProductHardwareConfig> {
        // Verify config exists
        const config = await this.getConfigById(configId);

        // Unset other defaults for this product
        await this.prisma.productHardwareConfig.updateMany({
            where: {
                productId: config.productId,
                id: { not: configId },
            },
            data: { isDefault: false },
        });

        // Set this one as default
        return this.prisma.productHardwareConfig.update({
            where: { id: configId },
            data: { isDefault: true },
            include: {
                product: true,
                hardware: true,
            },
        });
    }

    /**
     * Retrieves the default hardware configuration for a product.
     *
     * @param productId - The ID of the product.
     * @returns The default configuration object, or null if none is set.
     */
    async getDefaultHardwareForProduct(productId: string): Promise<ProductHardwareConfig | null> {
        return this.prisma.productHardwareConfig.findFirst({
            where: {
                productId,
                isDefault: true,
            },
            include: {
                hardware: true,
            },
        });
    }

    /**
     * Retrieves all compatible hardware configurations for provisioning a product.
     * Only includes configurations where the referenced hardware is active.
     *
     * @param productId - The ID of the product.
     * @returns A list of compatible hardware configurations with detailed information.
     */
    async getCompatibleHardwareForProvisioning(productId: string): Promise<any[]> {
        const configs = await this.prisma.productHardwareConfig.findMany({
            where: {
                productId,
                hardware: {
                    isActive: true,
                },
            },
            include: {
                hardware: {
                    include: {
                        category: true,
                    },
                },
            },
            orderBy: [
                { isDefault: 'desc' },
                { hardware: { name: 'asc' } },
            ],
        });

        return configs.map(config => ({
            id: config.id,
            hardwareId: config.hardwareId,
            hardwareName: config.hardware.name,
            hardwareCode: config.hardware.code,
            category: config.hardware.category?.name,
            firmwareVersion: config.firmwareVersion,
            firmwareUrl: config.firmwareUrl,
            isDefault: config.isDefault,
            notes: config.notes,
        }));
    }
}
