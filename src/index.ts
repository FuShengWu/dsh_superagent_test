import { runCompositionDemo } from './oop/composition';
import { runEncapsulationDemo } from './oop/encapsulation';
import { runInheritanceDemo } from './oop/inheritance';
import { runPatternsDemo } from './oop/patterns';
import { runBasicsDemo } from './types/basics';
import { runGenericsDemo } from './types/generics';
import { runTypeGuardDemo } from './types/guards';
import { runUnionsDemo } from './types/unions';
import { runUtilitiesDemo } from './types/utilities';

console.log('TypeScript 面向对象惯用写法 + 类型系统示例');
console.log('运行环境：Node.js + tsc（strict 模式）');

// 面向对象：封装 -> 继承 -> 组合 -> 设计模式
runEncapsulationDemo();
runInheritanceDemo();
runCompositionDemo();
runPatternsDemo();

// 类型系统：基础 -> 联合 -> 泛型 -> 工具类型 -> 边界校验
runBasicsDemo();
runUnionsDemo();
runGenericsDemo();
runUtilitiesDemo();
runTypeGuardDemo();

console.log('\n全部示例运行通过 ✅');
