import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ArgumentsHost } from '@nestjs/common';
import { ValidationExceptionFilter } from './validation-exception.filter';
import * as fc from 'fast-check';

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationExceptionFilter],
    }).compile();

    filter = module.get<ValidationExceptionFilter>(ValidationExceptionFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test',
      method: 'POST',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BadRequestException Handling', () => {
    it('should handle BadRequestException with array of validation messages', () => {
      const validationMessages = ['email must be a valid email', 'password is too short'];
      const exception = new BadRequestException({
        message: validationMessages,
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'POST',
        message: 'Validation failed',
        error: 'ValidationError',
        details: validationMessages,
      });
    });

    it('should handle BadRequestException with string message', () => {
      const exception = new BadRequestException('Invalid input data');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'POST',
        message: 'Invalid input data',
        error: 'BadRequestError',
      });
    });

    it('should handle BadRequestException with object response but no message array', () => {
      const exception = new BadRequestException({
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/test',
        method: 'POST',
        message: 'Bad Request Exception',
        error: 'BadRequestError',
      });
    });
  });

  describe('Property-based tests', () => {
    // Feature: crm-workflow-system, Property 10: Form Validation Enforcement
    it('should handle any validation error message format consistently', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
            fc.string({ minLength: 1 }),
            fc.record({
              message: fc.oneof(
                fc.array(fc.string({ minLength: 1 })),
                fc.string({ minLength: 1 })
              ),
              error: fc.string(),
              statusCode: fc.constant(400),
            })
          ),
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          }),
          (exceptionData, request) => {
            const mockHost = {
              switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => mockResponse,
                getRequest: () => request,
              }),
            } as any;

            let exception: BadRequestException;
            if (Array.isArray(exceptionData)) {
              exception = new BadRequestException({
                message: exceptionData,
                error: 'Bad Request',
                statusCode: 400,
              });
            } else if (typeof exceptionData === 'string') {
              exception = new BadRequestException(exceptionData);
            } else {
              exception = new BadRequestException(exceptionData);
            }

            filter.catch(exception, mockHost);

            // Should always return 400 status
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            
            // Should always return proper structure
            expect(mockResponse.json).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: 400,
                timestamp: expect.any(String),
                path: expect.any(String),
                method: expect.any(String),
                message: expect.anything(),
                error: expect.stringMatching(/ValidationError|BadRequestError/),
              })
            );

            // Reset mocks for next iteration
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: crm-workflow-system, Property 10: Form Validation Enforcement
    it('should preserve validation details for array messages', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          (validationMessages) => {
            const exception = new BadRequestException({
              message: validationMessages,
              error: 'Bad Request',
              statusCode: 400,
            });

            const mockHost = {
              switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => mockResponse,
                getRequest: () => mockRequest,
              }),
            } as any;

            filter.catch(exception, mockHost);

            const responseCall = mockResponse.json.mock.calls[0][0];
            
            // Should have ValidationError type for array messages
            expect(responseCall.error).toBe('ValidationError');
            expect(responseCall.message).toBe('Validation failed');
            expect(responseCall.details).toEqual(validationMessages);

            // Reset mocks for next iteration
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});