import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Handle class-validator errors
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      
      if (Array.isArray(responseObj.message)) {
        return response.status(status).json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          message: 'Validation failed',
          error: 'ValidationError',
          details: responseObj.message,
        });
      }
    }

    // Default handling
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      error: 'BadRequestError',
    });
  }
}