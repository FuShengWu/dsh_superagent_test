import { check, log, section, type Equal, type Expect } from '../shared/demo';

/** 1. 基础类型与对象形状：让编译器知道值的结构。 */
export type UserId = string;
export type Timestamp = number;

export interface UserProfile {
  readonly id: UserId;
  name: string;
  email?: string;
  readonly tags: readonly string[];
  metadata: Record<string, unknown>;
}

/** 2. 元组：长度和每个位置的类型都固定，比数组更精确。 */
export type Point2D = [x: number, y: number];
export type HttpResponse = readonly [status: number, body: string];

/** 3. 字面量类型 + as const：从值反推出精确的联合类型。 */
export const ROLES = ['admin', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

/** 4. satisfies：保留对象自身的推导类型（精确的键集合），同时校验它满足 Record<Role, string>；写成类型注解则会丢失键的精确性。 */
export const ROLE_LABELS = {
  admin: '管理员',
  editor: '编辑',
  viewer: '访客',
} satisfies Record<Role, string>;

/**
 * 5. 现代 TS 更推荐 const object + 联合类型，而不是 enum：
 * enum 会生成运行时代码，且和 JS 生态中「普通对象 + 联合类型」的习惯不一致；
 * const object 更贴近 JS，也能配合类型收窄。
 */
export const LogLevel = {
  Debug: 10,
  Info: 20,
  Warn: 30,
  Error: 40,
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/** 6. unknown 是安全的「未知」；使用前必须收窄。any 则会关闭检查。 */
export function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}

export function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** 7. never 表示「不会正常返回」，适合表达不可能的分支。 */
export function fail(message: string): never {
  throw new Error(message);
}

// 类型层面的断言：编译通过就说明类型符合预期。
export type RoleIsLiteralUnion = Expect<Equal<Role, 'admin' | 'editor' | 'viewer'>>;
export type PointIsTuple = Expect<Equal<Point2D, [number, number]>>;
export type LogLevelIsNumberUnion = Expect<Equal<LogLevel, 10 | 20 | 30 | 40>>;
export type HttpResponseStatusIsNumber = Expect<Equal<HttpResponse[0], number>>;

export function runBasicsDemo(): void {
  section('基础类型、字面量、元组与 satisfies');

  const profile: UserProfile = {
    id: 'u-1',
    name: 'Ada',
    tags: ['typescript', 'oop'],
    metadata: { active: true, loginCount: 3 },
  };
  log('profile', profile);

  const point: Point2D = [1, 2];
  const [x, y] = point;
  check(x + y, 3);
  log('point', { x, y });

  const response: HttpResponse = [200, 'ok'];
  check(response[0], 200);
  check(response[1], 'ok');

  const role: Role = 'editor';
  log('role', `${role} -> ${ROLE_LABELS[role]}`);
  check(ROLE_LABELS[role], '编辑');

  const level: LogLevel = LogLevel.Warn;
  check(level, 30);
  log('logLevel', level);

  const json: unknown = parseJson('{"answer":42}');
  check(readString(json, '不是字符串'), '不是字符串');
  check(readString(parseJson('"hello"'), '不是字符串'), 'hello');

  let caught: unknown;
  try {
    fail('示例：fail() 返回 never');
  } catch (error) {
    caught = error;
  }
  check(caught instanceof Error, true);
  log('fail()', (caught as Error).message);
}
