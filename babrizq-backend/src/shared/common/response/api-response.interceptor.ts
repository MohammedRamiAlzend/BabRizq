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
import { SKIP_API_RESPONSE_KEY } from '../decorators/skip-api-response.decorator';

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    // Routes marked @SkipApiResponse() (e.g. OAuth redirects) pass through raw.
    const skip = Reflect.getMetadata(SKIP_API_RESPONSE_KEY, context.getHandler());
    if (skip) {
      return next.handle();
    }
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
