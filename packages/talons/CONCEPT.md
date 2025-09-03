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
