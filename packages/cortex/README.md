# Cortex

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

<div align="center">
  <img src="./media/logo.webp" alt="Cortex Logo" width="200" height="200" />
</div>

Machine learning, data structures, and temporal computation without dependencies.

## Purpose

Platform-native algorithms using Math APIs and Node.js built-ins. Build neural networks, matrix operations, schema validation, and holiday calculations using pure JavaScript primitives.

Structured learning that adapts rather than couples to AI service evolution. Matrix operations optimized for V8 engine performance. Temporal computation with governmental precision across 30+ countries.

## Install

```bash
npm install @raven-js/cortex
```

## Usage

```javascript
// Neural networks and machine learning
import { NeuralNetwork, LinearRegression } from "@raven-js/cortex";

const nn = new NeuralNetwork([2, 4, 1]); // 2 inputs, 4 hidden, 1 output
nn.trainBatch(
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [[0], [1], [1], [0]]
);
console.log(nn.predict([1, 0])); // XOR classification

const regression = new LinearRegression();
regression.trainBatch([
  { x: 1, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 6 },
]);
console.log(regression.predict({ x: 4 })); // 8
```

```javascript
// Matrix operations and data structures
import { Matrix, Schema } from "@raven-js/cortex";

const matrix = Matrix.random(3, 3);
const result = matrix.multiply(Matrix.identity(3));
console.log(result.toString());

class User extends Schema {
  name = Schema.field("", { description: "User name" });
  age = Schema.field(0, { description: "User age" });
}
const user = new User();
user.validate({ name: "Alice", age: 25 });
```

```javascript
// Temporal computation with governmental precision
import {
  calculateEasterSunday,
  calculateHolidaysOfYear,
} from "@raven-js/cortex";

const easter2024 = calculateEasterSunday(2024);
console.log(easter2024); // 2024-03-31

const usHolidays = calculateHolidaysOfYear({
  year: 2024,
  country: "US",
  region: "CA",
});
console.log(usHolidays.length); // Federal + California state holidays
```

```javascript
// AI text detection with hierarchical cascade
import { isAIText } from "@raven-js/cortex";
import { GERMAN_LANGUAGE_PACK } from "@raven-js/cortex/language/languagepacks/german.js";

const result = isAIText(
  "Das System bietet umfassende Funktionalität für moderne Geschäftsanwendungen.",
  { languagePack: GERMAN_LANGUAGE_PACK }
);

console.log({
  aiLikelihood: result.aiLikelihood, // 0.0-1.0 probability score
  certainty: result.certainty, // Detection confidence
  dominantPattern: result.dominantPattern, // Primary detection signal
  executionTime: result.executionTime, // Performance metrics
});
```

## Module Architecture

Cortex organizes intelligence into four specialized modules:

- **Learning** - Neural networks, linear regression, and base model classes for machine learning tasks
- **Language** - AI text detection with hierarchical cascade architecture and multi-language support
- **Structures** - Matrix operations and schema validation for data manipulation and type safety
- **Temporal** - Holiday calculations and date utilities covering 30+ countries with governmental precision

Each module can be imported individually for tree-shaking optimization:

```javascript
import { NeuralNetwork } from "@raven-js/cortex/learning";
import { isAIText } from "@raven-js/cortex/language";
import { Matrix } from "@raven-js/cortex/structures";
import { calculateEasterSunday } from "@raven-js/cortex/temporal";
```

## Requirements

- Node.js 22.5+
- ESM module support

## The Raven's Cortex

Ravens process information through distributed neural networks, sharing learning across the murder. Cortex mirrors this collective intelligence—adaptive algorithms that strengthen through usage, not coupling to external frameworks.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
