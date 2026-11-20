import type { PipeTransform } from '@nestjs/common';
import { z, type ZodError } from 'zod';
import { DomainError } from './domain-error';

export interface ValidationDetail { field: string; rule: string; params?: Record<string, number | string> }

/** Lỗi validate mang `details`; filter đọc để trả về theo `field`. */
export class ValidationFailed extends DomainError<'COMMON_VALIDATION_FAILED'> {
  constructor(readonly details: ValidationDetail[]) {
    super('COMMON_VALIDATION_FAILED');
  }
}

export function toDetails(error: ZodError): ValidationDetail[] {
  return error.issues.map((issue): ValidationDetail => {
    const field = issue.path.join('.');
    if (issue.code === 'too_small') return { field, rule: 'too_small', params: { min: Number(issue.minimum) } };
    if (issue.code === 'too_big') return { field, rule: 'too_big', params: { max: Number(issue.maximum) } };
    if (issue.code === 'custom') return { field, rule: issue.message };
    return { field, rule: issue.code === 'invalid_string' ? 'invalid_string' : issue.code };
  });
}

export class ZodPipe<S extends z.ZodTypeAny> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new ValidationFailed(toDetails(result.error));
    return result.data;
  }
}
