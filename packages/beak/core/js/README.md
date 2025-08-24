# JavaScript Template Processor

JavaScript template literal processor with value filtering and array flattening.

## Install

```bash
npm install @raven-js/beak
```

## Usage

```javascript
import { js, script, scriptDefer, scriptAsync } from "@raven-js/beak";

// Basic template processing
js`const ${varName} = ${count};`; // "const userCount = 42;"
js`${[1, 2, 3]}`; // "123" (arrays flatten)
js`${null}valid${false}`; // "valid" (falsy filtered except 0)

// Script tag wrappers
script`console.log(${message});`;
// '<script type="text/javascript">console.log("hello");</script>'

scriptDefer`document.getElementById('${id}').focus();`;
// '<script type="text/javascript" defer>...</script>'

scriptAsync`fetch('/api', { data: ${payload} });`;
// '<script type="text/javascript" async>...</script>'
```

## Value Filtering

- **Included**: `0`, truthy values
- **Excluded**: `null`, `undefined`, `false`, empty string `""`

```javascript
js`${null}${0}${false}${true}${""}`; // "0true"
```

## Array Handling

Arrays flatten using `join("")`:

```javascript
js`${["a", "b", "c"]}`; // "abc"
js`${[1, [2, 3], 4]}`; // "12,34"
js`${[]}`; // ""
```

## Edge Cases

**Objects stringify as `[object Object]`:**

```javascript
js`${obj}`; // "[object Object]"
```

**Functions include full source:**

```javascript
js`${() => "test"}`; // "() => 'test'"
```

**Whitespace trimming:**

```javascript
js`  content  `; // "content"
js`content`; // "content"
```

## Script Execution Context

- `script`: Executes immediately when parsed
- `scriptDefer`: Executes after HTML parsing completes
- `scriptAsync`: Executes without blocking HTML parsing

## API

### `js(strings, ...values)`

- `strings` {TemplateStringsArray} - Static template parts
- `values` {...any} - Values to interpolate
- Returns {string} - Processed JavaScript code

### `script(strings, ...values)`

- Returns {string} - JavaScript wrapped in `<script type="text/javascript">` tags

### `scriptDefer(strings, ...values)`

- Returns {string} - JavaScript wrapped in `<script type="text/javascript" defer>` tags

### `scriptAsync(strings, ...values)`

- Returns {string} - JavaScript wrapped in `<script type="text/javascript" async>` tags

## Integration Notes

All script functions use the same value filtering and array flattening as `js()`.

For HTML injection, ensure script tag placement matches execution requirements:

- `defer` scripts execute in document order after parsing
- `async` scripts execute when downloaded, potentially out of order
