import { check, log, section, type Equal, type Expect } from '../shared/demo';

/**
 * 泛型函数：在输入和输出之间建立类型关系。
 * 注意 K extends keyof T —— 编译器据此保证 key 一定存在于 items 的元素上。
 */
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

/** 泛型约束 + 默认类型参数。 */
export interface Paginated<T, Meta = { readonly total: number }> {
  readonly items: readonly T[];
  readonly meta: Meta;
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    meta: { total: items.length },
  };
}

/** 映射类型：逐个转换已有类型的属性。 */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** 递归映射类型：处理数组和嵌套对象。 */
export type DeepReadonly<T> = T extends readonly (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/** 条件类型 + infer：从数组类型中取出元素类型。 */
export type ElementType<T> = T extends readonly (infer U)[] ? U : never;

/** 条件类型递归：拆掉任意层 Promise。 */
export type AwaitedDeep<T> = T extends Promise<infer U> ? AwaitedDeep<U> : T;

/** 模板字面量类型：在类型层面拼接字符串。 */
export type EventName<T extends string> = `on${Capitalize<T>}`;
export type ChangedKey<T> = `${keyof T & string}Changed`;

/** 分布式条件类型：联合类型会逐项分发。 */
export type OnlyStrings<T> = T extends string ? T : never;

/** 变长元组 + const 类型参数（TS 5.0）：保留每个位置的字面量类型和顺序，并推断为 readonly 元组。 */
export function tuple<const T extends readonly unknown[]>(...items: T): T {
  return items;
}

const literalTuple = tuple('a', 1, true);

interface User {
  readonly id: number;
  readonly name: string;
  readonly active: boolean;
}

// 类型层面的断言：编译通过就说明推导结果符合预期。
export type PluckResult = Expect<Equal<ReturnType<typeof pluck<User, 'name'>>, string[]>>;
export type ElementOfNumberArray = Expect<Equal<ElementType<readonly number[]>, number>>;
export type AwaitedDeepString = Expect<Equal<AwaitedDeep<Promise<Promise<string>>>, string>>;
export type SaveEventName = Expect<Equal<EventName<'save'>, 'onSave'>>;
export type UserChangedKeys = Expect<
  Equal<ChangedKey<User>, 'idChanged' | 'nameChanged' | 'activeChanged'>
>;
export type OnlyStringMembers = Expect<Equal<OnlyStrings<string | number | symbol>, string>>;
export type TupleKeepsLiterals = Expect<Equal<typeof literalTuple, readonly ['a', 1, true]>>;
export type MutableRemovesReadonly = Expect<
  Equal<Mutable<{ readonly x: number; readonly y: number }>, { x: number; y: number }>
>;
export type NestedDeepReadonly = Expect<
  Equal<DeepReadonly<{ a: { b: number } }>, { readonly a: { readonly b: number } }>
>;

export function runGenericsDemo(): void {
  section('泛型、keyof、映射类型、条件类型与模板字面量类型');

  const users: readonly User[] = [
    { id: 1, name: 'Ada', active: true },
    { id: 2, name: 'Linus', active: false },
    { id: 3, name: 'Grace', active: true },
  ];

  check(pluck(users, 'name'), ['Ada', 'Linus', 'Grace']);
  check(pluck(users, 'id'), [1, 2, 3]);
  log('pluck(users, name)', pluck(users, 'name'));

  const page = paginate(users, 1, 2);
  log('page 1', page);
  check(page.items.length, 2);
  check(page.meta.total, 3);

  const readonlyUser: DeepReadonly<User> = users[0]!;
  check(readonlyUser.name, 'Ada');
  // readonlyUser.name = 'Mallory'; // 编译错误：DeepReadonly 后属性只读

  const event: EventName<'save'> = 'onSave';
  check(event, 'onSave');
  log('event', event);

  log('tuple', literalTuple);
  check(literalTuple, ['a', 1, true]);

  check(users.map((user) => user.id), [1, 2, 3]);
}
