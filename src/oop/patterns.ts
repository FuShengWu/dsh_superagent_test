import { check, log, section } from '../shared/demo';

/**
 * 策略模式：把可变的算法抽成接口，运行时组合。
 * 相比「继承 + 大量 if/else」，新增一种折扣只需新增一个类。
 */
export interface DiscountStrategy {
  readonly name: string;
  apply(amount: number): number;
}

export class NoDiscount implements DiscountStrategy {
  readonly name = '无折扣';

  apply(amount: number): number {
    return amount;
  }
}

export class PercentageDiscount implements DiscountStrategy {
  readonly name: string;

  constructor(private readonly percent: number) {
    if (percent < 0 || percent > 100) {
      throw new RangeError(`折扣百分比需在 0~100 之间，收到 ${percent}`);
    }
    this.name = `${percent}% 折扣`;
  }

  apply(amount: number): number {
    return roundMoney(amount * (1 - this.percent / 100));
  }
}

export class ThresholdDiscount implements DiscountStrategy {
  readonly name = '满减';

  constructor(
    private readonly threshold: number,
    private readonly reduction: number,
  ) {}

  apply(amount: number): number {
    return amount >= this.threshold ? roundMoney(amount - this.reduction) : amount;
  }
}

/** 上下文类只依赖 DiscountStrategy 接口，不关心具体算法。 */
export class Checkout {
  constructor(private discount: DiscountStrategy = new NoDiscount()) {}

  use(discount: DiscountStrategy): this {
    this.discount = discount;
    return this;
  }

  total(items: readonly { readonly price: number; readonly quantity: number }[]): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return this.discount.apply(subtotal);
  }
}

/**
 * Builder：用链式调用逐步构造复杂对象，在 build() 时集中校验，
 * 最终产出不可变对象；私有构造函数强制调用方走 create()，便于以后改成工厂或缓存。
 */
export interface HttpRequest {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string;
}

export class HttpRequestBuilder {
  #method: HttpRequest['method'] = 'GET';
  #url = '';
  #headers: Record<string, string> = {};
  #body: string | undefined;

  static create(): HttpRequestBuilder {
    return new HttpRequestBuilder();
  }

  private constructor() {}

  method(method: HttpRequest['method']): this {
    this.#method = method;
    return this;
  }

  url(url: string): this {
    this.#url = url;
    return this;
  }

  header(name: string, value: string): this {
    this.#headers[name] = value;
    return this;
  }

  body(body: string): this {
    this.#body = body;
    return this;
  }

  build(): HttpRequest {
    if (!/^https?:\/\//.test(this.#url)) {
      throw new Error(`URL 必须使用 http(s) 协议，收到: ${this.#url || '(空)'}`);
    }

    const request: HttpRequest = {
      method: this.#method,
      url: this.#url,
      headers: Object.freeze({ ...this.#headers }),
      ...(this.#body === undefined ? {} : { body: this.#body }),
    };
    return Object.freeze(request);
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function runPatternsDemo(): void {
  section('策略模式与 Builder 模式');

  const cart = [
    { price: 99.9, quantity: 2 },
    { price: 10, quantity: 1 },
  ];

  const checkout = new Checkout();
  log('原价', checkout.total(cart));
  check(checkout.total(cart), 209.8);

  checkout.use(new PercentageDiscount(10));
  log('九折', checkout.total(cart));
  check(checkout.total(cart), 188.82);

  const thresholdCheckout = new Checkout(new ThresholdDiscount(200, 30));
  log('满 200 减 30', thresholdCheckout.total(cart));
  check(thresholdCheckout.total(cart), 179.8);

  const request = HttpRequestBuilder.create()
    .method('POST')
    .url('https://api.example.com/users')
    .header('content-type', 'application/json')
    .body(JSON.stringify({ name: 'Ada' }))
    .build();

  log('request', request);
  check(request.method, 'POST');
  check(request.body, '{"name":"Ada"}');
  check(Object.isFrozen(request), true);
  check(Object.isFrozen(request.headers), true);

  let caught: unknown;
  try {
    HttpRequestBuilder.create().build();
  } catch (error) {
    caught = error;
  }
  check(caught instanceof Error, true);
  log('非法 URL 被拦截', (caught as Error).message);
}
