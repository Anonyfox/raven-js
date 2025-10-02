# Cortex Structures

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

Data structures and validation primitives for computational operations.

## Purpose

Matrix operations for linear algebra, Schema classes for type-safe data validation, and Dataset containers for structured content operations. Build neural network computations, validate data structures, and query collections using Float32Array storage and JSDoc type annotations.

High-performance building blocks optimized for V8 engine. Matrix operations support in-place modifications for memory efficiency. Schema validation provides compile-time safety through JSDoc typing with runtime verification. Dataset containers offer O(1) lookups and efficient filtering for static site generation and content management.

## Install

```bash
npm install @raven-js/cortex
```

## Usage

```javascript
// Dataset containers for structured content
import { Dataset } from "@raven-js/cortex/structures";

// Create typed collections with O(1) lookups
const posts = new Dataset([
  { id: 1, slug: "hello-world", title: "Hello World", category: "tutorial" },
  { id: 2, slug: "advanced-js", title: "Advanced JS", category: "guide" },
  {
    id: 3,
    slug: "performance",
    title: "Performance Tips",
    category: "tutorial",
  },
]);

// Fast key-based retrieval
const post = posts.get("hello-world");
console.log(post.title); // "Hello World"

// Efficient filtering and querying
const tutorials = posts.match({ category: "tutorial" });
const urls = posts.urls(); // ["/hello-world", "/advanced-js", "/performance"]
const categories = posts.pluck("category"); // ["tutorial", "guide"]

// Chainable operations for complex queries
const recentTutorials = posts
  .match({ category: "tutorial" })
  .sortBy("publishDate", "desc")
  .paginate(0, 5);
```

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

// Define schemas with validation rules
class User extends Schema {
  name = Schema.field("", { description: "User's full name" });
  age = Schema.field(0, { description: "Age in years" });
  email = Schema.field("", { description: "Email address", optional: true });
  status = Schema.field("active", {
    description: "Account status",
    enum: ["active", "inactive", "suspended"],
  });
  roles = Schema.field([], {
    description: "User roles",
    items: String,
    enum: ["admin", "user", "guest"],
  });
}

const user = new User();

// Boolean validation without modification
const validData = {
  name: "Alice",
  age: 30,
  status: "active",
  roles: ["admin", "user"],
};
console.log(user.validate(validData)); // true

// Deserialize and populate schema fields
user.fromJSON(validData);
console.log(user.name.value); // "Alice"
console.log(user.roles.value); // ["admin", "user"]

// Generate JSON Schema output
const schema = JSON.parse(user.toJSON());
console.log(schema.properties.status.enum); // ["active", "inactive", "suspended"]

// Arrays with explicit types (clean empty defaults)
class Task extends Schema {
  tags = Schema.field([], {
    description: "Task tags",
    items: String, // Use native constructors
  });
  scores = Schema.field([], {
    items: Number,
  });
  assignees = Schema.field([], {
    items: new User(), // Nested schema arrays
  });
}
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
