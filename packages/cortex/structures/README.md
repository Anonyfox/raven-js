# Cortex Structures

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Data structures and validation primitives for computational operations.

## Purpose

Matrix operations for linear algebra and Schema classes for type-safe data validation. Build neural network computations and validate structured data using Float32Array storage and JSDoc type annotations.

High-performance building blocks optimized for V8 engine. Matrix operations support in-place modifications for memory efficiency. Schema validation provides compile-time safety through JSDoc typing with runtime verification.

## Install

```bash
npm install @raven-js/cortex
```

## Usage

```javascript
// Matrix operations for linear algebra
import { Matrix } from "@raven-js/cortex/structures";

// Create and manipulate matrices
const a = new Matrix(2, 3, [1, 2, 3, 4, 5, 6]);
const b = new Matrix(3, 2, [1, 2, 3, 4, 5, 6]);
const result = a.multiply(b);

console.log(result.toString());
// Matrix 2×2:
// [22.000, 28.000]
// [49.000, 64.000]

// Matrix arithmetic operations
const identity = Matrix.identity(3);
const random = Matrix.random(3, 3, -1, 1);
const sum = random.add(identity);

// In-place operations for efficiency
random.addInPlace(identity);
random.scaleInPlace(0.5);
random.reluInPlace(); // Apply ReLU activation
```

```javascript
// Schema validation for type safety
import { Schema } from "@raven-js/cortex/structures";

class User extends Schema {
  name = Schema.field("", { description: "User's full name" });
  age = Schema.field(0, { description: "Age in years" });
  email = Schema.field("", { description: "Email address", optional: true });
}

const userSchema = new User();

// Validate data structures
const validData = { name: "Alice", age: 30, email: "alice@example.com" };
const isValid = userSchema.validate(validData);
console.log(isValid); // true

const invalidData = { name: "Bob" }; // Missing required 'age'
try {
  userSchema.validate(invalidData);
} catch (error) {
  console.log(error.message); // Validation error details
}
```

```javascript
// Nested schemas and complex validation
import { Schema } from "@raven-js/cortex/structures";

class Address extends Schema {
  street = Schema.field("", { description: "Street address" });
  city = Schema.field("", { description: "City name" });
  zip = Schema.field("", { description: "ZIP code" });
}

class Company extends Schema {
  name = Schema.field("", { description: "Company name" });
  address = Schema.field(new Address(), { description: "Company address" });
  employees = Schema.field([], { description: "Employee count" });
}

const company = new Company();
const companyData = {
  name: "Tech Corp",
  address: { street: "123 Main St", city: "San Francisco", zip: "94105" },
  employees: 50,
};

console.log(company.validate(companyData)); // true
```

## Requirements

- Node.js 22.5+
- ESM module support

## The Raven's Structure

Ravens build complex social structures and remember spatial relationships across vast territories. Cortex Structures mirrors this organizational intelligence—efficient data patterns that maintain integrity through validation and mathematical precision.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
