import { check, log, section, type Equal, type Expect } from '../shared/demo';

export interface User {
  readonly id: string;
  name: string;
  email: string;
  readonly createdAt: Date;
}

/** Partial + Pick：所有字段可选，适合 PATCH 更新。 */
export type UserPatch = Partial<Pick<User, 'name' | 'email'>>;

/** Omit：去掉服务端生成的字段，作为创建用户的入参。 */
export type UserDraft = Omit<User, 'id' | 'createdAt'>;

/** Readonly + Pick：只读摘要。 */
export type UserSummary = Readonly<Pick<User, 'id' | 'name'>>;

/** Record：以邮箱为键的索引。 */
export type UserByEmail = Record<string, User>;

/** keyof / Extract / Exclude / NonNullable。 */
export type UserKey = keyof User;
export type StringUserKey = Extract<UserKey, string>;
export type WritableUserKey = Exclude<UserKey, 'id' | 'createdAt'>;
export type NonNullUser = NonNullable<User | null | undefined>;

/** ReturnType / Parameters / Awaited：从函数类型反推。 */
export function createUser(draft: UserDraft): User {
  return {
    ...draft,
    id: 'u-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
}

export type CreateUserParams = Parameters<typeof createUser>;
export type CreateUserResult = ReturnType<typeof createUser>;
export type CreateUserPromise = Awaited<Promise<CreateUserResult>>;

/** InstanceType / ConstructorParameters：从类反推实例和构造参数。 */
export class Session {
  constructor(
    public readonly token: string,
    public readonly ttlSeconds: number,
  ) {}
}

export type SessionInstance = InstanceType<typeof Session>;
export type SessionArgs = ConstructorParameters<typeof Session>;

/**
 * 品牌类型（branded type）：TypeScript 是结构化类型系统，
 * `string` 与 `string` 永远兼容，容易把订单 ID 传给客户 ID。
 * 用交叉类型加一个编译期标记，就能在类型层面区分它们，且不产生运行时开销。
 */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };
export type OrderId = Brand<string, 'OrderId'>;
export type CustomerId = Brand<string, 'CustomerId'>;

export function asOrderId(id: string): OrderId {
  return id as OrderId;
}

export function asCustomerId(id: string): CustomerId {
  return id as CustomerId;
}

export function findOrder(id: OrderId): string {
  return `order:${id}`;
}

export function findCustomer(id: CustomerId): string {
  return `customer:${id}`;
}

// 类型层面的断言。
export type UserKeyIsUnion = Expect<Equal<UserKey, 'id' | 'name' | 'email' | 'createdAt'>>;
export type StringUserKeyIsSame = Expect<Equal<StringUserKey, UserKey>>;
export type UserDraftKeys = Expect<Equal<keyof UserDraft, 'name' | 'email'>>;
export type NonNullUserIsUser = Expect<Equal<NonNullUser, User>>;
export type CreateUserParamsAreDraft = Expect<Equal<CreateUserParams, [draft: UserDraft]>>;
export type CreateUserResultIsUser = Expect<Equal<CreateUserResult, User>>;
export type CreateUserPromiseIsUser = Expect<Equal<CreateUserPromise, User>>;
export type SessionArgsAreTokenAndTtl = Expect<
  Equal<SessionArgs, [token: string, ttlSeconds: number]>
>;

export function runUtilitiesDemo(): void {
  section('内置工具类型、函数/类类型推导与品牌类型');

  const user = createUser({ name: 'Ada', email: 'ada@example.com' });
  log('user', user);
  check(user.id, 'u-1');
  check(user.email, 'ada@example.com');

  const patch: UserPatch = { email: 'ada@new.example.com' };
  const updated: User = { ...user, ...patch };
  check(updated.email, 'ada@new.example.com');
  check(updated.name, 'Ada');

  const summary: UserSummary = { id: user.id, name: user.name };
  log('summary', summary);

  const byEmail: UserByEmail = { [user.email]: user };
  check(byEmail['ada@example.com']?.name, 'Ada');

  const session = new Session('token-1', 3600);
  check(session instanceof Session, true);
  check(session.ttlSeconds, 3600);
  log('session', session);

  const orderId = asOrderId('o-1001');
  const customerId = asCustomerId('c-2002');
  check(findOrder(orderId), 'order:o-1001');
  check(findCustomer(customerId), 'customer:c-2002');
  // findOrder(customerId); // 编译错误：CustomerId 不能当作 OrderId 使用
  log('findOrder', findOrder(orderId));
  log('findCustomer', findCustomer(customerId));
}
