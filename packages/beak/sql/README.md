# Beak SQL

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**SQL template literals with automatic character escaping and injection protection.** String literal breakout prevention, performance-optimized escaping, and tiered template processing.

## Purpose

SQL query construction requires balancing performance with security. String concatenation is fast but vulnerable to injection attacks. ORM query builders add complexity and runtime overhead. Manual escaping is error-prone and inconsistent across database systems.

Beak SQL provides character-level escaping for string literal protection while maintaining readable query composition. Prevents string literal breakouts and binary injection without blocking legitimate SQL logic. Template processing optimizes for common usage patterns through tiered algorithms.

Security boundary focuses on character escaping - parameterized queries remain the gold standard for complete injection prevention.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import SQL functions and use them as tagged template literals:

```javascript
import { sql } from "@raven-js/beak/sql";

// Basic query with automatic escaping
const userQuery = sql`
  SELECT * FROM users
  WHERE name = '${userName}' AND status = '${userStatus}'
`;
// Input: userName="O'Connor", userStatus="active"
// → "SELECT * FROM users WHERE name = 'O''Connor' AND status = 'active'"

// Dynamic table and column names
const dynamicQuery = sql`
  SELECT ${columns} FROM ${tableName}
  WHERE created_at > '${timestamp}'
  LIMIT ${limit}
`;

// Complex conditions with user input
const searchQuery = sql`
  SELECT p.*, u.username FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE p.title LIKE '%${searchTerm}%'
  AND p.published = ${isPublished}
  ORDER BY p.created_at DESC
`;
```

**Security features:**

- **Character escaping**: Single quotes, backslashes, null bytes, newlines
- **Binary injection prevention**: Null byte and control character handling
- **String coercion**: Consistent type handling for all JavaScript values
- **Performance optimization**: O(n) scanning with O(1) character lookup

⚠️ **Security Boundary**: Prevents string literal breakouts but not logical injection. Use parameterized queries for complete protection.

## Performance

Template processing uses tiered optimization based on interpolation count:

- **0 values**: Direct string return with conditional trimming
- **1 value**: String concatenation (fastest path)
- **2-3 values**: StringBuilder pattern
- **4+ values**: Pre-sized array joins

Monomorphic value processing optimizes for V8 JIT compilation patterns.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's SQL

Like a raven that carefully processes potentially dangerous materials while extracting maximum value, Beak SQL transforms user input into safe query components. Surgical escaping precision without sacrificing query composition flexibility.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
