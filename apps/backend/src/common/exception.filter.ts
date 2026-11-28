import { Catch, HttpException, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { ERROR_DEFS, type ApiErrorBody, type ErrorCode } from '@xin-via/shared';
import { DomainError } from './domain-error';
import { ValidationFailed, toDetails } from './zod.pipe';

function codeForHttpStatus(status: number): ErrorCode {
  if (status === 401) return 'AUTH_REQUIRED';
  if (status === 403) return 'COMMON_FORBIDDEN';
  if (status === 404) return 'COMMON_NOT_FOUND';
  if (status === 429) return 'COMMON_RATE_LIMITED';
  return status >= 500 ? 'COMMON_INTERNAL_ERROR' : 'COMMON_VALIDATION_FAILED';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const req = http.getRequest<FastifyRequest>();
    const requestId = req.id;

    const build = (code: ErrorCode, extra: Partial<ApiErrorBody['error']> = {}): void => {
      const body: ApiErrorBody = { error: { code, requestId, ...extra } };
      void reply.status(ERROR_DEFS[code].status).send(body);
    };

    if (exception instanceof ValidationFailed) return build('COMMON_VALIDATION_FAILED', { details: exception.details });
    if (exception instanceof ZodError) return build('COMMON_VALIDATION_FAILED', { details: toDetails(exception) });
    if (exception instanceof DomainError) {
      const params = exception.params;
      return build(exception.code, params && Object.keys(params).length > 0 ? { params: { ...params } } : {});
    }
    if (exception instanceof HttpException) return build(codeForHttpStatus(exception.getStatus()));

    Sentry.captureException(exception);
    this.logger.error(`[${requestId}] ${exception instanceof Error ? (exception.stack ?? exception.message) : String(exception)}`);
    return build('COMMON_INTERNAL_ERROR');
  }
}
