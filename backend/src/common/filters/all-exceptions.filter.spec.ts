import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter, ErrorResponse } from './all-exceptions.filter';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as fc from 'fast-check';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
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

  describe('HTTP Exception Handling', () => {
    it('should handle HttpException correctly', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
          error: 'HttpException',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
        })
      );
    });

    it('should handle HttpException with object response', () => {
      const exceptionResponse = { message: ['field1 error', 'field2 error'] };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['field1 error', 'field2 error'],
          error: 'HttpException',
        })
      );
    });
  });

  describe('Prisma Error Handling', () => {
    it('should handle P2002 unique constraint violation', () => {
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        }
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          message: 'Unique constraint violation',
          error: 'ConflictError',
          details: {
            field: ['email'],
            code: 'P2002',
          },
        })
      );
    });

    it('should handle P2025 record not found', () => {
      const exception = new PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'NotFoundError',
          details: {
            code: 'P2025',
          },
        })
      );
    });

    it('should handle P2003 foreign key constraint violation', () => {
      const exception = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' },
        }
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint violation',
          error: 'ForeignKeyError',
          details: {
            field: 'userId',
            code: 'P2003',
          },
        })
      );
    });

    it('should handle unknown Prisma errors', () => {
      const exception = new PrismaClientKnownRequestError(
        'Unknown database error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
        }
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          error: 'DatabaseError',
          details: {
            code: 'P9999',
            message: 'Unknown database error',
          },
        })
      );
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle validation errors', () => {
      const exception = new Error('Validation failed');
      exception.name = 'ValidationError';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          error: 'ValidationError',
        })
      );
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic errors', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Error',
        })
      );
    });

    it('should handle unknown exceptions', () => {
      const exception = 'String error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        })
      );
    });
  });

  describe('Property-based tests', () => {
    // Feature: crm-workflow-system, Property 20: External Service Integration
    it('should always return valid ErrorResponse structure', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({
              message: fc.string(),
              status: fc.integer({ min: 400, max: 599 }),
            }),
            fc.record({
              name: fc.string(),
              message: fc.string(),
            }),
            fc.string()
          ),
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
            ip: fc.ipV4(),
            headers: fc.record({
              'user-agent': fc.string(),
            }),
          }),
          (exception, request) => {
            const mockHost = {
              switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => mockResponse,
                getRequest: () => request,
              }),
            } as any;

            // Create appropriate exception type
            let testException: any;
            if (typeof exception === 'object' && 'status' in exception) {
              testException = new HttpException(exception.message, exception.status);
            } else if (typeof exception === 'object' && 'name' in exception) {
              testException = new Error(exception.message);
              testException.name = exception.name;
            } else {
              testException = exception;
            }

            filter.catch(testException, mockHost);

            // Verify response structure
            expect(mockResponse.status).toHaveBeenCalledWith(expect.any(Number));
            expect(mockResponse.json).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: expect.any(Number),
                timestamp: expect.any(String),
                path: expect.any(String),
                method: expect.any(String),
                message: expect.anything(),
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

    // Feature: crm-workflow-system, Property 20: External Service Integration
    it('should map HTTP status codes correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1 }),
          (statusCode, message) => {
            const exception = new HttpException(message, statusCode);
            const mockHost = {
              switchToHttp: jest.fn().mockReturnValue({
                getResponse: () => mockResponse,
                getRequest: () => mockRequest,
              }),
            } as any;

            filter.catch(exception, mockHost);

            // Should preserve the original status code
            expect(mockResponse.status).toHaveBeenCalledWith(statusCode);
            
            const responseCall = mockResponse.json.mock.calls[0][0];
            expect(responseCall.statusCode).toBe(statusCode);

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