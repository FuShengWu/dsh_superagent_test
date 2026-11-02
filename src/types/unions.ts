import { check, log, section } from '../shared/demo';

/**
 * 可辨识联合（discriminated union）：每个成员都有一个共同的「标签」字面量字段。
 * switch 收窄后可以直接访问对应成员独有的属性，default 分支则自动变成 never。
 */
export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

export function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape);
  }
}

/** 穷尽检查：如果给 Shape 新增成员却忘了处理，这里会编译报错。 */
export function assertNever(value: never): never {
  throw new Error(`未处理的分支: ${JSON.stringify(value)}`);
}

/**
 * Result 类型：用联合把「成功 / 失败」编码进类型。
 * 返回值不是抛异常，而是显式要求调用方处理失败分支，适合可预期的业务错误。
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/** 用户自定义类型守卫：返回 `value is T`，让收窄逻辑可以复用。 */
export interface ApiError {
  readonly code: number;
  readonly message: string;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'number' &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

/** 交叉类型：同时满足多个契约。 */
type Identifiable = { readonly id: string };
type Timestamped = { readonly createdAt: Date };
export type Stored<T> = T & Identifiable & Timestamped;

export function store<T extends object>(value: T): Stored<T> {
  return { ...value, id: 'id-1', createdAt: new Date('2026-01-01T00:00:00Z') };
}

export function runUnionsDemo(): void {
  section('联合类型、可辨识联合、Result 与类型守卫');

  const shapes: readonly Shape[] = [
    { kind: 'circle', radius: 2 },
    { kind: 'rectangle', width: 3, height: 4 },
    { kind: 'triangle', base: 6, height: 2 },
  ];

  const areas = shapes.map(area);
  log('areas', areas.map((value) => Number(value.toFixed(2))));
  check(areas[0], Math.PI * 4);
  check(areas[1], 12);
  check(areas[2], 6);

  const success = ok(42);
  const failure = err('boom');
  log('ok(42)', success);
  log("err('boom')", failure);
  check(unwrapOr(success, 0), 42);
  check(unwrapOr(failure, 0), 0);

  const apiError: unknown = { code: 404, message: 'not found' };
  check(isApiError(apiError), true);
  check(isApiError('404'), false);
  if (isApiError(apiError)) {
    log('isApiError 收窄后', `${apiError.code} ${apiError.message}`);
    check(apiError.code, 404);
  }

  const stored = store({ name: 'Ada' });
  log('stored', stored);
  check(stored.id, 'id-1');
  check(stored.name, 'Ada');
  check(stored.createdAt instanceof Date, true);

  let caught: unknown;
  try {
    // 模拟给 Shape 新增成员却忘记处理的场景：assertNever 在运行时兜底。
    assertNever('unexpected' as never);
  } catch (error) {
    caught = error;
  }
  check(caught instanceof Error, true);
  log('assertNever', (caught as Error).message);
}
