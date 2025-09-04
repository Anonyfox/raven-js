Got it. Here’s a single, end-to-end plan for **@raven-js/talons/relational** that you can implement as-is: lean, zero-deps, ESM-only, Node 22+ + modern browsers (SQLite WASM), **shared surface only**, and **automatic, transparent** “just works” behavior—including a smart, configurable pool and sensible cluster/parallel defaults.

# Goals & philosophy

- **One shared API** across Postgres, MySQL, SQLite. No engine-only features.
- **Tiny, fast, predictable.** Default to safe, lossless types; avoid hidden magic.
- **Zero deps, ESM, JSDoc** (no `.d.ts`). Modern JS only.
- **Tree-shakeable**: import only what you use; browser SQLite path has **no `node:` imports**.
- **Transparent convenience**: DSN/URI config; **auto TLS**, **auto pooling**, **AbortSignal**; streaming with backpressure.

---

# Public API (shared across drivers)

All drivers implement the same surface.

**Top-level:**

- `connect(dsnOrConfig[, options]) → Promise<Client>`
  (Auto-select driver by scheme or explicit `driver: 'pg'|'mysql'|'sqlite-node'|'sqlite-wasm'`)

**Client:**

- `query(sql, params?, opts?) → Promise<{ rows, rowCount }>`
- `stream(sql, params?, opts?) → AsyncIterable<Row>`
- `prepare(sql, opts?) → Promise<Statement>`
- `transaction(fn, opts?) → Promise<T>` (nested → savepoints)
- `close()`

**Statement:**

- `execute(params?, opts?) → Promise<{ rows, rowCount }>`
- `stream(params?, opts?) → AsyncIterable<Row>`
- `close()`

**Options (engine-neutral):**

- `shape: 'object' | 'array'` (default `'object'`)
- `dateAsString: boolean` (default `true`)
- `bigint: 'bigint' | 'string'` (default `'bigint'`)
- `json: 'parse' | 'string'` (default `'parse'`)
- `signal?: AbortSignal`
- `timeoutMs?: number`
- `meta?: boolean` (include lightweight metadata like `rowCount`)

**Pooling (automatic, configurable at connect):**

- `pool: 'auto' | false | { max?: number, min?: number, idleMs?: number, acquireMs?: number }`
  Default: `'auto'` (details in “Pooling & cluster” below).

**Result shapes & codecs (same everywhere):**

- `'object'`: `{ col: value }`
- `'array'`: `[value0, value1, ...]`
- Type mapping:

  - `int2/4 → number`, `int8 → bigint` (or `"string"`),
  - `decimal/numeric → "string"` (lossless),
  - `float → number`, `bool → boolean`,
  - `json → parsed` (toggle),
  - `timestamp/date → "string"` (toggle to `Date`),
  - `bytea/blob → Uint8Array`.

**Error shape (unified):**

```js
{ code: string, message: string, driver: 'pg'|'mysql'|'sqlite', sqlState?: string, detail?: string }
```

---

# Configuration (just works; minimal knobs)

**Accept both DSN & object:**

- Postgres: `postgres://user:pass@host:port/db?sslmode=require`
- MySQL: `mysql://user:pass@host:port/db`
- SQLite (Node): `sqlite:file:/absolute/path.db` or `sqlite:mem`
- SQLite (WASM): `sqlite+wasm://` (requires `wasm: engine` in options)

**TLS policy (PG/MySQL):**

- Default `tls: 'require'` **unless** host is `localhost`/`127.0.0.1`/`::1` → then `'disable'`.
- `'verify'` is available for strict mTLS scenarios (user supplies CA).

**Timeouts & cancel:**

- `connectTimeoutMs` default 10_000.
- Per-query `timeoutMs` optional.
- All operations accept `AbortSignal`.

---

# Module breakdown (optimal for tree-shaking)

Package root: `@raven-js/talons/relational`. Everything below lives under this submodule.

## 1) Core (engine-agnostic; **no `node:` imports**)

- `core/client.js` — public façade; routes calls to a driver; normalizes options.
- `core/statement.js` — engine-neutral prepared statement wrapper.
- `core/row-shapes.js` — object/array shaping; precomputed column map; stable constructors.
- `core/codecs.js` — shared decoders (see mapping above); per-column overrides hook.
- `core/errors.js` — error normalization; add driver tag & optional `sqlState`.
- `core/cancel.js` — timeouts + `AbortSignal` glue; no timers unless used.
- `core/utils.js` — tiny LRU (statement cache), ring buffer helpers, utf-8 helpers, stable object factory.
- `core/config.js` — DSN parser, TLS heuristics, defaults merger.
- `core/pool.js` — **generic pool** (used by all drivers when `pool !== false`):

  - FIFO queue; `min` warmup; `max` hard cap; `idleMs` reaper (no timers if pool idle);
  - per-acquire timeout; emits `'acquire'|'release'|'create'|'destroy'` hooks.

- `core/metrics.js` (optional) — no-op hooks by default; callback-based if imported.

> **Why:** Everything here is portable, small, and tree-shakable. The core never imports any driver.

## 2) Drivers (thin adapters; one file each)

Each driver implements a private `DriverConn` interface consumed by the core:

- `simpleQuery(sql, params, opts)`

- `prepare(sql, opts)` → `{ id, columns, close() }`

- `execPrepared(id, params, opts)`

- `streamQuery(…)` → AsyncIterable of row chunks (core shapes rows)

- `begin/commit/rollback`

- `close()` and lifecycle events

- `drivers/pg.js` — PG v3 protocol (extended path for params), SCRAM auth, TLS via `node:tls`. Minimal binary decoding (ints/floats/bool) + text for others; JSON/date per core codecs.

- `drivers/mysql.js` — 4.1+/8 protocol, TLS default; `COM_QUERY` + prepared statements; length-encoded parsing.

- `drivers/sqlite-node.js` — wraps `node:sqlite` (Node 22+). If unavailable, throws clear error with enable instructions.

- `drivers/sqlite-wasm.js` — **no `node:` imports**. Accepts `{ engine }` (user-supplied WASM with `prepare/step/get/finalize/exec`). Maps to core shapes.

> **Why:** Drivers contain all wire/FFI specifics. Users import a driver subpath explicitly or connect via DSN (which lazy-loads the right driver path).

## 3) Environment helpers (optional, tree-shakable)

- `extras/cluster.js` — **pool share helper** for clusters:

  - Compute per-process pool size from a **target total** (env `RAVEN_POOL_TOTAL` or option `poolTotalTarget`) and **workers count** (env `WEB_CONCURRENCY` or Node’s `cluster` when present).
  - Returns `{ maxPerProcess, minPerProcess }` to feed into `pool` config.

- `extras/introspection.js` — `describe(sql)` best-effort using `prepare`.
- `extras/diagnostics.js` — debug logging (opt-in), pool gauges, simple timer API.

---

# Exports map (guaranteed shake & browser safety)

In **@raven-js/talons** `package.json`:

```json
{
  "name": "@raven-js/talons",
  "type": "module",
  "sideEffects": false,
  "exports": {
    "./relational": { "import": "./dist/relational/core/client.js" },
    "./relational/pool": { "import": "./dist/relational/core/pool.js" },
    "./relational/pg": { "import": "./dist/relational/drivers/pg.js" },
    "./relational/mysql": { "import": "./dist/relational/drivers/mysql.js" },
    "./relational/sqlite-node": {
      "import": "./dist/relational/drivers/sqlite-node.js"
    },
    "./relational/sqlite-wasm": {
      "import": "./dist/relational/drivers/sqlite-wasm.js"
    },
    "./relational/cluster": { "import": "./dist/relational/extras/cluster.js" },
    "./relational/metrics": { "import": "./dist/relational/core/metrics.js" },
    "./relational/introspection": {
      "import": "./dist/relational/extras/introspection.js"
    },
    "./relational/diagnostics": {
      "import": "./dist/relational/extras/diagnostics.js"
    }
  }
}
```

- **Browser bundlers** only touch `./relational/sqlite-wasm` (no Node built-ins).
- Importing `./relational/pg` or `./relational/mysql` pulls `node:net/tls` only inside those modules.

---

# Pooling & cluster/parallel mode (transparent defaults)

**Default (`pool: 'auto'`) behavior:**

- If `sqlite-*`: **no pool** (single connection; SQLite serializes internally).
- If PG/MySQL in **single process**: `{ max: 6, min: 0, idleMs: 30_000, acquireMs: 10_000 }`.
- If **cluster/PM2/containers**: use `extras/cluster` to **distribute a target total**:

  - `poolTotalTarget` default `16`.
  - Workers count = `WEB_CONCURRENCY` || `process.env.NODE_WORKER_ID` presence || `os.cpus().length` (cap at 8).
  - `maxPerProcess = max(2, floor(poolTotalTarget / workers))`, `minPerProcess = 0`.
  - You can override via `pool: { max, min }` or `poolTotalTarget`.

**Queue fairness & backpressure:**

- FIFO waiters with per-acquire timeout.
- When a client errors/closes, pool **discards** and backfills up to `min`.

**Keepalive & survivability (PG/MySQL):**

- Enable TCP keepalive (driver-local), initial delay \~30s.
- Broken sockets → client invalid → pool discards → next acquire reconnects. No auto-retry of in-flight queries.

---

# SQLite WASM (browser) compatibility

- Users import `@raven-js/talons/relational/sqlite-wasm` and pass:

  ```js
  { driver: 'sqlite-wasm', wasm: { engine } }
  ```

  where `engine` implements:

  - `prepare(sql) → stmt`, `stmt.step() → boolean`, `stmt.get(i) → any`, `stmt.finalize()`
  - `exec(sql)` (for DDL/PRAGMA)

- Your module **adapts** this to core’s statement/stream/query.
- Same shapes & codecs; **no Node built-ins**.
- For persistence (OPFS, IDB) that’s up to the user’s chosen WASM engine; you stay agnostic.

---

# Robustness & correctness guarantees

- **Transactions**: `transaction(fn)` wraps BEGIN/COMMIT/ROLLBACK; nested calls use savepoints; any throw/abort rolls back.
- **Prepared statements**: tiny LRU (size 100 by default). Evict on error; never reuse across reconnect.
- **Cancellation**: `AbortSignal` and `timeoutMs` per call; drivers issue native cancel where available (PG), or cooperative cancel (MySQL, SQLite).
- **Errors**: normalized shape; include driver and `sqlState` where protocol provides it.
- **Security**: TLS `'require'` by default off-localhost; hostname verification; no string interpolation—parameters always use native protocols.
- **No engine one-offs**: no COPY, no LISTEN/NOTIFY, no MySQL LOCAL INFILE, no SQLite PRAGMA helpers. Keep the surface portable.

---

# Performance design (why this will feel fast)

- **Shaping**: object rows reuse a precomputed column map and a stable constructor (monomorphic); array rows are the default for bulk.
- **Parsing**: ring buffer decode; defer string creation; JSON parse opt-out; `int8`→`bigint` by default; decimals as strings (lossless).
- **Streaming**: backpressure-aware async iterator pauses socket reads while consumer works.
- **Cold start & size**: import only the driver you use; root/core are tiny.

---

# DSN & config mapping (predictable)

- **Common keys**: `host, port, user, password, database, tls, pool, timeoutMs, connectTimeoutMs, dateAsString, bigint, json`.
- **PG extras parsed from DSN**: `sslmode=require|verify-full|disable` → `tls`.
- **MySQL**: treat `ssl=true` → `tls:'require'`.
- **SQLite**:

  - Node: `sqlite:file:/path.db`, `sqlite:mem` (maps to `:memory:`).
  - WASM: `sqlite+wasm://` (the URL is nominal; actual storage handled by `engine`).

---

# File tree (concise)

```
/dist/relational/
  core/
    client.js
    statement.js
    row-shapes.js
    codecs.js
    errors.js
    cancel.js
    utils.js
    config.js
    pool.js
    metrics.js
  drivers/
    pg.js
    mysql.js
    sqlite-node.js
    sqlite-wasm.js
  extras/
    cluster.js
    diagnostics.js
    introspection.js
```

---

# Default behaviors developers expect (so they don’t think)

- Pass a **DSN**; it connects and **creates a tiny pool** automatically.
- Queries return **object rows** by default; set `{ shape:'array' }` for throughput.
- **Dates/decimals as strings** (safe); flip `dateAsString:false` to get `Date`, `bigint:'string'` if needed.
- **TLS on** in prod endpoints; off on `localhost` without extra flags.
- **Timeouts & cancel** available but not mandatory.
- **Cluster**? Works out-of-the-box with reasonable per-process pool sizing; set `RAVEN_POOL_TOTAL` to cap total connections.

---

# Minimal “how do I wire it” mental model (no code needed)

1. `connect(dsnOrConfig)` picks the driver, merges defaults, computes pool (or not), and returns a `Client`.
2. `Client.query/stream/prepare/transaction` go through the core; the **driver** only handles wire/protocol/FFI.
3. Core shapes rows, decodes with shared codecs, enforces timeouts/cancel, and wraps errors.
4. Pool (if enabled) mediates concurrent `acquire`/`release`, with idle cleanup and reconnection on failure.
5. In the browser, you import the **WASM subpath**, inject your engine, and everything else is identical.

---

## TL;DR

Implement the modules above, export them with those subpaths, and keep the defaults exactly as specified. You’ll have a **brutally lean, shared SQL client** that’s:

- zero-dep, ESM, modern-only,
- tree-shakable with clean driver boundaries,
- SQLite-WASM-ready in browsers,
- “just works” on local + RDS/Fly/etc.,
- and fast/reliable with automatic pooling and cluster-aware sizing—**without** leaking engine-specific features into the public API.

---

Perfect—here’s a clean, **class-first** skeleton you can code against. It sticks to:

- **Few JSDoc typedefs (only config objects)**
- **Classes with `#private` fields** (no `_underscored` props)
- **ESM, Node 22+, modern browsers (SQLite WASM path)**
- **Tree-shakable modules** with driver subpaths
- **Auto/transparent pooling** and cluster sizing

I’m listing **signatures only** (no bodies), grouped per file you’ll ship under `@raven-js/talons/relational/*`.

---

# core (engine-agnostic; no `node:` imports)

## `core/client.js`

```js
// JSDoc config typedefs (only for options)
/**
 * @typedef {Object} ConnectOptions
 * @property {'auto'|false|{max?:number,min?:number,idleMs?:number,acquireMs?:number}} [pool='auto']
 * @property {'object'|'array'} [shape='object']
 * @property {boolean} [dateAsString=true]
 * @property {'bigint'|'string'} [bigint='bigint']
 * @property {'parse'|'string'} [json='parse']
 * @property {number} [connectTimeoutMs=10000]
 * @property {'disable'|'require'|'verify'} [tls] // heuristics if undefined
 * @property {AbortSignal} [signal]
 */

/**
 * @typedef {Object} QueryOptions
 * @property {'object'|'array'} [shape]
 * @property {boolean} [dateAsString]
 * @property {'bigint'|'string'} [bigint]
 * @property {'parse'|'string'} [json]
 * @property {number} [timeoutMs]
 * @property {boolean} [meta=false]
 * @property {AbortSignal} [signal]
 */

/**
 * @typedef {Object} TransactionOptions
 * @property {'read committed'|'repeatable read'|'serializable'} [isolation]
 * @property {number} [timeoutMs]
 * @property {AbortSignal} [signal]
 */

export class Client {
  /** @type {import('../drivers/base.js').DriverConnection} */ #conn;
  /** @type {import('./pool.js').Pool|null} */ #pool;
  /** @type {import('./codecs.js').CodecRegistry} */ #codecs;
  /** @type {import('./row-shapes.js').RowShaperFactory} */ #shaper;
  /** @type {ConnectOptions} */ #defaults;
  /** @type {boolean} */ #closed;

  /** @param {import('./config.js').NormalizedConfig} config */
  constructor(config) {}

  /** @param {string} sql @param {any[]} [params] @param {QueryOptions} [opts] */
  async query(sql, params, opts) {}

  /** @param {string} sql @param {any[]} [params] @param {QueryOptions} [opts] @returns {AsyncIterable<any>} */
  stream(sql, params, opts) {}

  /** @param {string} sql @param {{cache?: boolean}} [opts] @returns {Promise<Statement>} */
  async prepare(sql, opts) {}

  /** @template T @param {(trx: Client)=>Promise<T>} fn @param {TransactionOptions} [opts] @returns {Promise<T>} */
  async transaction(fn, opts) {}

  /** Close client (and pool if owned). */
  async close() {}

  // internal helpers for pool integration
  /** @returns {Promise<import('../drivers/base.js').DriverConnection>} */
  async #acquire() {}
  /** @param {import('../drivers/base.js').DriverConnection} conn */
  #release(conn) {}
}

/** @param {string|import('./config.js').ConnectConfig} dsnOrConfig @param {ConnectOptions} [opts] @returns {Promise<Client>} */
export async function connect(dsnOrConfig, opts) {}
```

## `core/statement.js`

```js
export class Statement {
  /** @type {Client} */ #client;
  /** @type {string|number} */ #id;
  /** @type {readonly string[]} */ #columns;
  /** @type {boolean} */ #closed;

  /** @param {Client} client @param {string|number} id @param {string[]} columns */
  constructor(client, id, columns) {}

  /** @param {any[]} [params] @param {import('./client.js').QueryOptions} [opts] */
  async execute(params, opts) {}

  /** @param {any[]} [params] @param {import('./client.js').QueryOptions} [opts] @returns {AsyncIterable<any>} */
  stream(params, opts) {}

  async close() {}
}
```

## `core/pool.js`

```js
/**
 * @typedef {Object} PoolOptions
 * @property {number} [max=6]
 * @property {number} [min=0]
 * @property {number} [idleMs=30000]
 * @property {number} [acquireMs=10000]
 */

export class Pool {
  /** @type {PoolOptions} */ #opts;
  /** @type {Set<any>} */ #idle;
  /** @type {Set<any>} */ #borrowed;
  /** @type {Array<{resolve:Function,reject:Function,deadline:number}>} */ #queue;
  /** @type {boolean} */ #closed;
  /** @type {Function} */ #factoryCreate;
  /** @type {Function} */ #factoryDestroy;
  /** @type {NodeJS.Timeout|null} */ #reaper;

  /** @param {()=>Promise<any>} createFn @param {(res:any)=>Promise<void>} destroyFn @param {PoolOptions} [opts] */
  constructor(createFn, destroyFn, opts) {}

  /** @returns {Promise<any>} */ async acquire() {}
  /** @param {any} res */ release(res) {}
  async drain() {}
  size() {}
  idleCount() {}
  borrowedCount() {}
}
```

## `core/codecs.js`

```js
export class CodecRegistry {
  /** @type {Map<string,Function>} */ #decoders; // key by logical type name
  constructor() {}
  /** @param {string} type @param {(v:any, opts?:any)=>any} decode */
  register(type, decode) {}
  /** @param {string} type @param {any} value @param {import('./client.js').QueryOptions|undefined} opts */
  decode(type, value, opts) {}
}
```

## `core/row-shapes.js`

```js
export class RowShaperFactory {
  /** @param {string[]} columns @param {'object'|'array'} shape */
  create(columns, shape) {}
}

export class ObjectRowShaper {
  /** @type {string[]} */ #cols;
  /** @param {string[]} cols */ constructor(cols) {}
  /** @param {any[]} values @returns {Record<string,any>} */ shape(values) {}
}

export class ArrayRowShaper {
  /** @param {any[]} values @returns {any[]} */ shape(values) {}
}
```

## `core/errors.js`

```js
export class SqlError extends Error {
  /** @type {string} */ code;
  /** @type {'pg'|'mysql'|'sqlite'} */ driver;
  /** @type {string|undefined} */ sqlState;
  /** @type {string|undefined} */ detail;
  constructor(message, code, driver, sqlState, detail) {
    super(message);
  }
  /** @param {any} driverErr @param {'pg'|'mysql'|'sqlite'} driver @returns {SqlError} */
  static normalize(driverErr, driver) {}
}
```

## `core/cancel.js`

```js
export class Deadline {
  /** @type {AbortController} */ #ac;
  /** @type {number|undefined} */ #timer;
  /** @param {AbortSignal} [signal] @param {number} [timeoutMs] */
  constructor(signal, timeoutMs) {}
  /** @returns {AbortSignal} */ signal() {}
  cancel() {}
}
```

## `core/config.js`

```js
/**
 * @typedef {Object} ConnectConfig
 * @property {'pg'|'mysql'|'sqlite-node'|'sqlite-wasm'} [driver]
 * @property {string} [host]
 * @property {number} [port]
 * @property {string} [user]
 * @property {string} [password]
 * @property {string} [database]
 * @property {'disable'|'require'|'verify'} [tls]
 * @property {any} [wasm] // for sqlite-wasm: { engine: ... }
 */

/** @typedef {ConnectConfig & ConnectOptions} NormalizedConfig */

export class Config {
  /** @param {string|ConnectConfig} dsnOrConfig @param {ConnectOptions} [opts] */
  static parse(dsnOrConfig, opts) {}
  /** @param {NormalizedConfig} cfg */ static computeTLS(cfg) {}
  /** @param {NormalizedConfig} cfg */ static driverSubpath(cfg) {}
}
```

## `core/utils.js`

```js
export class LruCache {
  /** @type {number} */ #cap;
  /** @type {Map<any,any>} */ #map;
  constructor(capacity) {}
  get(k) {}
  set(k, v) {}
  delete(k) {}
  clear() {}
}

export class StableObjectFactory {
  /** @type {string[]} */ #keys;
  constructor(keys) {}
  /** @param {any[]} values */ make(values) {}
}
```

## `core/metrics.js` (optional; no-ops by default)

```js
/**
 * @typedef {Object} MetricsHooks
 * @property {(ev:{name:string,at:number,data?:any})=>void} [emit]
 */

export class Metrics {
  /** @type {MetricsHooks} */ #hooks;
  /** @param {MetricsHooks} [hooks] */ constructor(hooks) {}
  /** @param {string} name @param {any} [data] */ emit(name, data) {}
}
```

---

# drivers (one file per driver; only the Node drivers import `node:net/tls`)

## `drivers/base.js` (abstract base for “implements interface via inheritance”)

```js
export class DriverConnection {
  /** lifecycle */
  async open() {}
  async close() {}
  /** simple query path */
  /** @param {string} sql @param {any[]} params @param {import('../core/client.js').QueryOptions} opts */
  async simpleQuery(sql, params, opts) {}
  /** prepared statement lifecycle */
  /** @param {string} sql @returns {Promise<{id:string|number,columns:string[]}>} */
  async prepare(sql) {}
  /** @param {string|number} id @param {any[]} params @param {import('../core/client.js').QueryOptions} opts */
  async execPrepared(id, params, opts) {}
  /** @param {string|number} id */ async closePrepared(id) {}
  /** streaming */
  /** @returns {AsyncIterable<{columns?:string[], values:any[]}>} */
  streamQuery(sql, params, opts) {}
  /** transactions */
  async begin(isolation) {}
  async commit() {}
  async rollback() {}
}
```

## `drivers/pg.js`

```js
import { DriverConnection } from "./base.js";
export class PgDriver extends DriverConnection {
  /** @param {import('../core/config.js').NormalizedConfig} cfg @param {import('../core/codecs.js').CodecRegistry} codecs */
  constructor(cfg, codecs) {
    super();
  }
}
```

## `drivers/mysql.js`

```js
import { DriverConnection } from "./base.js";
export class MySqlDriver extends DriverConnection {
  /** @param {import('../core/config.js').NormalizedConfig} cfg @param {import('../core/codecs.js').CodecRegistry} codecs */
  constructor(cfg, codecs) {
    super();
  }
}
```

## `drivers/sqlite-node.js`

```js
import { DriverConnection } from "./base.js";
export class SqliteNodeDriver extends DriverConnection {
  /** @param {import('../core/config.js').NormalizedConfig} cfg */
  constructor(cfg) {
    super();
  }
}
```

## `drivers/sqlite-wasm.js`

```js
import { DriverConnection } from "./base.js";
/**
 * @typedef {Object} WasmOptions
 * @property {{ prepare(sql:string):any, exec(sql:string):any }} engine
 */
export class SqliteWasmDriver extends DriverConnection {
  /** @param {import('../core/config.js').NormalizedConfig & WasmOptions} cfg */
  constructor(cfg) {
    super();
  }
}
```

---

# extras (tree-shakable utilities)

## `extras/cluster.js`

```js
/**
 * @typedef {Object} ClusterSizingOptions
 * @property {number} [poolTotalTarget=16]
 * @property {number} [workers] // default: env/heuristic
 */
export class ClusterSizer {
  /** @param {ClusterSizingOptions} [opts] @returns {{maxPerProcess:number,minPerProcess:number}} */
  static derivePoolLimits(opts) {}
}
```

## `extras/introspection.js`

```js
import { Client } from "../core/client.js";
export class Introspection {
  /** @param {Client} client */ constructor(client) {
    this.client = client;
  }
  /** @param {string} sql */ async describe(sql) {}
}
```

## `extras/diagnostics.js`

```js
export class Diagnostics {
  /** @param {(msg:any)=>void} logger */ constructor(logger) {
    this.#log = logger;
  }
  /** @param {import('../core/pool.js').Pool} pool */ attachPool(pool) {}
  /** @param {import('../core/metrics.js').Metrics} metrics */ attachMetrics(
    metrics
  ) {}
}
```

---

# Root subpath exports (how this stays tree-shakeable)

- `@raven-js/talons/relational` → `core/client.js` (exports `connect`, `Client`)
- `@raven-js/talons/relational/pool` → `core/pool.js` (exports `Pool`)
- `@raven-js/talons/relational/pg` → `drivers/pg.js` (exports `PgDriver`)
- `@raven-js/talons/relational/mysql` → `drivers/mysql.js` (exports `MySqlDriver`)
- `@raven-js/talons/relational/sqlite-node` → `drivers/sqlite-node.js` (exports `SqliteNodeDriver`)
- `@raven-js/talons/relational/sqlite-wasm` → `drivers/sqlite-wasm.js` (exports `SqliteWasmDriver`)
- `@raven-js/talons/relational/cluster` → `extras/cluster.js`
- `@raven-js/talons/relational/introspection` → `extras/introspection.js`
- `@raven-js/talons/relational/diagnostics` → `extras/diagnostics.js`
- `@raven-js/talons/relational/metrics` → `core/metrics.js`

---

# How it all “clicks together”

- **`connect()`** parses DSN via `Config.parse`, decides driver subpath (`Config.driverSubpath`), instantiates the driver (`PgDriver`/`MySqlDriver`/`Sqlite*Driver`), wraps it in a **`Client`** with shared defaults and **optional `Pool`**.
- **`Client`** methods (`query`, `stream`, `prepare`, `transaction`) unify behavior: they acquire a driver connection (from pool or the single conn), set up **`Deadline`** for cancel/timeout, request rows, run them through **`CodecRegistry`** and **`RowShaperFactory`**, and return standardized results.
- **`Statement`** owns a prepared statement id + columns on the driver; it uses the same shaping/codec path as `Client`.
- **`Pool`** wraps driver connection creation/destruction with FIFO acquire + idle reaping; **`ClusterSizer`** returns `{maxPerProcess,minPerProcess}` when you want a total cap across workers.
- **Drivers** subclass **`DriverConnection`** (your “interface via inheritance”) and implement wire/FFI specifics. The core never imports `node:`—only drivers do, and only the Node ones.

This layout keeps typedefs limited to **config objects**, uses **classes with `#private`** state, and gives you a tight, modern, tree-shakable surface that maps naturally to JavaScript—ready to implement.
