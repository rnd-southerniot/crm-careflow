import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DynamicFormService, GeneratedFormField, FormValidationResult } from './dynamic-form.service';
import { ReportSchemaService, FormField, ValidationRule, SelectOption } from '../products/report-schema.service';

describe('DynamicFormService', () => {
  let service: DynamicFormService;
  let mockReportSchemaService: jest.Mocked<ReportSchemaService>;

  beforeEach(async () => {
    const mockReportSchemaServiceProvider = {
      provide: ReportSchemaService,
      useValue: {
        findByProductId: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DynamicFormService, mockReportSchemaServiceProvider],
    }).compile();

    service = module.get<DynamicFormService>(DynamicFormService);
    mockReportSchemaService = module.get(ReportSchemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFormFields', () => {
    it('should generate form fields with enhanced metadata', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'signalStrength',
          label: 'Signal Strength',
          type: 'number',
          required: true,
          order: 1,
        },
        {
          id: 'field-2',
          name: 'location',
          label: 'Location',
          type: 'select',
          required: true,
          options: [
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
          ],
          order: 2,
        },
      ];

      const result = service.generateFormFields(formStructure);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'field-1',
        name: 'signalStrength',
        label: 'Signal Strength',
        type: 'number',
        htmlType: 'number',
        placeholder: 'Enter signal strength',
        defaultValue: null,
      });
      expect(result[1]).toMatchObject({
        id: 'field-2',
        name: 'location',
        label: 'Location',
        type: 'select',
        htmlType: 'select',
        placeholder: 'Select location',
        defaultValue: '',
      });
    });

    it('should sort fields by order', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-2',
          name: 'second',
          label: 'Second Field',
          type: 'text',
          required: false,
          order: 2,
        },
        {
          id: 'field-1',
          name: 'first',
          label: 'First Field',
          type: 'text',
          required: true,
          order: 1,
        },
      ];

      const result = service.generateFormFields(formStructure);

      expect(result[0].name).toBe('first');
      expect(result[1].name).toBe('second');
    });

    it('should throw error for empty form structure', () => {
      expect(() => service.generateFormFields([])).toThrow(BadRequestException);
      expect(() => service.generateFormFields(null as any)).toThrow(BadRequestException);
    });
  });

  describe('validateFormData', () => {
    const sampleFormStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'signalStrength',
        label: 'Signal Strength',
        type: 'number',
        required: true,
        validation: [
          {
            type: 'min',
            value: -120,
            message: 'Signal strength must be above -120 dBm',
          },
        ],
        order: 1,
      },
      {
        id: 'field-2',
        name: 'location',
        label: 'Location',
        type: 'select',
        required: true,
        options: [
          { value: 'indoor', label: 'Indoor' },
          { value: 'outdoor', label: 'Outdoor' },
        ],
        order: 2,
      },
      {
        id: 'field-3',
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        required: false,
        order: 3,
      },
    ];

    it('should validate valid form data', () => {
      const submissionData = {
        signalStrength: -80,
        location: 'indoor',
        notes: 'Installation went smoothly',
      };

      const errors = service.validateFormData(sampleFormStructure, submissionData);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const submissionData = {
        notes: 'Some notes',
      };

      const errors = service.validateFormData(sampleFormStructure, submissionData);
      expect(errors).toContain('Signal Strength is required');
      expect(errors).toContain('Location is required');
    });

    it('should validate number fields', () => {
      const submissionData = {
        signalStrength: 'not-a-number',
        location: 'indoor',
      };

      const errors = service.validateFormData(sampleFormStructure, submissionData);
      expect(errors).toContain('Signal Strength must be a valid number');
    });

    it('should validate select field options', () => {
      const submissionData = {
        signalStrength: -80,
        location: 'invalid-option',
      };

      const errors = service.validateFormData(sampleFormStructure, submissionData);
      expect(errors).toContain('Location must be one of: indoor, outdoor');
    });

    it('should validate custom validation rules', () => {
      const submissionData = {
        signalStrength: -150, // Below minimum
        location: 'indoor',
      };

      const errors = service.validateFormData(sampleFormStructure, submissionData);
      expect(errors).toContain('Signal strength must be above -120 dBm');
    });

    it('should allow empty optional fields', () => {
      const submissionData = {
        signalStrength: -80,
        location: 'indoor',
        // notes is optional and not provided
      };

      const errors = service.validateFormData(sampleFormStructure, submissionData);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateFormDataDetailed', () => {
    const formStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'email',
        label: 'Email',
        type: 'text',
        required: true,
        validation: [
          {
            type: 'pattern',
            value: '^[^@]+@[^@]+\\.[^@]+$',
            message: 'Invalid email format',
          },
        ],
        order: 1,
      },
    ];

    it('should return detailed validation results', () => {
      const submissionData = {
        email: 'invalid-email',
      };

      const result = service.validateFormDataDetailed(formStructure, submissionData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
      expect(result.fieldErrors.email).toContain('Invalid email format');
    });

    it('should return valid result for correct data', () => {
      const submissionData = {
        email: 'test@example.com',
      };

      const result = service.validateFormDataDetailed(formStructure, submissionData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(Object.keys(result.fieldErrors)).toHaveLength(0);
    });
  });

  describe('field type validation', () => {
    it('should validate checkbox fields', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'agreed',
          label: 'Agreed to Terms',
          type: 'checkbox',
          required: true,
          order: 1,
        },
      ];

      const validData = { agreed: true };
      const invalidData = { agreed: 'yes' };

      expect(service.validateFormData(formStructure, validData)).toHaveLength(0);
      expect(service.validateFormData(formStructure, invalidData)).toContain(
        'Agreed to Terms must be true or false'
      );
    });

    it('should validate date fields', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'installDate',
          label: 'Installation Date',
          type: 'date',
          required: true,
          order: 1,
        },
      ];

      const validData = { installDate: '2024-01-15' };
      const invalidData = { installDate: 'not-a-date' };

      expect(service.validateFormData(formStructure, validData)).toHaveLength(0);
      expect(service.validateFormData(formStructure, invalidData)).toContain(
        'Installation Date must be a valid date'
      );
    });

    it('should validate text and textarea fields', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          validation: [
            {
              type: 'min',
              value: 10,
              message: 'Description must be at least 10 characters',
            },
            {
              type: 'max',
              value: 500,
              message: 'Description must be at most 500 characters',
            },
          ],
          order: 1,
        },
      ];

      const validData = { description: 'This is a valid description with enough characters' };
      const tooShortData = { description: 'Short' };
      const tooLongData = { description: 'x'.repeat(501) };

      expect(service.validateFormData(formStructure, validData)).toHaveLength(0);
      expect(service.validateFormData(formStructure, tooShortData)).toContain(
        'Description must be at least 10 characters'
      );
      expect(service.validateFormData(formStructure, tooLongData)).toContain(
        'Description must be at most 500 characters'
      );
    });
  });

  describe('validateFormStructure', () => {
    it('should validate correct form structure', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'test',
          label: 'Test Field',
          type: 'text',
          required: true,
          order: 1,
        },
      ];

      const errors = service.validateFormStructure(formStructure);
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate field IDs', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'test1',
          label: 'Test Field 1',
          type: 'text',
          required: true,
          order: 1,
        },
        {
          id: 'field-1', // Duplicate ID
          name: 'test2',
          label: 'Test Field 2',
          type: 'text',
          required: true,
          order: 2,
        },
      ];

      const errors = service.validateFormStructure(formStructure);
      expect(errors).toContain('Duplicate field ID: field-1');
    });

    it('should detect invalid field types', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'test',
          label: 'Test Field',
          type: 'invalid-type' as any,
          required: true,
          order: 1,
        },
      ];

      const errors = service.validateFormStructure(formStructure);
      expect(errors).toContain(
        'Invalid field type: invalid-type. Must be one of: text, number, select, textarea, checkbox, date'
      );
    });

    it('should validate select field options', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'test',
          label: 'Test Field',
          type: 'select',
          required: true,
          options: [], // Empty options
          order: 1,
        },
      ];

      const errors = service.validateFormStructure(formStructure);
      expect(errors).toContain('Select field test must have at least one option');
    });
  });

  describe('utility methods', () => {
    const formStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'required-text',
        label: 'Required Text',
        type: 'text',
        required: true,
        order: 1,
      },
      {
        id: 'field-2',
        name: 'optional-number',
        label: 'Optional Number',
        type: 'number',
        required: false,
        order: 2,
      },
    ];

    it('should get field by name', () => {
      const field = service.getFieldByName(formStructure, 'required-text');
      expect(field).toBeDefined();
      expect(field?.name).toBe('required-text');

      const nonExistent = service.getFieldByName(formStructure, 'non-existent');
      expect(nonExistent).toBeNull();
    });

    it('should get required fields', () => {
      const requiredFields = service.getRequiredFields(formStructure);
      expect(requiredFields).toHaveLength(1);
      expect(requiredFields[0].name).toBe('required-text');
    });

    it('should get optional fields', () => {
      const optionalFields = service.getOptionalFields(formStructure);
      expect(optionalFields).toHaveLength(1);
      expect(optionalFields[0].name).toBe('optional-number');
    });

    it('should get fields by type', () => {
      const textFields = service.getFieldsByType(formStructure, 'text');
      expect(textFields).toHaveLength(1);
      expect(textFields[0].name).toBe('required-text');

      const numberFields = service.getFieldsByType(formStructure, 'number');
      expect(numberFields).toHaveLength(1);
      expect(numberFields[0].name).toBe('optional-number');
    });
  });
});