import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FormValidationService } from './form-validation.service';
import { ReportsService } from './reports.service';
import { DynamicFormService } from './dynamic-form.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportSchemaService } from '../products/report-schema.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('FormValidationService Integration', () => {
  let formValidationService: FormValidationService;
  let reportsService: ReportsService;
  let mockPrismaService: any;
  let mockReportSchemaService: any;
  let mockNotificationsService: any;

  beforeEach(async () => {
    const mockPrisma = {
      technicalReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      onboardingTask: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    } as any;

    const mockReportSchema = {
      findByProductId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getFormStructure: jest.fn(),
    } as any;

    const mockNotifications = {
      notifyReportSubmitted: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormValidationService,
        ReportsService,
        DynamicFormService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ReportSchemaService,
          useValue: mockReportSchema,
        },
        {
          provide: NotificationsService,
          useValue: mockNotifications,
        },
      ],
    }).compile();

    formValidationService = module.get<FormValidationService>(FormValidationService);
    reportsService = module.get<ReportsService>(ReportsService);
    mockPrismaService = module.get(PrismaService) as any;
    mockReportSchemaService = module.get(ReportSchemaService) as any;
    mockNotificationsService = module.get(NotificationsService) as any;
  });

  it('should be defined', () => {
    expect(formValidationService).toBeDefined();
    expect(reportsService).toBeDefined();
  });

  describe('ReportsService integration with FormValidationService', () => {
    const mockTask = {
      id: 'task-1',
      productId: 'product-1',
      product: { id: 'product-1', name: 'Test Product' },
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: { id: 'role-1', name: 'IMPLEMENTATION_LEAD' },
    };

    const mockReportSchema = {
      id: 'schema-1',
      productId: 'product-1',
      formStructure: [
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
          name: 'location',
          label: 'Installation Location',
          type: 'select',
          required: true,
          options: [
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
          ],
          order: 2,
        },
      ],
    };

    beforeEach(() => {
      mockPrismaService.onboardingTask.findUnique.mockResolvedValue(mockTask as any);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser as any);
      mockReportSchemaService.findByProductId.mockResolvedValue(mockReportSchema as any);
    });

    it('should successfully create report with valid data', async () => {
      const validSubmissionData = {
        signalStrength: -80,
        location: 'indoor',
      };

      const mockCreatedReport = {
        id: 'report-1',
        taskId: 'task-1',
        submissionData: validSubmissionData,
        submittedBy: 'user-1',
        task: mockTask,
        submitter: mockUser,
      };

      mockPrismaService.technicalReport.create.mockResolvedValue(mockCreatedReport as any);
      mockPrismaService.onboardingTask.update.mockResolvedValue(mockTask as any);

      const result = await reportsService.create({
        taskId: 'task-1',
        submissionData: validSubmissionData,
        submittedBy: 'user-1',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.technicalReport.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          submissionData: validSubmissionData,
          submittedBy: 'user-1',
        },
        include: expect.any(Object),
      });
    });

    it('should reject report creation with invalid data', async () => {
      const invalidSubmissionData = {
        signalStrength: -130, // Below minimum
        location: 'invalid_location', // Invalid option
      };

      await expect(
        reportsService.create({
          taskId: 'task-1',
          submissionData: invalidSubmissionData,
          submittedBy: 'user-1',
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.technicalReport.create).not.toHaveBeenCalled();
    });

    it('should sanitize data during report creation', async () => {
      const submissionDataWithWhitespace = {
        signalStrength: -80,
        location: '  indoor  ', // With whitespace
      };

      const expectedSanitizedData = {
        signalStrength: -80,
        location: 'indoor', // Trimmed
      };

      const mockCreatedReport = {
        id: 'report-1',
        taskId: 'task-1',
        submissionData: expectedSanitizedData,
        submittedBy: 'user-1',
        task: mockTask,
        submitter: mockUser,
      };

      mockPrismaService.technicalReport.create.mockResolvedValue(mockCreatedReport as any);
      mockPrismaService.onboardingTask.update.mockResolvedValue(mockTask as any);

      await reportsService.create({
        taskId: 'task-1',
        submissionData: submissionDataWithWhitespace,
        submittedBy: 'user-1',
      });

      expect(mockPrismaService.technicalReport.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          submissionData: expectedSanitizedData, // Should be sanitized
          submittedBy: 'user-1',
        },
        include: expect.any(Object),
      });
    });

    it('should handle missing required fields', async () => {
      const incompleteSubmissionData = {
        // Missing signalStrength (required)
        location: 'indoor',
      };

      await expect(
        reportsService.create({
          taskId: 'task-1',
          submissionData: incompleteSubmissionData,
          submittedBy: 'user-1',
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.technicalReport.create).not.toHaveBeenCalled();
    });
  });

  describe('FormValidationService error handling', () => {
    it('should provide detailed error information', () => {
      const formStructure = [
        {
          id: 'field-1',
          name: 'email',
          label: 'Email Address',
          type: 'text' as const,
          required: true,
          validation: [
            {
              type: 'pattern' as const,
              value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
              message: 'Please enter a valid email address',
            },
          ],
          order: 1,
        },
      ];

      const invalidData = {
        email: 'invalid-email',
      };

      const result = formValidationService.validateSubmissionData(formStructure, invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.email[0]).toMatchObject({
        field: 'email',
        code: 'PATTERN_MISMATCH',
        message: 'Please enter a valid email address',
        value: 'invalid-email',
      });
    });

    it('should create proper BadRequestException', () => {
      const formStructure = [
        {
          id: 'field-1',
          name: 'required_field',
          label: 'Required Field',
          type: 'text' as const,
          required: true,
          order: 1,
        },
      ];

      const invalidData = {}; // Missing required field

      expect(() => {
        formValidationService.enforceValidationRules(formStructure, invalidData);
      }).toThrow(BadRequestException);

      try {
        formValidationService.enforceValidationRules(formStructure, invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toMatchObject({
          message: 'Form validation failed',
          errors: expect.any(Array),
          fieldErrors: expect.any(Object),
          globalErrors: expect.any(Array),
          timestamp: expect.any(String),
        });
      }
    });
  });
});