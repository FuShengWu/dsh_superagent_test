import { check, log, section } from '../shared/demo';

/**
 * 外部输入（JSON、API 响应、localStorage）的静态类型是不可信的。
 * 惯用做法：先当作 unknown，再用类型守卫逐层收窄，而不是直接 `as`。
 */
export interface ApiUser {
  readonly id: number;
  readonly name: string;
  readonly email?: string;
}

/** 基础守卫：判断一个值是否是普通对象。 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 组合守卫：把多个字段检查组合成一个可复用的类型守卫。 */
export function isApiUser(value: unknown): value is ApiUser {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    // exactOptionalPropertyTypes 下，可选属性要么不存在，要么是 string；显式 undefined 不算合法。
    (!('email' in value) || typeof value.email === 'string')
  );
}

/**
 * 断言函数（assertion function）：失败时抛错，成功时把 unknown 收窄为 ApiUser。
 * 和类型守卫的区别：调用后不需要 if 分支，适合「失败就终止」的边界入口。
 */
export function assertApiUser(value: unknown): asserts value is ApiUser {
  if (!isApiUser(value)) {
    throw new TypeError(`不是合法的 ApiUser: ${JSON.stringify(value)}`);
  }
}

export function parseApiUser(json: string): ApiUser {
  const parsed: unknown = JSON.parse(json);
  assertApiUser(parsed);
  return parsed;
}

export function runTypeGuardDemo(): void {
  section('unknown、类型守卫与断言函数');

  const user = parseApiUser('{"id":1,"name":"Ada","email":"ada@example.com"}');
  log('parseApiUser', user);
  check(user.name, 'Ada');
  check(user.email, 'ada@example.com');

  check(isApiUser({ id: 1, name: 'Ada' }), true);
  check(isApiUser({ id: 1, name: 'Ada', email: 'ada@example.com' }), true);
  check(isApiUser({ id: '1', name: 'Ada' }), false);
  // exactOptionalPropertyTypes 下 email 不能是显式 undefined；要么不写，要么写 string。
  check(isApiUser({ id: 1, name: 'Ada', email: undefined }), false);
  check(isApiUser(null), false);
  check(isApiUser([1, 2, 3]), false);

  let caught: unknown;
  try {
    parseApiUser('{"id":1}');
  } catch (error) {
    caught = error;
  }
  check(caught instanceof TypeError, true);
  log('非法响应被拦截', (caught as TypeError).message);

  // unknown 必须收窄后才能访问属性；any 则会直接放行并埋下运行时错误。
  const value: unknown = { nested: { ok: true } };
  if (isRecord(value) && isRecord(value.nested)) {
    check(value.nested.ok, true);
    log('收窄后访问嵌套属性', value.nested.ok);
  }
}
