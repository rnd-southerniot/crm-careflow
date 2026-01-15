import { Injectable, BadRequestException } from '@nestjs/common';
import { FormField, ValidationRule } from '../products/report-schema.service';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, ValidationError[]>;
  globalErrors: ValidationError[];
}

@Injectable()
export class FormValidationService {
  /**
   * Validate submission data against report schema with detailed error reporting
   */
  validateSubmissionData(
    formStructure: FormField[],
    submissionData: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const fieldErrors: Record<string, ValidationError[]> = {};
    const globalErrors: ValidationError[] = [];

    // Validate form structure first
    const structureValidation = this.validateFormStructure(formStructure);
    if (!structureValidation.isValid) {
      globalErrors.push(...structureValidation.errors);
      return {
        isValid: false,
        errors: globalErrors,
        fieldErrors: {},
        globalErrors,
      };
    }

    // Validate submission data structure
    if (!submissionData || typeof submissionData !== 'object') {
      globalErrors.push({
        field: 'root',
        message: 'Submission data must be a valid object',
        code: 'INVALID_DATA_TYPE',
        value: submissionData,
      });
      return {
        isValid: false,
        errors: globalErrors,
        fieldErrors: {},
        globalErrors,
      };
    }

    // Validate each field
    for (const field of formStructure) {
      const fieldValidationErrors = this.validateField(field, submissionData[field.name]);
      
      if (fieldValidationErrors.length > 0) {
        fieldErrors[field.name] = fieldValidationErrors;
        errors.push(...fieldValidationErrors);
      }
    }

    // Check for unexpected fields in submission data
    const expectedFields = new Set(formStructure.map(f => f.name));
    const submittedFields = Object.keys(submissionData);
    const unexpectedFields = submittedFields.filter(field => !expectedFields.has(field));
    
    for (const unexpectedField of unexpectedFields) {
      const error: ValidationError = {
        field: unexpectedField,
        message: `Unexpected field '${unexpectedField}' in submission data`,
        code: 'UNEXPECTED_FIELD',
        value: submissionData[unexpectedField],
      };
      errors.push(error);
      if (!fieldErrors[unexpectedField]) {
        fieldErrors[unexpectedField] = [];
      }
      fieldErrors[unexpectedField].push(error);
    }

    const allErrors = [...globalErrors, ...errors];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      fieldErrors,
      globalErrors,
    };
  }

  /**
   * Validate individual form field with comprehensive error reporting
   */
  private validateField(field: FormField, value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required fields
    if (field.required && this.isEmpty(value)) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`,
        code: 'REQUIRED_FIELD_MISSING',
        value,
      });
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
   * Validate field type constraints with detailed error information
   */
  private validateFieldType(field: FormField, value: any): ValidationError | null {
    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          return {
            field: field.name,
            message: `${field.label} must be a valid number`,
            code: 'INVALID_NUMBER',
            value,
          };
        }
        break;
      
      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return {
            field: field.name,
            message: `${field.label} must be a valid date`,
            code: 'INVALID_DATE',
            value,
          };
        }
        break;
      
      case 'checkbox':
        if (typeof value !== 'boolean') {
          return {
            field: field.name,
            message: `${field.label} must be true or false`,
            code: 'INVALID_BOOLEAN',
            value,
          };
        }
        break;
      
      case 'select':
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map(option => option.value);
          if (!validValues.includes(value)) {
            return {
              field: field.name,
              message: `${field.label} must be one of: ${validValues.join(', ')}`,
              code: 'INVALID_OPTION',
              value,
            };
          }
        }
        break;
      
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          return {
            field: field.name,
            message: `${field.label} must be text`,
            code: 'INVALID_TEXT',
            value,
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate individual validation rule with detailed error information
   */
  private validateRule(field: FormField, value: any, rule: ValidationRule): ValidationError | null {
    switch (rule.type) {
      case 'min':
        if (field.type === 'number') {
          if (Number(value) < rule.value) {
            return {
              field: field.name,
              message: rule.message || `${field.label} must be at least ${rule.value}`,
              code: 'MIN_VALUE_VIOLATION',
              value,
            };
          }
        } else if (field.type === 'text' || field.type === 'textarea') {
          if (String(value).length < rule.value) {
            return {
              field: field.name,
              message: rule.message || `${field.label} must be at least ${rule.value} characters`,
              code: 'MIN_LENGTH_VIOLATION',
              value,
            };
          }
        }
        break;
      
      case 'max':
        if (field.type === 'number') {
          if (Number(value) > rule.value) {
            return {
              field: field.name,
              message: rule.message || `${field.label} must be at most ${rule.value}`,
              code: 'MAX_VALUE_VIOLATION',
              value,
            };
          }
        } else if (field.type === 'text' || field.type === 'textarea') {
          if (String(value).length > rule.value) {
            return {
              field: field.name,
              message: rule.message || `${field.label} must be at most ${rule.value} characters`,
              code: 'MAX_LENGTH_VIOLATION',
              value,
            };
          }
        }
        break;
      
      case 'pattern':
        try {
          const regex = new RegExp(rule.value);
          if (!regex.test(String(value))) {
            return {
              field: field.name,
              message: rule.message || `${field.label} format is invalid`,
              code: 'PATTERN_MISMATCH',
              value,
            };
          }
        } catch (error) {
          console.error(`Invalid regex pattern for field ${field.name}:`, rule.value);
          return {
            field: field.name,
            message: `Invalid validation pattern for ${field.label}`,
            code: 'INVALID_PATTERN',
            value,
          };
        }
        break;
      
      case 'custom':
        // Custom validation implementation would depend on specific business rules
        // For now, we validate that the rule has proper structure
        if (!rule.message) {
          return {
            field: field.name,
            message: `Custom validation failed for ${field.label}`,
            code: 'CUSTOM_VALIDATION_FAILED',
            value,
          };
        }
        break;
      
      default:
        console.warn(`Unknown validation rule type: ${rule.type}`);
        return {
          field: field.name,
          message: `Unknown validation rule type: ${rule.type}`,
          code: 'UNKNOWN_VALIDATION_RULE',
          value,
        };
    }

    return null;
  }

  /**
   * Validate form structure with detailed error reporting
   */
  validateFormStructure(formStructure: FormField[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (!formStructure || formStructure.length === 0) {
      errors.push({
        field: 'root',
        message: 'Form structure must have at least one field',
        code: 'EMPTY_FORM_STRUCTURE',
      });
      return {
        isValid: false,
        errors,
        fieldErrors: {},
        globalErrors: errors,
      };
    }

    if (!Array.isArray(formStructure)) {
      errors.push({
        field: 'root',
        message: 'Form structure must be an array',
        code: 'INVALID_FORM_STRUCTURE_TYPE',
        value: formStructure,
      });
      return {
        isValid: false,
        errors,
        fieldErrors: {},
        globalErrors: errors,
      };
    }

    const fieldIds = new Set<string>();
    const fieldNames = new Set<string>();
    const orders = new Set<number>();

    for (let i = 0; i < formStructure.length; i++) {
      const field = formStructure[i];
      const fieldIndex = `field[${i}]`;

      // Validate required properties
      if (!field.id) {
        errors.push({
          field: fieldIndex,
          message: 'Field ID is required',
          code: 'MISSING_FIELD_ID',
          value: field,
        });
      }
      if (!field.name) {
        errors.push({
          field: fieldIndex,
          message: 'Field name is required',
          code: 'MISSING_FIELD_NAME',
          value: field,
        });
      }
      if (!field.label) {
        errors.push({
          field: fieldIndex,
          message: 'Field label is required',
          code: 'MISSING_FIELD_LABEL',
          value: field,
        });
      }
      if (!field.type) {
        errors.push({
          field: fieldIndex,
          message: 'Field type is required',
          code: 'MISSING_FIELD_TYPE',
          value: field,
        });
      }
      if (typeof field.required !== 'boolean') {
        errors.push({
          field: fieldIndex,
          message: 'Field required property must be boolean',
          code: 'INVALID_REQUIRED_TYPE',
          value: field.required,
        });
      }
      if (typeof field.order !== 'number') {
        errors.push({
          field: fieldIndex,
          message: 'Field order must be a number',
          code: 'INVALID_ORDER_TYPE',
          value: field.order,
        });
      }

      // Check for duplicates
      if (field.id && fieldIds.has(field.id)) {
        errors.push({
          field: fieldIndex,
          message: `Duplicate field ID: ${field.id}`,
          code: 'DUPLICATE_FIELD_ID',
          value: field.id,
        });
      } else if (field.id) {
        fieldIds.add(field.id);
      }

      if (field.name && fieldNames.has(field.name)) {
        errors.push({
          field: fieldIndex,
          message: `Duplicate field name: ${field.name}`,
          code: 'DUPLICATE_FIELD_NAME',
          value: field.name,
        });
      } else if (field.name) {
        fieldNames.add(field.name);
      }

      if (typeof field.order === 'number' && orders.has(field.order)) {
        errors.push({
          field: fieldIndex,
          message: `Duplicate field order: ${field.order}`,
          code: 'DUPLICATE_FIELD_ORDER',
          value: field.order,
        });
      } else if (typeof field.order === 'number') {
        orders.add(field.order);
      }

      // Validate field type
      const validTypes = ['text', 'number', 'select', 'textarea', 'checkbox', 'date'];
      if (field.type && !validTypes.includes(field.type)) {
        errors.push({
          field: fieldIndex,
          message: `Invalid field type: ${field.type}. Must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_FIELD_TYPE',
          value: field.type,
        });
      }

      // Validate select field options
      if (field.type === 'select') {
        if (!field.options || field.options.length === 0) {
          errors.push({
            field: fieldIndex,
            message: `Select field ${field.name} must have at least one option`,
            code: 'MISSING_SELECT_OPTIONS',
            value: field.options,
          });
        } else {
          const optionValues = new Set<string>();
          for (let j = 0; j < field.options.length; j++) {
            const option = field.options[j];
            if (!option.value || !option.label) {
              errors.push({
                field: `${fieldIndex}.options[${j}]`,
                message: `Select field ${field.name} options must have value and label`,
                code: 'INVALID_SELECT_OPTION',
                value: option,
              });
            }
            if (option.value && optionValues.has(option.value)) {
              errors.push({
                field: `${fieldIndex}.options[${j}]`,
                message: `Duplicate option value in field ${field.name}: ${option.value}`,
                code: 'DUPLICATE_OPTION_VALUE',
                value: option.value,
              });
            } else if (option.value) {
              optionValues.add(option.value);
            }
          }
        }
      }

      // Validate validation rules
      if (field.validation) {
        for (let k = 0; k < field.validation.length; k++) {
          const rule = field.validation[k];
          if (!rule.type || !rule.message) {
            errors.push({
              field: `${fieldIndex}.validation[${k}]`,
              message: `Validation rule for field ${field.name} must have type and message`,
              code: 'INVALID_VALIDATION_RULE',
              value: rule,
            });
          }
          const validRuleTypes = ['min', 'max', 'pattern', 'custom'];
          if (rule.type && !validRuleTypes.includes(rule.type)) {
            errors.push({
              field: `${fieldIndex}.validation[${k}]`,
              message: `Invalid validation rule type for field ${field.name}: ${rule.type}`,
              code: 'INVALID_VALIDATION_RULE_TYPE',
              value: rule.type,
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors: {},
      globalErrors: errors,
    };
  }

  /**
   * Validate JSON structure
   */
  validateJsonStructure(data: any): ValidationResult {
    try {
      JSON.stringify(data);
      return {
        isValid: true,
        errors: [],
        fieldErrors: {},
        globalErrors: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'root',
          message: 'Invalid JSON structure',
          code: 'INVALID_JSON',
          value: data,
        }],
        fieldErrors: {},
        globalErrors: [{
          field: 'root',
          message: 'Invalid JSON structure',
          code: 'INVALID_JSON',
          value: data,
        }],
      };
    }
  }

  /**
   * Sanitize submission data by trimming strings and normalizing values
   */
  sanitizeSubmissionData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else if (value === null || value === undefined) {
        sanitized[key] = value;
      } else if (typeof value === 'number' && isNaN(value)) {
        sanitized[key] = null; // Convert NaN to null
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if value is empty (null, undefined, empty string, empty array)
   */
  private isEmpty(value: any): boolean {
    return value === undefined || 
           value === null || 
           value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  /**
   * Create a standardized validation exception with detailed error information
   */
  createValidationException(validationResult: ValidationResult): BadRequestException {
    return new BadRequestException({
      message: 'Form validation failed',
      errors: validationResult.errors,
      fieldErrors: validationResult.fieldErrors,
      globalErrors: validationResult.globalErrors,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Validate and enforce schema rules for report submission
   */
  enforceValidationRules(
    formStructure: FormField[],
    submissionData: Record<string, any>
  ): Record<string, any> {
    // First sanitize the data
    const sanitizedData = this.sanitizeSubmissionData(submissionData);
    
    // Then validate
    const validationResult = this.validateSubmissionData(formStructure, sanitizedData);
    
    if (!validationResult.isValid) {
      throw this.createValidationException(validationResult);
    }

    return sanitizedData;
  }
}