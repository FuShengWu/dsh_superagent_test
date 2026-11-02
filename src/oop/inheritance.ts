import { check, log, section } from '../shared/demo';

/**
 * 抽象类：描述「是什么」以及子类必须实现的契约。
 *
 * 惯用写法：
 * - 抽象成员只声明、不实现，强制子类补齐；
 * - 把共享逻辑放在基类的具体方法里（模板方法），子类只覆写变化点；
 * - 子类覆写时显式写 `override`（配合 tsconfig 的 noImplicitOverride，避免改基类时静默失配）。
 */
export abstract class Shape {
  abstract readonly kind: string;

  abstract area(): number;

  /** protected：只给子类用的校验工具，不暴露给调用方。 */
  protected ensurePositive(value: number, name: string): number {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name}必须为正数，收到 ${value}`);
    }
    return value;
  }

  /** 模板方法：流程固定在基类，子类只提供 area() 的实现。 */
  describe(): string {
    return `${this.kind}的面积是 ${this.area().toFixed(2)}`;
  }
}

export class Circle extends Shape {
  override readonly kind = '圆形';
  readonly #radius: number;

  constructor(radius: number) {
    super();
    this.#radius = this.ensurePositive(radius, '半径');
  }

  override area(): number {
    return Math.PI * this.#radius ** 2;
  }
}

export class Rectangle extends Shape {
  // 放宽为 string，让子类可以收窄成更精确的 '正方形' 字面量。
  override readonly kind: string = '矩形';

  constructor(
    protected readonly width: number,
    protected readonly height: number,
  ) {
    super();
    this.ensurePositive(width, '宽');
    this.ensurePositive(height, '高');
  }

  override area(): number {
    return this.width * this.height;
  }
}

/** 正方形「是一个」矩形：复用父类实现，同时收窄 kind 字面量类型。 */
export class Square extends Rectangle {
  override readonly kind = '正方形';

  constructor(side: number) {
    super(side, side);
  }
}

/** 多态：调用方只依赖 Shape，不关心具体子类。 */
export function totalArea(shapes: readonly Shape[]): number {
  return shapes.reduce((sum, shape) => sum + shape.area(), 0);
}

export function runInheritanceDemo(): void {
  section('抽象类、继承、多态与 override');

  const shapes: readonly Shape[] = [new Circle(2), new Rectangle(3, 4), new Square(2)];

  for (const shape of shapes) {
    log(shape.kind, shape.describe());
  }

  log('totalArea', totalArea(shapes).toFixed(2));
  check(totalArea(shapes), Math.PI * 4 + 12 + 4);
  check(new Square(2) instanceof Rectangle, true);
  check(new Square(2) instanceof Shape, true);

  let caught: unknown;
  try {
    new Circle(-1);
  } catch (error) {
    caught = error;
  }
  check(caught instanceof RangeError, true);
  log('非法半径被拦截', (caught as RangeError).message);
}
