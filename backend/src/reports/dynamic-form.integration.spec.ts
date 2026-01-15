import { Test, TestingModule } from '@nestjs/testing';
import { DynamicFormService } from './dynamic-form.service';
import { ReportSchemaService, FormField } from '../products/report-schema.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DynamicFormService Integration', () => {
  let service: DynamicFormService;
  let reportSchemaService: ReportSchemaService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicFormService,
        ReportSchemaService,
        {
          provide: PrismaService,
          useValue: {
            reportSchema: {
              findUnique: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DynamicFormService>(DynamicFormService);
    reportSchemaService = module.get<ReportSchemaService>(ReportSchemaService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should integrate with ReportSchemaService to get form schema', async () => {
    const mockProduct = {
      id: 'product-1',
      name: 'Test Product',
      code: 'TEST-001',
      description: 'Test product description',
    };

    const mockFormStructure: FormField[] = [
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
    ];

    const mockReportSchema = {
      id: 'schema-1',
      productId: 'product-1',
      formStructure: mockFormStructure,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: mockProduct,
    };

    // Mock the database calls
    (prismaService.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
    (prismaService.reportSchema.findUnique as jest.Mock).mockResolvedValue(mockReportSchema);

    // Test getting form schema for product
    const schema = await service.getFormSchemaForProduct('product-1');
    expect(schema).toBeDefined();
    expect(schema.formStructure).toEqual(mockFormStructure);

    // Test generating form fields
    const generatedFields = service.generateFormFields(mockFormStructure);
    expect(generatedFields).toHaveLength(2);
    expect(generatedFields[0]).toMatchObject({
      id: 'field-1',
      name: 'signalStrength',
      label: 'Signal Strength (dBm)',
      type: 'number',
      htmlType: 'number',
      placeholder: 'Enter signal strength (dbm)',
      defaultValue: null,
    });

    // Test form validation with the generated schema
    const validSubmissionData = {
      signalStrength: -80,
      installationLocation: 'indoor',
    };

    const invalidSubmissionData = {
      signalStrength: -150, // Below minimum
      installationLocation: 'invalid-location',
    };

    const validationErrors = service.validateFormData(mockFormStructure, validSubmissionData);
    expect(validationErrors).toHaveLength(0);

    const invalidationErrors = service.validateFormData(mockFormStructure, invalidSubmissionData);
    expect(invalidationErrors.length).toBeGreaterThan(0);
    expect(invalidationErrors).toContain('Signal strength must be above -120 dBm');
    expect(invalidationErrors).toContain('Installation Location must be one of: indoor, outdoor');
  });

  it('should handle complex form structures with all field types', () => {
    const complexFormStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'deviceName',
        label: 'Device Name',
        type: 'text',
        required: true,
        validation: [
          {
            type: 'min',
            value: 3,
            message: 'Device name must be at least 3 characters',
          },
          {
            type: 'max',
            value: 50,
            message: 'Device name must be at most 50 characters',
          },
        ],
        order: 1,
      },
      {
        id: 'field-2',
        name: 'signalStrength',
        label: 'Signal Strength',
        type: 'number',
        required: true,
        validation: [
          {
            type: 'min',
            value: -120,
            message: 'Signal must be above -120 dBm',
          },
          {
            type: 'max',
            value: -30,
            message: 'Signal must be below -30 dBm',
          },
        ],
        order: 2,
      },
      {
        id: 'field-3',
        name: 'location',
        label: 'Installation Location',
        type: 'select',
        required: true,
        options: [
          { value: 'indoor', label: 'Indoor' },
          { value: 'outdoor', label: 'Outdoor' },
          { value: 'basement', label: 'Basement' },
        ],
        order: 3,
      },
      {
        id: 'field-4',
        name: 'notes',
        label: 'Installation Notes',
        type: 'textarea',
        required: false,
        validation: [
          {
            type: 'max',
            value: 1000,
            message: 'Notes must be at most 1000 characters',
          },
        ],
        order: 4,
      },
      {
        id: 'field-5',
        name: 'testingComplete',
        label: 'Testing Complete',
        type: 'checkbox',
        required: true,
        order: 5,
      },
      {
        id: 'field-6',
        name: 'installationDate',
        label: 'Installation Date',
        type: 'date',
        required: true,
        order: 6,
      },
    ];

    // Test form field generation
    const generatedFields = service.generateFormFields(complexFormStructure);
    expect(generatedFields).toHaveLength(6);

    // Verify each field type gets correct HTML type and defaults
    expect(generatedFields[0].htmlType).toBe('text');
    expect(generatedFields[1].htmlType).toBe('number');
    expect(generatedFields[2].htmlType).toBe('select');
    expect(generatedFields[3].htmlType).toBe('textarea');
    expect(generatedFields[4].htmlType).toBe('checkbox');
    expect(generatedFields[5].htmlType).toBe('date');

    // Test comprehensive validation
    const validData = {
      deviceName: 'Test Device',
      signalStrength: -75,
      location: 'indoor',
      notes: 'Installation went smoothly',
      testingComplete: true,
      installationDate: '2024-01-15',
    };

    const validationResult = service.validateFormDataDetailed(complexFormStructure, validData);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);

    // Test validation with errors
    const invalidData = {
      deviceName: 'AB', // Too short
      signalStrength: -25, // Too high
      location: 'invalid', // Invalid option
      notes: 'x'.repeat(1001), // Too long
      testingComplete: 'yes', // Wrong type
      installationDate: 'invalid-date', // Invalid date
    };

    const invalidResult = service.validateFormDataDetailed(complexFormStructure, invalidData);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
    expect(invalidResult.fieldErrors).toBeDefined();
  });

  it('should validate form structure integrity', () => {
    const validStructure: FormField[] = [
      {
        id: 'field-1',
        name: 'test',
        label: 'Test Field',
        type: 'text',
        required: true,
        order: 1,
      },
    ];

    const invalidStructure: FormField[] = [
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

    const validErrors = service.validateFormStructure(validStructure);
    expect(validErrors).toHaveLength(0);

    const invalidErrors = service.validateFormStructure(invalidStructure);
    expect(invalidErrors.length).toBeGreaterThan(0);
    expect(invalidErrors).toContain('Duplicate field ID: field-1');
  });
});