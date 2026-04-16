import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { SKIP_RESPONSE_WRAPPER_KEY } from '../decorators/skip-response-wrapper.decorator';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import type {
  SuccessApiResponse,
  PaginatedApiResponse,
  PaginatedServiceResponse,
} from '../interfaces/api-response.interface';

// '__httpCode__' is the internal NestJS constant set by @HttpCode().
const HTTP_CODE_METADATA_KEY = '__httpCode__';

const DEFAULT_MESSAGES: Record<string, string> = {
  GET: 'OK',
  POST: 'Created successfully',
  PATCH: 'Updated successfully',
  PUT: 'Updated successfully',
  DELETE: 'Deleted successfully',
};

function isPaginatedResponse(
  value: unknown,
): value is PaginatedServiceResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.data) &&
    typeof v.total === 'number' &&
    typeof v.page === 'number' &&
    typeof v.limit === 'number' &&
    typeof v.pages === 'number'
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessApiResponse<T> | PaginatedApiResponse | void
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessApiResponse<T> | PaginatedApiResponse | void> {
    // @SkipResponseWrapper() — pass through untouched
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_WRAPPER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return next.handle() as Observable<void>;

    // 204 No Content — body must remain empty
    const httpCode = this.reflector.get<number>(
      HTTP_CODE_METADATA_KEY,
      context.getHandler(),
    );
    if (httpCode === HttpStatus.NO_CONTENT)
      return next.handle() as Observable<void>;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const incoming = req.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && incoming.length > 0
        ? incoming
        : randomUUID();

    res.setHeader('X-Request-ID', requestId);

    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const message = customMessage ?? DEFAULT_MESSAGES[req.method] ?? 'OK';

    return next.handle().pipe(
      map((data): SuccessApiResponse<T> | PaginatedApiResponse => {
        if (isPaginatedResponse(data)) {
          return {
            success: true,
            data: data.data,
            message,
            meta: {
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.pages,
              requestId,
            },
          } as PaginatedApiResponse;
        }

        return { success: true, data, message, meta: { requestId } };
      }),
    );
  }
}
