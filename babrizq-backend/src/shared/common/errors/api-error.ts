/**
 * ApiError — typed application error carrying the machine-readable code the
 * frontend contracts expect (`topError.code`, e.g. `PRODUCT_NOT_FOUND`).
 *
 * The global `ApiExceptionFilter` already maps `payload.error` to
 * `topError.code`, so throwing an ApiError produces exactly the envelope
 * documented in each role app's `needed-endpoints-from-backend` files:
 *
 *   { isSuccess: false, isError: true, errors: [message],
 *     topError: { code, httpStatus }, value: null }
 */
import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(
    readonly code: string,
    status: HttpStatus,
    message: string,
  ) {
    super({ error: code, message, statusCode: status }, status);
  }

  static badRequest(code: string, message: string): ApiError {
    return new ApiError(code, HttpStatus.BAD_REQUEST, message);
  }

  static notFound(code: string, message: string): ApiError {
    return new ApiError(code, HttpStatus.NOT_FOUND, message);
  }

  static conflict(code: string, message: string): ApiError {
    return new ApiError(code, HttpStatus.CONFLICT, message);
  }
}
