import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import type {
  ErrorApiResponse,
  ValidationDetail,
} from '../interfaces/api-response.interface';

const STATUS_CODE_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(HttpStatus)
    .filter(([key]) => isNaN(Number(key)))
    .map(([name, code]) => [code as number, name]),
);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const existingId = res.getHeader('X-Request-ID') as string | undefined;
    const requestId = existingId ?? randomUUID();
    res.setHeader('X-Request-ID', requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: ValidationDetail[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();

      if (typeof exRes === 'object' && exRes !== null) {
        const raw = exRes as Record<string, unknown>;

        // Structured validation errors produced by exceptionFactory in main.ts
        if (
          Array.isArray(raw.details) &&
          raw.details.length > 0 &&
          typeof (raw.details as unknown[])[0] === 'object'
        ) {
          details = raw.details as ValidationDetail[];
          message =
            typeof raw.message === 'string' ? raw.message : 'Validation failed';
        } else if (Array.isArray(raw.message)) {
          // Fallback: flat string array — parse "field message text" format
          details = (raw.message as string[]).map((m) => {
            const spaceIdx = m.indexOf(' ');
            return spaceIdx > -1
              ? { field: m.slice(0, spaceIdx), message: m.slice(spaceIdx + 1) }
              : { field: 'unknown', message: m };
          });
          message = 'Validation failed';
        } else if (typeof raw.message === 'string') {
          message = raw.message;
        } else {
          message = exception.message;
        }
      } else if (typeof exRes === 'string') {
        message = exRes;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unknown exception type thrown', String(exception));
    }

    const code = details
      ? 'VALIDATION_ERROR'
      : (STATUS_CODE_MAP[status] ?? 'INTERNAL_SERVER_ERROR');

    const body: ErrorApiResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
      meta: { requestId },
    };

    res.status(status).json(body);
  }
}
