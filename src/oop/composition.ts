import { check, log, section } from '../shared/demo';

/**
 * 面向接口编程：类只依赖最小契约，而不是具体实现。
 * `Entity` 和 `Repository` 都是纯类型，不产生任何运行时代码。
 */
export interface Entity<ID = string> {
  readonly id: ID;
}

export interface Repository<T extends Entity<ID>, ID = string> {
  findById(id: ID): T | undefined;
  save(entity: T): T;
  all(): readonly T[];
  delete(id: ID): boolean;
}

/** 泛型类实现接口：内存仓储，可作为测试替身或原型。 */
export class InMemoryRepository<T extends Entity<ID>, ID = string> implements Repository<T, ID> {
  readonly #items = new Map<ID, T>();

  save(entity: T): T {
    this.#items.set(entity.id, entity);
    return entity;
  }

  findById(id: ID): T | undefined {
    return this.#items.get(id);
  }

  all(): readonly T[] {
    return [...this.#items.values()];
  }

  delete(id: ID): boolean {
    return this.#items.delete(id);
  }
}

export interface Logger {
  info(message: string): void;
}

export class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(`  [console] ${message}`);
  }
}

/** 测试用日志：只收集消息，方便断言。 */
export class CollectingLogger implements Logger {
  readonly messages: string[] = [];

  info(message: string): void {
    this.messages.push(message);
  }
}

export interface User extends Entity {
  readonly name: string;
  readonly email: string;
}

/**
 * 组合优于继承：UserService 通过构造函数注入仓储和日志。
 *
 * - 不继承任何基类，因此不被基类的实现细节绑死；
 * - 依赖的是 Repository / Logger 接口，测试时换成内存实现即可，不需要 mock 框架；
 * - 依赖显式出现在构造函数里，调用方一眼能看出这个类需要什么。
 */
export class UserService {
  #seq = 0;

  constructor(
    private readonly users: Repository<User>,
    private readonly logger: Logger,
  ) {}

  register(input: Omit<User, 'id'>): User {
    const user: User = { id: `user-${++this.#seq}`, ...input };
    this.users.save(user);
    this.logger.info(`注册用户 ${user.name} (${user.id})`);
    return user;
  }

  find(id: string): User {
    const user = this.users.findById(id);
    if (!user) throw new Error(`用户不存在: ${id}`);
    return user;
  }

  count(): number {
    return this.users.all().length;
  }
}

export function runCompositionDemo(): void {
  section('接口、泛型仓储、依赖注入与组合');

  const logger = new CollectingLogger();
  const repository = new InMemoryRepository<User>();
  const service = new UserService(repository, logger);

  const ada = service.register({ name: 'Ada', email: 'ada@example.com' });
  const linus = service.register({ name: 'Linus', email: 'linus@example.com' });

  log('ada', ada);
  log('用户数', service.count());
  log('日志', logger.messages);

  check(service.find(ada.id).name, 'Ada');
  check(service.count(), 2);
  check(logger.messages.length, 2);
  check(repository.findById(linus.id)?.email, 'linus@example.com');

  check(repository.delete(ada.id), true);
  check(service.count(), 1);

  // 依赖可以整体替换：换成 ConsoleLogger 不需要改 UserService 一行代码。
  const productionLogger: Logger = new ConsoleLogger();
  productionLogger.info('同一个 Logger 接口，另一种实现');
}
