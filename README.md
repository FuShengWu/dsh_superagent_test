# TypeScript 面向对象惯用写法 + 类型系统示例

一套可运行、可验证的 TypeScript 示例，用来说明日常业务代码里最常用的面向对象惯用写法，以及类型系统的核心能力。示例不依赖任何第三方运行时依赖，只用 TypeScript 编译器，`strict` 全开。

## 快速开始

```bash
npm install
npm run typecheck   # 类型检查（含类型层面的断言）
npm test            # 编译并运行全部示例，内置运行时断言
```

`npm start` 等价于 `npm run build && node dist/index.js`。需要 Node.js 18+。

## 目录结构

```text
src/
├── index.ts                  # 入口：按「面向对象 -> 类型系统」的顺序运行示例
├── shared/
│   └── demo.ts               # 分节输出、运行时断言、类型层面断言工具
├── oop/
│   ├── encapsulation.ts      # 封装、访问修饰符、readonly、# 私有字段、参数属性、链式调用
│   ├── inheritance.ts        # 抽象类、模板方法、继承、多态、override
│   ├── composition.ts        # 接口、泛型仓储、依赖注入、组合优于继承
│   └── patterns.ts           # 策略模式、Builder 模式、不可变对象
└── types/
    ├── basics.ts             # 基础类型、元组、字面量、as const、satisfies、unknown、never
    ├── unions.ts             # 联合、交叉、可辨识联合、穷尽检查、Result、类型守卫
    ├── generics.ts           # 泛型、keyof、映射类型、条件类型、infer、模板字面量类型
    ├── utilities.ts          # 内置工具类型、函数/类类型推导、品牌类型
    └── guards.ts             # unknown 收窄、类型守卫、断言函数、外部输入校验
```

## 面向对象惯用写法

| 主题 | 示例 | 关键点 |
| --- | --- | --- |
| 封装 | `BankAccount` | `private` / `protected` 是编译期约束；`#balance` 是运行时私有，适合保护不变量 |
| 参数属性 | `Point` | 构造函数参数直接加 `readonly`，省掉「声明 + 赋值」样板代码 |
| 链式调用 | `deposit()` / `transferTo()` | 返回 `this`，保留子类具体类型 |
| 抽象类 | `Shape` / `Circle` | `abstract` 强制子类实现；模板方法固定流程，子类只填变化点 |
| 继承与多态 | `Square extends Rectangle` | 子类可以收窄父类字面量类型；`override` + `noImplicitOverride` 防止静默失配 |
| 面向接口 | `Repository<T>` / `Logger` | 依赖最小契约，实现可以整体替换 |
| 组合优于继承 | `UserService` | 构造函数注入依赖，测试时换成内存实现，不需要 mock 框架 |
| 策略模式 | `DiscountStrategy` | 新增算法就新增类，避免 if/else 和继承爆炸 |
| Builder | `HttpRequestBuilder` | 链式构造 + `build()` 集中校验 + 不可变结果 |

## 类型系统要点

- **结构化类型**：TypeScript 看形状而不是类名；需要区分同形状的 `string` 时用品牌类型（`OrderId` / `CustomerId`）。
- **字面量与 `as const`**：从值反推精确类型，例如 `ROLES` 推出 `'admin' | 'editor' | 'viewer'`。
- **`satisfies`**：在保留对象自身推导类型（例如精确的键集合）的同时校验形状；写成类型注解会丢失这些信息。
- **联合与收窄**：`typeof`、`in`、`instanceof`、自定义类型守卫、可辨识联合的 `switch`。
- **穷尽检查**：`default: assertNever(shape)`，新增联合成员时编译期报错。
- **泛型约束**：`K extends keyof T` 让 `pluck(items, key)` 的返回类型精确到 `T[K][]`。
- **映射 / 条件 / 模板字面量类型**：`DeepReadonly`、`ElementType`、`AwaitedDeep`、`EventName<'save'>`。
- **内置工具类型**：`Partial`、`Pick`、`Omit`、`Readonly`、`Record`、`Exclude`、`Extract`、`NonNullable`、`ReturnType`、`Parameters`、`Awaited`、`InstanceType`、`ConstructorParameters`。
- **`unknown` 而不是 `any`**：外部输入先用守卫收窄，再访问属性；断言函数适合「失败就终止」的边界。
- **类型层面断言**：`Expect<Equal<A, B>>` 让「类型推导是否正确」也接受编译期检查。

## tsconfig 中的严格选项

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,   // arr[0] 可能是 undefined
  "exactOptionalPropertyTypes": true, // 可选属性没有隐式的 undefined
  "noImplicitOverride": true,         // 覆写必须写 override
  "noFallthroughCasesInSwitch": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

## 延伸阅读

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript 5.x Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)

示例中的每个结论都有运行时断言或类型层面断言，修改代码后执行 `npm test` 即可确认没有破坏原有语义。
