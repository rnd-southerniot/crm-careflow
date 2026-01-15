import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportSchemaService, FormField, ValidationRule, SelectOption } from '../products/report-schema.service';

export interface GeneratedFormField extends FormField {
  htmlType?: string;
  placeholder?: string;
  defaultValue?: any;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string[]>;
}

@Injectable()
export class DynamicFormService {
  constructor(private readonly reportSchemaService: ReportSchemaService) {}

  /**
   * Get form schema for a specific product
   */
  async getFormSchemaForProduct(productId: string) {
    return this.reportSchemaService.findByProductId(productId);
  }

  /**
   * Generate form fields with enhanced metadata for rendering
   */
  generateFormFields(formStructure: FormField[]): GeneratedFormField[] {
    if (!formStructure || formStructure.length === 0) {
      throw new BadRequestException('Form structure cannot be empty');
    }

    return formStructure
      .sort((a, b) => a.order - b.order)
      .map(field => this.enhanceFormField(field));
  }

  /**
   * Enhance form field with rendering metadata
   */
  private enhanceFormField(field: FormField): GeneratedFormField {
    const enhanced: GeneratedFormField = {
      ...field,
      htmlType: this.getHtmlInputType(field.type),
      placeholder: this.generatePlaceholder(field),
      defaultValue: this.getDefaultValue(field),
    };

    return enhanced;
  }

  /**
   * Get HTML input type for form field type
   */
  private getHtmlInputType(fieldType: string): string {
    switch (fieldType) {
      case 'text':
        return 'text';
      case 'number':
        return 'number';
      case 'select':
        return 'select';
      case 'textarea':
        return 'textarea';
      case 'checkbox':
        return 'checkbox';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  }

  /**
   * Generate placeholder text for form fields
   */
  private generatePlaceholder(field: FormField): string {
    switch (field.type) {
      case 'text':
        return `Enter ${field.label.toLowerCase()}`;
      case 'number':
        return `Enter ${field.label.toLowerCase()}`;
      case 'textarea':
        return `Enter ${field.label.toLowerCase()}`;
      case 'date':
        return 'Select date';
      case 'select':
        return `Select ${field.label.toLowerCase()}`;
      case 'checkbox':
        return '';
      default:
        return `Enter ${field.label.toLowerCase()}`;
    }
  }

  /**
   * Get default value for form fields
   */
  private getDefaultValue(field: FormField): any {
    switch (field.type) {
      case 'checkbox':
        return false;
      case 'number':
        return null;
      case 'select':
        return '';
      case 'date':
        return null;
      case 'text':
      case 'textarea':
      default:
        return '';
    }
  }

  /**
   * Comprehensive form data validation
   */
  validateFormData(formStructure: FormField[], submissionData: Record<string, any>): string[] {
    const result = this.validateFormDataDetailed(formStructure, submissionData);
    return result.errors;
  }

  /**
   * Detailed form data validation with field-specific errors
   */
  validateFormDataDetailed(formStructure: FormField[], submissionData: Record<string, any>): FormValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (!formStructure || formStructure.length === 0) {
      errors.push('Form structure is required');
      return { isValid: false, errors, fieldErrors };
    }

    if (!submissionData || typeof submissionData !== 'object') {
      errors.push('Submission data must be an object');
      return { isValid: false, errors, fieldErrors };
    }

    for (const field of formStructure) {
      const fieldValidationErrors = this.validateField(field, submissionData[field.name]);
      
      if (fieldValidationErrors.length > 0) {
        fieldErrors[field.name] = fieldValidationErrors;
        errors.push(...fieldValidationErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors,
    };
  }

  /**
   * Validate individual form field
   */
  private validateField(field: FormField, value: any): string[] {
    const errors: string[] = [];

    // Check required fields
    if (field.required && this.isEmpty(value)) {
      errors.push(`${field.label} is required`);
      return errors; // Return early for required field validation
    }

    // Skip further validation if field is not required and empty
    if (!field.required && this.isEmpty(value)) {
      return errors;
    }

    // Type-specific validation
    const typeValidationError = this.validateFieldType(field, value);
    if (typeValidationError) {
      errors.push(typeValidationError);
      return errors; // Return early if type validation fails
    }

    // Custom validation rules
    if (field.validation && field.validation.length > 0) {
      for (const rule of field.validation) {
        const ruleError = this.validateRule(field, value, rule);
        if (ruleError) {
          errors.push(ruleError);
        }
      }
    }

    return errors;
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    return value === undefined || 
           value === null || 
           value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  /**
   * Validate field type constraints
   */
  private validateFieldType(field: FormField, value: any): string | null {
    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          return `${field.label} must be a valid number`;
        }
        break;
      
      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return `${field.label} must be a valid date`;
        }
        break;
      
      case 'checkbox':
        if (typeof value !== 'boolean') {
          return `${field.label} must be true or false`;
        }
        break;
      
      case 'select':
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map(option => option.value);
          if (!validValues.includes(value)) {
            return `${field.label} must be one of: ${validValues.join(', ')}`;
          }
        }
        break;
      
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          return `${field.label} must be text`;
        }
        break;
    }

    return null;
  }

  /**
   * Validate individual validation rule
   */
  private validateRule(field: FormField, value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'min':
        if (field.type === 'number') {
          if (Number(value) < rule.value) {
            return rule.message || `${field.label} must be at least ${rule.value}`;
          }
        } else if (field.type === 'text' || field.type === 'textarea') {
          if (String(value).length < rule.value) {
            return rule.message || `${field.label} must be at least ${rule.value} characters`;
          }
        }
        break;
      
      case 'max':
        if (field.type === 'number') {
          if (Number(value) > rule.value) {
            return rule.message || `${field.label} must be at most ${rule.value}`;
          }
        } else if (field.type === 'text' || field.type === 'textarea') {
          if (String(value).length > rule.value) {
            return rule.message || `${field.label} must be at most ${rule.value} characters`;
          }
        }
        break;
      
      case 'pattern':
        try {
          const regex = new RegExp(rule.value);
          if (!regex.test(String(value))) {
            return rule.message || `${field.label} format is invalid`;
          }
        } catch (error) {
          console.error(`Invalid regex pattern for field ${field.name}:`, rule.value);
          return `Invalid validation pattern for ${field.label}`;
        }
        break;
      
      case 'custom':
        // Custom validation would need to be implemented based on specific business rules
        // For now, we'll just validate that the rule has a message
        if (!rule.message) {
          return `Custom validation failed for ${field.label}`;
        }
        break;
      
      default:
        console.warn(`Unknown validation rule type: ${rule.type}`);
        break;
    }

    return null;
  }

  /**
   * Get form field by name
   */
  getFieldByName(formStructure: FormField[], fieldName: string): FormField | null {
    return formStructure.find(field => field.name === fieldName) || null;
  }

  /**
   * Get required fields from form structure
   */
  getRequiredFields(formStructure: FormField[]): FormField[] {
    return formStructure.filter(field => field.required);
  }

  /**
   * Get optional fields from form structure
   */
  getOptionalFields(formStructure: FormField[]): FormField[] {
    return formStructure.filter(field => !field.required);
  }

  /**
   * Get fields by type
   */
  getFieldsByType(formStructure: FormField[], fieldType: string): FormField[] {
    return formStructure.filter(field => field.type === fieldType);
  }

  /**
   * Validate form structure itself
   */
  validateFormStructure(formStructure: FormField[]): string[] {
    const errors: string[] = [];

    if (!formStructure || formStructure.length === 0) {
      errors.push('Form structure must have at least one field');
      return errors;
    }

    const fieldIds = new Set<string>();
    const fieldNames = new Set<string>();
    const orders = new Set<number>();

    for (const field of formStructure) {
      // Validate required properties
      if (!field.id) errors.push('Field ID is required');
      if (!field.name) errors.push('Field name is required');
      if (!field.label) errors.push('Field label is required');
      if (!field.type) errors.push('Field type is required');
      if (typeof field.required !== 'boolean') errors.push('Field required property must be boolean');
      if (typeof field.order !== 'number') errors.push('Field order must be a number');

      // Check for duplicates
      if (fieldIds.has(field.id)) {
        errors.push(`Duplicate field ID: ${field.id}`);
      } else {
        fieldIds.add(field.id);
      }

      if (fieldNames.has(field.name)) {
        errors.push(`Duplicate field name: ${field.name}`);
      } else {
        fieldNames.add(field.name);
      }

      if (orders.has(field.order)) {
        errors.push(`Duplicate field order: ${field.order}`);
      } else {
        orders.add(field.order);
      }

      // Validate field type
      const validTypes = ['text', 'number', 'select', 'textarea', 'checkbox', 'date'];
      if (!validTypes.includes(field.type)) {
        errors.push(`Invalid field type: ${field.type}. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate select field options
      if (field.type === 'select') {
        if (!field.options || field.options.length === 0) {
          errors.push(`Select field ${field.name} must have at least one option`);
        } else {
          const optionValues = new Set<string>();
          for (const option of field.options) {
            if (!option.value || !option.label) {
              errors.push(`Select field ${field.name} options must have value and label`);
            }
            if (optionValues.has(option.value)) {
              errors.push(`Duplicate option value in field ${field.name}: ${option.value}`);
            } else {
              optionValues.add(option.value);
            }
          }
        }
      }

      // Validate validation rules
      if (field.validation) {
        for (const rule of field.validation) {
          if (!rule.type || !rule.message) {
            errors.push(`Validation rule for field ${field.name} must have type and message`);
          }
          const validRuleTypes = ['min', 'max', 'pattern', 'custom'];
          if (!validRuleTypes.includes(rule.type)) {
            errors.push(`Invalid validation rule type for field ${field.name}: ${rule.type}`);
          }
        }
      }
    }

    return errors;
  }
}