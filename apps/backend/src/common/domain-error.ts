import { ERROR_DEFS, type ErrorCode, type ErrorParams } from '@chot-via/shared';

type ParamArgs<C extends ErrorCode> = keyof ErrorParams<C> extends never ? [] : [params: ErrorParams<C>];

/** Lỗi nghiệp vụ: chỉ mang mã + tham số có kiểu; backend không viết câu chữ cho người dùng. */
export class DomainError<C extends ErrorCode = ErrorCode> extends Error {
  readonly status: number;
  readonly params: ErrorParams<C> | undefined;

  constructor(readonly code: C, ...args: ParamArgs<C>) {
    super(code);
    this.status = ERROR_DEFS[code].status;
    this.params = args[0];
  }
}
