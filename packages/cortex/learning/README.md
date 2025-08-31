# Cortex Learning

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Machine learning algorithms using platform-native JavaScript implementations.

## Purpose

Neural networks, linear regression, and base model infrastructure for classification and regression tasks. Build predictive models without external ML libraries using pure Math APIs and incremental learning patterns.

Adaptive learning that strengthens through usage. Models serialize completely for persistence and can train on streaming data without storing entire datasets in memory.

## Install

```bash
npm install @raven-js/cortex
```

## Usage

```javascript
// Neural network for pattern recognition
import { NeuralNetwork } from "@raven-js/cortex/learning";

const nn = new NeuralNetwork([2, 4, 1]); // 2 inputs, 4 hidden, 1 output

// XOR classification training
const inputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
const targets = [[0], [1], [1], [0]];

nn.trainBatch(inputs, targets, { learningRate: 0.1, epochs: 1000 });

console.log(nn.predict([0, 1])); // Should output close to [1]
console.log(nn.predict([1, 1])); // Should output close to [0]
```

```javascript
// Linear regression for trend analysis
import { LinearRegression } from "@raven-js/cortex/learning";

const regression = new LinearRegression();

// Incremental training on streaming data
regression.train({ x: 1, y: 2 });
regression.train({ x: 2, y: 4 });
regression.train({ x: 3, y: 6 });

console.log(regression.predict({ x: 4 })); // 8
console.log(regression.getParameters()); // { slope: 2, intercept: 0, ... }

// Calculate model accuracy
const r2 = regression.calculateR2([
  { x: 1, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 6 },
]);
console.log(`R² = ${r2.toFixed(3)}`); // Perfect fit: R² = 1.000
```

```javascript
// Model serialization and persistence
import { LinearRegression } from "@raven-js/cortex/learning";

const model = new LinearRegression();
model.trainBatch([
  { x: 1, y: 2 },
  { x: 2, y: 4 },
]);

// Serialize for storage
const serialized = model.toJSON();
const jsonString = JSON.stringify(serialized);

// Restore from serialized state
const restored = LinearRegression.fromJSON(JSON.parse(jsonString));
console.log(restored.predict({ x: 3 })); // Same prediction as original
```

## Requirements

- Node.js 22.5+
- ESM module support

## The Raven's Learning

Ravens demonstrate remarkable learning abilities, adapting behavior based on experience and sharing knowledge across the murder. Cortex Learning mirrors this adaptive intelligence—algorithms that strengthen through training without coupling to external frameworks.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
