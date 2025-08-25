# Beak CSS

CSS template literals with intelligent value handling and aggressive minification.

## Performance

- **Single-pass normalization**: Pre-compiled regex patterns, O(n) processing
- **Scales excellently**: 300KB+ CSS bundles in ~7ms
- **V8 optimized**: Pre-computed constants, fast-path empty string detection
- **Memory efficient**: Minimal object allocation, inline string operations

## API

### `css`

Template literal for CSS generation with intelligent value interpolation.

```javascript
import { css } from "@raven-js/beak";

const styles = css`
  .button {
    color: ${["red", "bold"]};
    margin: ${[10, 20]}px;
  }
`;
// Returns: ".button{ color:red bold; margin:10 20px; }"

const theme = css`
  .theme {
    ${{ backgroundColor: "#007bff", fontSize: "16px" }}
  }
`;
// Returns: ".theme{ background-color:#007bff; font-size:16px; }"
```

**Value Handling:**

- **Primitives**: Direct string conversion
- **Arrays**: Space-separated flattening (recursive)
- **Objects**: CSS key-value pairs with camelCase→kebab-case conversion
- **Filters**: null/undefined values excluded

### `style`

CSS wrapped in `<style>` tags for direct HTML insertion.

```javascript
import { style } from "@raven-js/beak";

const wrapped = style`.theme {
  color: ${isDark ? "#fff" : "#000"};
}`;
// Returns: "<style>.theme{ color:#fff; }</style>"
```

**Use Cases:**

- SSR styling
- Dynamic stylesheets
- Component-scoped CSS
- Critical CSS injection

## Value Processing

### Arrays

```javascript
css`
  margin: ${[10, 20, 30]}px;
`; // "margin:10 20 30px;"
css`
  colors: ${["red", ["blue"]]};
`; // "colors:red blue;"
css`
  list: ${[null, "valid", undefined]};
`; // "list:valid;"
```

**Sparse Array Support**: Holes skipped via `in` operator optimization.

### Objects

```javascript
css`
  .btn {
    ${{
      backgroundColor: "#007bff",
      fontSize: "16px",
      WebkitTransform: "scale(1.02)",
    }}
  }
`;
// ".btn{ background-color:#007bff; font-size:16px; -webkit-transform:scale(1.02); }"
```

**camelCase Conversion**: `backgroundColor` → `background-color`
**Vendor Prefixes**: `WebkitTransform` → `-webkit-transform`

### Conditional Styling

```javascript
const isDark = true;
css`
  .theme {
    color: ${isDark ? "#fff" : "#000"};
    background: ${isDark && "#333"};
  }
`;
```

**Boolean Handling**: `false` → empty string for conditional patterns.

## Normalization

Single-line CSS output with minimal whitespace:

```javascript
css`
  .button {
    color: white;
    margin: 10px;
  }
`;
// ".button{ color:white; margin:10px; }"
```

**Processing Pipeline:**

1. Whitespace collapse to single spaces
2. Remove spaces around `:`, `;`, `{`, `}`
3. Add spaces after `;` and `}` when needed
4. Trim result

## Edge Cases

**Circular References**: Stack overflow protection via RangeError.

**Empty Values**: Template literals with null/undefined handle whitespace intelligently.

**Performance Pathological Cases**: Linear regex patterns prevent catastrophic backtracking.

## Integration Patterns

### Component Styling

```javascript
const Button = ({ variant = "primary" }) => {
  const styles = css`
    .btn-${variant} {
      ${variant === "primary" && { backgroundColor: "#007bff" }}
      ${variant === "danger" && { backgroundColor: "#dc3545" }}
    padding: 10px 20px;
    }
  `;
  return { styles, html: `<button class="btn-${variant}">Click</button>` };
};
```

### Responsive Design

```javascript
const responsive = css`
  .container {
    padding: 10px;
  }
  @media (min-width: ${768}px) {
    .container {
      padding: ${[15, 20]}px;
    }
  }
`;
```

### CSS Variables

```javascript
const theme = css`
  :root {
    ${Object.entries(colors)
      .map(([name, value]) => `--color-${name}: ${value};`)
      .join(" ")}
  }
`;
```

## Types

Full JSDoc type annotations for IDE integration. TemplateStringsArray enforcement prevents manual array construction.

---

**Surgical CSS generation. Predatory performance.**
