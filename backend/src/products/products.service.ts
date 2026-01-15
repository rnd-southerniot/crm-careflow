import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Retrieves all products including their relations (templates, schemas, variations, parent).
   *
   * @returns A list of all products.
   */
  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      include: {
        sopTemplate: true,
        reportSchema: true,
        variations: true,
        parentProduct: true,
        _count: {
          select: { onboardingTasks: true },
        },
      },
    });
  }

  /**
   * Finds a product by its ID.
   *
   * @param id - The ID of the product.
   * @returns The product object with relations.
   * @throws NotFoundException if the product is not found.
   */
  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sopTemplate: true,
        reportSchema: true,
        variations: true,
        parentProduct: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Finds a product by its unique code.
   *
   * @param code - The unique product code.
   * @returns The product object if found, or null otherwise.
   */
  async findByCode(code: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { code },
      include: {
        sopTemplate: true,
        reportSchema: true,
        variations: true,
        parentProduct: true,
      },
    });
  }

  /**
   * Finds all variations (child products) of a parent product.
   *
   * @param parentId - The ID of the parent product.
   * @returns A list of product variations.
   */
  async findVariations(parentId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { parentProductId: parentId },
      include: {
        sopTemplate: true,
        reportSchema: true,
      },
    });
  }

  /**
   * Creates a new product.
   *
   * @param data - The data for the new product.
   * @returns The created product.
   * @throws ConflictException if a product with the same code already exists.
   * @throws NotFoundException if the parent product (if specified) is not found.
   */
  async create(data: {
    name: string;
    code: string;
    description: string;
    parentProductId?: string;
  }): Promise<Product> {
    // Check if code already exists
    const existingProduct = await this.findByCode(data.code);
    if (existingProduct) {
      throw new ConflictException(`Product with code ${data.code} already exists`);
    }

    // If parentProductId is provided, verify parent exists
    if (data.parentProductId) {
      const parentProduct = await this.prisma.product.findUnique({
        where: { id: data.parentProductId },
      });
      if (!parentProduct) {
        throw new NotFoundException(`Parent product with ID ${data.parentProductId} not found`);
      }
    }

    return this.prisma.product.create({
      data,
      include: {
        sopTemplate: true,
        reportSchema: true,
        variations: true,
        parentProduct: true,
      },
    });
  }

  /**
   * Updates an existing product.
   *
   * @param id - The ID of the product to update.
   * @param data - The data to update.
   * @returns The updated product.
   * @throws NotFoundException if the product or parent product is not found.
   * @throws ConflictException if the new code is already in use by another product.
   */
  async update(id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    parentProductId?: string;
    isActive?: boolean;
  }): Promise<Product> {
    // Check if product exists
    await this.findById(id);

    // If updating code, check for conflicts
    if (data.code) {
      const existingProduct = await this.findByCode(data.code);
      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(`Product with code ${data.code} already exists`);
      }
    }

    // If updating parentProductId, verify parent exists
    if (data.parentProductId) {
      const parentProduct = await this.prisma.product.findUnique({
        where: { id: data.parentProductId },
      });
      if (!parentProduct) {
        throw new NotFoundException(`Parent product with ID ${data.parentProductId} not found`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        sopTemplate: true,
        reportSchema: true,
        variations: true,
        parentProduct: true,
        _count: {
          select: { onboardingTasks: true },
        },
      },
    });
  }

  /**
   * Deletes a product.
   *
   * @param id - The ID of the product to delete.
   * @returns The deleted product.
   * @throws NotFoundException if the product is not found.
   * @throws ConflictException if the product has variations or associated tasks.
   */
  async delete(id: string): Promise<Product> {
    // Check if product exists
    await this.findById(id);

    // Check if product has variations
    const variations = await this.findVariations(id);
    if (variations.length > 0) {
      throw new ConflictException('Cannot delete product that has variations. Delete variations first.');
    }

    // Check if product has associated onboarding tasks
    const taskCount = await this.prisma.onboardingTask.count({
      where: { productId: id },
    });
    if (taskCount > 0) {
      throw new ConflictException(`Cannot delete product with ${taskCount} associated onboarding task(s). Consider disabling the product instead.`);
    }

    // Delete associated SOP template if exists
    const sopTemplate = await this.prisma.sOPTemplate.findUnique({
      where: { productId: id },
    });
    if (sopTemplate) {
      await this.prisma.sOPTemplate.delete({
        where: { id: sopTemplate.id },
      });
    }

    // Delete associated report schema if exists
    const reportSchema = await this.prisma.reportSchema.findUnique({
      where: { productId: id },
    });
    if (reportSchema) {
      await this.prisma.reportSchema.delete({
        where: { id: reportSchema.id },
      });
    }

    // Now delete the product
    return this.prisma.product.delete({
      where: { id },
    });
  }
}