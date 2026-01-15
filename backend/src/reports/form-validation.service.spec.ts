import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FormValidationService } from './form-validation.service';
import { FormField, ValidationRule } from '../products/report-schema.service';

describe('FormValidationService', () => {
  let service: FormValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormValidationService],
    }).compile();

    service = module.get<FormValidationService>(FormValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateSubmissionData', () => {
    const sampleFormStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'signalStrength',
        label: 'Signal Strength (dBm)',
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
        name: 'installationLocation',
        label: 'Installation Location',
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
        label: 'Additional Notes',
        type: 'textarea',
        required: false,
        validation: [
          {
            type: 'max',
            value: 500,
            message: 'Notes must be at most 500 characters',
          },
        ],
        order: 3,
      },
    ];

    it('should validate correct submission data', () => {
      const submissionData = {
        signalStrength: -80,
        installationLocation: 'indoor',
        notes: 'Installation went smoothly',
      };

      const result = service.validateSubmissionData(sampleFormStructure, submissionData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fieldErrors).toEqual({});
    });

    it('should reject missing required fields', () => {
      const submissionData = {
        notes: 'Some notes',
      };

      const result = service.validateSubmissionData(sampleFormStructure, submissionData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.fieldErrors.signalStrength).toBeDefined();
      expect(result.fieldErrors.installationLocation).toBeDefined();
    });

    it('should validate number field constraints', () => {
      const submissionData = {
        signalStrength: -130, // Below minimum
        installationLocation: 'indoor',
      };

      const result = service.validateSubmissionData(sampleFormStructure, submissionData);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.signalStrength).toBeDefined();
      expect(result.fieldErrors.signalStrength[0].code).toBe('MIN_VALUE_VIOLATION');
    });

    it('should validate select field options', () => {
      const submissionData = {
        signalStrength: -80,
        installationLocation: 'invalid_option',
      };

      const result = service.validateSubmissionData(sampleFormStructure, submissionData);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.installationLocation).toBeDefined();
      expect(result.fieldErrors.installationLocation[0].code).toBe('INVALID_OPTION');
    });

    it('should validate text length constraints', () => {
      const submissionData = {
        signalStrength: -80,
        installationLocation: 'indoor',
        notes: 'a'.repeat(501), // Exceeds maximum length
      };

      const result = service.validateSubmissionData(sampleFormStructure, submissionData);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.notes).toBeDefined();
      expect(result.fieldErrors.notes[0].code).toBe('MAX_LENGTH_VIOLATION');
    });

    it('should detect unexpected fields', () => {
      const submissionData = {
        signalStrength: -80,
        installationLocation: 'indoor',
        unexpectedField: 'should not be here',
      };

      const result = service.validateSubmissionData(sampleFormStructure, submissionData);

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.unexpectedField).toBeDefined();
      expect(result.fieldErrors.unexpectedField[0].code).toBe('UNEXPECTED_FIELD');
    });
  });

  describe('enforceValidationRules', () => {
    const sampleFormStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'email',
        label: 'Email Address',
        type: 'text',
        required: true,
        validation: [
          {
            type: 'pattern',
            value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            message: 'Please enter a valid email address',
          },
        ],
        order: 1,
      },
    ];

    it('should return sanitized data for valid input', () => {
      const submissionData = {
        email: '  test@example.com  ', // With whitespace
      };

      const result = service.enforceValidationRules(sampleFormStructure, submissionData);

      expect(result.email).toBe('test@example.com'); // Trimmed
    });

    it('should throw BadRequestException for invalid input', () => {
      const submissionData = {
        email: 'invalid-email',
      };

      expect(() => {
        service.enforceValidationRules(sampleFormStructure, submissionData);
      }).toThrow(BadRequestException);
    });
  });

  describe('validateFormStructure', () => {
    it('should validate correct form structure', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'testField',
          label: 'Test Field',
          type: 'text',
          required: true,
          order: 1,
        },
      ];

      const result = service.validateFormStructure(formStructure);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty form structure', () => {
      const result = service.validateFormStructure([]);

      expect(result.isValid).toBe(false);
      expect(result.globalErrors[0].code).toBe('EMPTY_FORM_STRUCTURE');
    });

    it('should reject duplicate field IDs', () => {
      const formStructure: FormField[] = [
        {
          id: 'field-1',
          name: 'testField1',
          label: 'Test Field 1',
          type: 'text',
          required: true,
          order: 1,
        },
        {
          id: 'field-1', // Duplicate ID
          name: 'testField2',
          label: 'Test Field 2',
          type: 'text',
          required: true,
          order: 2,
        },
      ];

      const result = service.validateFormStructure(formStructure);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_FIELD_ID')).toBe(true);
    });
  });

  describe('sanitizeSubmissionData', () => {
    it('should trim string values', () => {
      const data = {
        name: '  John Doe  ',
        age: 30,
        active: true,
      };

      const result = service.sanitizeSubmissionData(data);

      expect(result.name).toBe('John Doe');
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
    });

    it('should handle null and undefined values', () => {
      const data = {
        name: null,
        description: undefined,
        count: NaN,
      };

      const result = service.sanitizeSubmissionData(data);

      expect(result.name).toBe(null);
      expect(result.description).toBe(undefined);
      expect(result.count).toBe(null); // NaN converted to null
    });
  });
});