import { check, log, section } from '../shared/demo';

/**
 * 封装：把状态藏在类内部，只通过方法暴露受控的修改入口。
 *
 * - `private` / `protected` 是编译期约束，运行时仍是普通属性，可以被强制类型转换绕过；
 * - `#field` 是 ECMAScript 的运行时私有字段，外部和子类都无法访问，适合保护真正的不变量；
 * - `readonly` 只禁止重新赋值，不保证对象内部不可变（数组、对象仍可能被修改）。
 */
export class BankAccount {
  static readonly currency = 'CNY';
  private static nextSeq = 1;

  readonly id: string;
  protected readonly owner: string;
  #balance: number;

  constructor(owner: string, initialDeposit = 0) {
    this.id = `ACC-${String(BankAccount.nextSeq++).padStart(4, '0')}`;
    this.owner = owner;
    this.#balance = 0;
    if (initialDeposit > 0) this.deposit(initialDeposit);
  }

  get balance(): number {
    return this.#balance;
  }

  get ownerName(): string {
    return this.owner;
  }

  /** 返回 this 而不是 void，支持链式调用，同时保留子类的具体类型。 */
  deposit(amount: number): this {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new RangeError(`存款金额必须为正数，收到 ${amount}`);
    }
    this.#balance += amount;
    return this;
  }

  withdraw(amount: number): this {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new RangeError(`取款金额必须为正数，收到 ${amount}`);
    }
    if (amount > this.#balance) {
      throw new RangeError(`余额不足：当前 ${this.#balance} 元，尝试取出 ${amount} 元`);
    }
    this.#balance -= amount;
    return this;
  }

  transferTo(target: BankAccount, amount: number): this {
    this.withdraw(amount);
    target.deposit(amount);
    return this;
  }
}

/**
 * 参数属性（parameter properties）：在构造函数参数上直接加访问修饰符，
 * 省略「先声明字段、再在构造函数里赋值」的样板代码。
 * 这里同时用 readonly 保证坐标创建后不可变。
 */
export class Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  translate(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

export function runEncapsulationDemo(): void {
  section('封装、访问修饰符、参数属性与链式调用');

  const alice = new BankAccount('Alice', 100);
  const bob = new BankAccount('Bob');
  alice.transferTo(bob, 30).deposit(20);

  log('alice.id', alice.id);
  log('alice.ownerName', alice.ownerName);
  log('alice.balance', alice.balance);
  log('bob.balance', bob.balance);
  log('BankAccount.currency', BankAccount.currency);

  check(alice.balance, 90);
  check(bob.balance, 30);
  check(alice.id === bob.id, false);

  // 编译期就挡住了非法访问：
  // alice.#balance = 999;   // Property '#balance' is not accessible outside class
  // alice.owner = 'Mallory'; // Cannot assign to 'owner' because it is a read-only property

  let caught: unknown;
  try {
    alice.withdraw(1_000);
  } catch (error) {
    caught = error;
  }
  check(caught instanceof RangeError, true);
  log('超额取款被拦截', (caught as RangeError).message);

  const p1 = new Point(1, 2);
  const p2 = p1.translate(3, 4);
  log('p1', p1);
  log('p2', p2);
  check(p2.equals(new Point(4, 6)), true);
  check(p1.equals(p2), false);
}
