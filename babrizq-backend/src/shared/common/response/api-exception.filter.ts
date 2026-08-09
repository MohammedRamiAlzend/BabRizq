/**
 * Global exception filter — converts every thrown exception into the standard
 * error envelope:
 *
 *   { isSuccess: false, isError: true, errors: [...], topError: { code, httpStatus }, value: null }
 *
 * class-validator `BadRequestException` payloads (array of constraint
 * messages) are flattened into the `errors` list.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './api-response';

interface ValidationErrorPayload {
  message?: string | string[];
  error?: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let errors: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse() as ValidationErrorPayload;

      httpStatus = status;
      code = typeof payload?.error === 'string' ? payload.error : exception.name;
      errors = this.extractMessages(payload);
    } else {
      // Unexpected error — log the stack, expose nothing internally.
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiResponse<null> = {
      isSuccess: false,
      isError: true,
      errors,
      topError: { code, httpStatus },
      value: null,
    };

    response.status(httpStatus).json(body);
  }

  /** Flattens class-validator / Nest error payloads into readable strings. */
  private extractMessages(payload: ValidationErrorPayload): string[] {
    if (!payload) return ['Request failed'];
    if (typeof payload.message === 'string') return [payload.message];
    if (Array.isArray(payload.message)) return payload.message;
    return ['Request failed'];
  }
}
