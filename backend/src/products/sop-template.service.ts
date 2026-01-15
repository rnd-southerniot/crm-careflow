import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SOPTemplate, Prisma } from '@prisma/client';

export interface SOPStep {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration?: number;
  requiredRole?: string;
}

@Injectable()
export class SopTemplateService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Finds an SOP template by its associated product ID.
   *
   * @param productId - The ID of the product.
   * @returns The SOP template object including the product relation.
   * @throws NotFoundException if the template is not found.
   */
  async findByProductId(productId: string): Promise<SOPTemplate | null> {
    const template = await this.prisma.sOPTemplate.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!template) {
      throw new NotFoundException(`SOP template for product ${productId} not found`);
    }

    return template;
  }

  /**
   * Finds an SOP template by its ID.
   *
   * @param id - The ID of the SOP template.
   * @returns The SOP template object including the product relation.
   * @throws NotFoundException if the template is not found.
   */
  async findById(id: string): Promise<SOPTemplate | null> {
    const template = await this.prisma.sOPTemplate.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!template) {
      throw new NotFoundException(`SOP template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Creates a new SOP template.
   *
   * @param data - The data for the new SOP template (productId, steps, version).
   * @returns The created SOP template.
   * @throws NotFoundException if the product is not found.
   * @throws ConflictException if an SOP template already exists for the product.
   */
  async create(data: {
    productId: string;
    steps: SOPStep[];
    version?: number;
  }): Promise<SOPTemplate> {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Check if SOP template already exists for this product
    const existingTemplate = await this.prisma.sOPTemplate.findUnique({
      where: { productId: data.productId },
    });

    if (existingTemplate) {
      throw new ConflictException(`SOP template already exists for product ${data.productId}`);
    }

    // Validate and sort steps by order
    const sortedSteps = this.validateAndSortSteps(data.steps);

    return this.prisma.sOPTemplate.create({
      data: {
        productId: data.productId,
        steps: sortedSteps as any,
        version: data.version || 1,
      },
      include: { product: true },
    });
  }

  /**
   * Updates an existing SOP template.
   *
   * @param id - The ID of the template to update.
   * @param data - The data to update (steps, version).
   * @returns The updated SOP template.
   * @throws NotFoundException if the template is not found.
   */
  async update(id: string, data: {
    steps?: SOPStep[];
    version?: number;
  }): Promise<SOPTemplate> {
    // Check if template exists
    await this.findById(id);

    const updateData: any = {};

    if (data.steps) {
      updateData.steps = this.validateAndSortSteps(data.steps);
    }

    if (data.version) {
      updateData.version = data.version;
    }

    return this.prisma.sOPTemplate.update({
      where: { id },
      data: updateData,
      include: { product: true },
    });
  }

  /**
   * Updates an SOP template using the product ID.
   *
   * @param productId - The ID of the product.
   * @param data - The data to update (steps, version).
   * @returns The updated SOP template.
   * @throws NotFoundException if the template for the product is not found.
   */
  async updateByProductId(productId: string, data: {
    steps?: SOPStep[];
    version?: number;
  }): Promise<SOPTemplate> {
    // Check if template exists for this product
    const template = await this.findByProductId(productId);

    const updateData: any = {};

    if (data.steps) {
      updateData.steps = this.validateAndSortSteps(data.steps);
    }

    if (data.version) {
      updateData.version = data.version;
    }

    return this.prisma.sOPTemplate.update({
      where: { id: template.id },
      data: updateData,
      include: { product: true },
    });
  }

  /**
   * Deletes an SOP template.
   *
   * @param id - The ID of the template to delete.
   * @returns The deleted SOP template.
   * @throws NotFoundException if the template is not found.
   */
  async delete(id: string): Promise<SOPTemplate> {
    // Check if template exists
    await this.findById(id);

    return this.prisma.sOPTemplate.delete({
      where: { id },
    });
  }

  private validateAndSortSteps(steps: SOPStep[]): SOPStep[] {
    if (!steps || steps.length === 0) {
      throw new Error('SOP template must have at least one step');
    }

    // Validate step structure
    for (const step of steps) {
      if (!step.id || !step.title || !step.description || typeof step.order !== 'number') {
        throw new Error('Each SOP step must have id, title, description, and order');
      }
    }

    // Check for duplicate step IDs
    const stepIds = steps.map(s => s.id);
    const uniqueIds = new Set(stepIds);
    if (stepIds.length !== uniqueIds.size) {
      throw new Error('SOP steps must have unique IDs');
    }

    // Check for duplicate orders
    const orders = steps.map(s => s.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error('SOP steps must have unique order numbers');
    }

    // Sort by order
    return steps.sort((a, b) => a.order - b.order);
  }

  /**
   * Creates a snapshot of the current SOP steps for a product.
   *
   * @param productId - The ID of the product.
   * @returns A list of SOP steps.
   */
  async createSnapshot(productId: string): Promise<SOPStep[]> {
    const template = await this.findByProductId(productId);
    return (template.steps as unknown) as SOPStep[];
  }
}