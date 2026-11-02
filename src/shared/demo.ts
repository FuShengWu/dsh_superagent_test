import assert from 'node:assert/strict';

let sectionIndex = 0;

/** 打印分节标题，让示例输出可读。 */
export function section(title: string): void {
  sectionIndex += 1;
  const line = '─'.repeat(64);
  console.log(`\n${line}\n${sectionIndex}. ${title}\n${line}`);
}

/** 打印一个具名示例的结果。 */
export function log(label: string, value: unknown): void {
  console.log(`  ${label}: ${format(value)}`);
}

function format(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Map) return JSON.stringify(Object.fromEntries(value));
  if (value instanceof Set) return JSON.stringify([...value]);
  const json = JSON.stringify(value);
  return json === undefined ? String(value) : json;
}

/**
 * 运行示例并断言结果符合预期。
 * 示例不只是「打印」，每个关键结论都有运行时断言，`npm test` 会真正校验它们。
 */
export function check<T>(actual: T, expected: T, label?: string): T {
  assert.deepEqual(actual, expected, label);
  return actual;
}

/**
 * 类型层面的断言工具：只有类型完全相等时才能通过编译。
 * 用法：type _ = Expect<Equal<A, B>>;
 */
export type Expect<T extends true> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
