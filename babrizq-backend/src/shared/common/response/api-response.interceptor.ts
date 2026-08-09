/**
 * Global response interceptor — wraps every successful controller payload in
 * the standard envelope. Exceptions are handled separately by
 * `ApiExceptionFilter`.
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from './api-response';

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        isSuccess: true,
        isError: false,
        errors: [] as string[],
        topError: null,
        value: (data ?? null) as T,
      })),
    );
  }
}
