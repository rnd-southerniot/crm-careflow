import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportSchema, Prisma } from '@prisma/client';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  order: number;
}

@Injectable()
export class ReportSchemaService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Finds a report schema by its associated product ID.
   *
   * @param productId - The ID of the product.
   * @returns The report schema object.
   * @throws NotFoundException if the schema is not found.
   */
  async findByProductId(productId: string): Promise<ReportSchema | null> {
    const schema = await this.prisma.reportSchema.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!schema) {
      throw new NotFoundException(`Report schema for product ${productId} not found`);
    }

    return schema;
  }

  /**
   * Finds a report schema by its ID.
   *
   * @param id - The ID of the report schema.
   * @returns The report schema object.
   * @throws NotFoundException if the schema is not found.
   */
  async findById(id: string): Promise<ReportSchema | null> {
    const schema = await this.prisma.reportSchema.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!schema) {
      throw new NotFoundException(`Report schema with ID ${id} not found`);
    }

    return schema;
  }

  /**
   * Creates a new report schema.
   *
   * @param data - The data for the new schema (productId, formStructure, version).
   * @returns The created report schema.
   * @throws NotFoundException if the product is not found.
   * @throws ConflictException if a schema already exists for the product.
   */
  async create(data: {
    productId: string;
    formStructure: FormField[];
    version?: number;
  }): Promise<ReportSchema> {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Check if report schema already exists for this product
    const existingSchema = await this.prisma.reportSchema.findUnique({
      where: { productId: data.productId },
    });

    if (existingSchema) {
      throw new ConflictException(`Report schema already exists for product ${data.productId}`);
    }

    // Validate and sort form structure
    const sortedFormStructure = this.validateAndSortFormStructure(data.formStructure);

    return this.prisma.reportSchema.create({
      data: {
        productId: data.productId,
        formStructure: sortedFormStructure as any,
        version: data.version || 1,
      },
      include: { product: true },
    });
  }

  /**
   * Updates an existing report schema.
   *
   * @param id - The ID of the schema to update.
   * @param data - The data to update (formStructure, version).
   * @returns The updated report schema.
   * @throws NotFoundException if the schema is not found.
   */
  async update(id: string, data: {
    formStructure?: FormField[];
    version?: number;
  }): Promise<ReportSchema> {
    // Check if schema exists
    await this.findById(id);

    const updateData: any = {};

    if (data.formStructure) {
      updateData.formStructure = this.validateAndSortFormStructure(data.formStructure);
    }

    if (data.version) {
      updateData.version = data.version;
    }

    return this.prisma.reportSchema.update({
      where: { id },
      data: updateData,
      include: { product: true },
    });
  }

  /**
   * Updates a report schema using the product ID.
   *
   * @param productId - The ID of the product.
   * @param data - The data to update.
   * @returns The updated report schema.
   * @throws NotFoundException if the schema for the product is not found.
   */
  async updateByProductId(productId: string, data: {
    formStructure?: FormField[];
    version?: number;
  }): Promise<ReportSchema> {
    // Check if schema exists for this product
    const schema = await this.findByProductId(productId);

    const updateData: any = {};

    if (data.formStructure) {
      updateData.formStructure = this.validateAndSortFormStructure(data.formStructure);
    }

    if (data.version) {
      updateData.version = data.version;
    }

    return this.prisma.reportSchema.update({
      where: { id: schema.id },
      data: updateData,
      include: { product: true },
    });
  }

  /**
   * Deletes a report schema.
   *
   * @param id - The ID of the schema to delete.
   * @returns The deleted report schema.
   * @throws NotFoundException if the schema is not found.
   */
  async delete(id: string): Promise<ReportSchema> {
    // Check if schema exists
    await this.findById(id);

    return this.prisma.reportSchema.delete({
      where: { id },
    });
  }

  private validateAndSortFormStructure(formStructure: FormField[]): FormField[] {
    if (!formStructure || formStructure.length === 0) {
      throw new Error('Report schema must have at least one form field');
    }

    // Validate field structure
    for (const field of formStructure) {
      if (!field.id || !field.name || !field.label || !field.type || typeof field.required !== 'boolean' || typeof field.order !== 'number') {
        throw new Error('Each form field must have id, name, label, type, required, and order');
      }

      // Validate field type
      const validTypes = ['text', 'number', 'select', 'textarea', 'checkbox', 'date'];
      if (!validTypes.includes(field.type)) {
        throw new Error(`Invalid field type: ${field.type}. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate select field has options
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        throw new Error(`Select field ${field.name} must have at least one option`);
      }

      // Validate validation rules
      if (field.validation) {
        for (const rule of field.validation) {
          if (!rule.type || !rule.message) {
            throw new Error(`Validation rule must have type and message`);
          }
          const validRuleTypes = ['min', 'max', 'pattern', 'custom'];
          if (!validRuleTypes.includes(rule.type)) {
            throw new Error(`Invalid validation rule type: ${rule.type}`);
          }
        }
      }
    }

    // Check for duplicate field IDs
    const fieldIds = formStructure.map(f => f.id);
    const uniqueIds = new Set(fieldIds);
    if (fieldIds.length !== uniqueIds.size) {
      throw new Error('Form fields must have unique IDs');
    }

    // Check for duplicate field names
    const fieldNames = formStructure.map(f => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      throw new Error('Form fields must have unique names');
    }

    // Check for duplicate orders
    const orders = formStructure.map(f => f.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error('Form fields must have unique order numbers');
    }

    // Sort by order
    return formStructure.sort((a, b) => a.order - b.order);
  }

  /**
   * Retrieves the form structure for a specific product.
   *
   * @param productId - The ID of the product.
   * @returns A list of form fields defining the report structure.
   */
  async getFormStructure(productId: string): Promise<FormField[]> {
    const schema = await this.findByProductId(productId);
    return (schema.formStructure as unknown) as FormField[];
  }
}