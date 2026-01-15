import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  details?: any;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Handle HTTP exceptions (NestJS built-in)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      return {
        statusCode: status,
        timestamp,
        path,
        method,
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : (exceptionResponse as any).message || exception.message,
        error: exception.name,
      };
    }

    // Handle Prisma errors
    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path, method);
    }

    // Handle validation errors
    if (this.isValidationError(exception)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
        method,
        message: 'Validation failed',
        error: 'ValidationError',
        details: (exception as any).details || (exception as any).message,
      };
    }

    // Handle generic errors
    const error = exception as Error;
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      message: 'Internal server error',
      error: error.name || 'InternalServerError',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  private handlePrismaError(
    exception: PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
    method: string,
  ): ErrorResponse {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          timestamp,
          path,
          method,
          message: 'Unique constraint violation',
          error: 'ConflictError',
          details: {
            field: exception.meta?.target,
            code: exception.code,
          },
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          timestamp,
          path,
          method,
          message: 'Record not found',
          error: 'NotFoundError',
          details: {
            code: exception.code,
          },
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
          method,
          message: 'Foreign key constraint violation',
          error: 'ForeignKeyError',
          details: {
            field: exception.meta?.field_name,
            code: exception.code,
          },
        };

      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
          method,
          message: 'Invalid relation data',
          error: 'RelationError',
          details: {
            code: exception.code,
          },
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp,
          path,
          method,
          message: 'Database error',
          error: 'DatabaseError',
          details: {
            code: exception.code,
            message: exception.message,
          },
        };
    }
  }

  private isValidationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ValidationError' ||
        exception.message.includes('validation') ||
        (exception as any).isJoi === true)
    );
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const { statusCode, message, error } = errorResponse;
    const { method, url, ip, headers } = request;

    const logContext = {
      statusCode,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      timestamp: errorResponse.timestamp,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${method} ${url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
        JSON.stringify(logContext),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${method} ${url} - ${statusCode} - ${message}`,
        JSON.stringify(logContext),
      );
    }
  }
}