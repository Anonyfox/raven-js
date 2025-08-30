# Beak Highlight

**Zero-dependency syntax highlighting for generated code documentation.** Transform raw source code into semantically-colored HTML using Bootstrap classes for consistent theming. Built for documentation generators that need fast, reliable syntax highlighting without dependency hell or custom CSS maintenance. Returns clean HTML spans with Bootstrap color classes that inherit from user themes automatically.

**Supported languages:** HTML, CSS, JavaScript, SQL, Shell/Bash, XML, and JSON with full Bootstrap semantic mapping.

## Color Semantic Mapping

Bootstrap class assignments follow semantic consistency across all supported languages:

| Token Type                | Bootstrap Class  | Semantic Meaning         | Example                                |
| ------------------------- | ---------------- | ------------------------ | -------------------------------------- |
| **Keywords/Reserved**     | `text-primary`   | Language control flow    | `function`, `if`, `SELECT`, `<div>`    |
| **Strings/Literals**      | `text-success`   | Data literals            | `"hello"`, `'world'`, `42`             |
| **Functions/Built-ins**   | `text-info`      | Callable identifiers     | `console.log`, `getElementById`        |
| **Numbers/Constants**     | `text-warning`   | Numeric/boolean literals | `42`, `true`, `false`, `NULL`          |
| **Comments**              | `text-muted`     | Documentation/notes      | `// comment`, `/* block */`, `# shell` |
| **Operators/Punctuation** | `text-secondary` | Syntax structure         | `{}`, `()`, `;`, `+`, `-`, `=`         |
| **Identifiers/Variables** | `text-body`      | User-defined names       | `myVar`, `userName`, `customFunction`  |

## Language Implementations

### JavaScript (`js.js`)

- **Keywords:** `function`, `const`, `let`, `var`, `if`, `else`, `for`, `while`, `return`, `class`, `import`, `export`, `async`, `await`, `try`, `catch`, `finally`
- **Built-ins:** `console`, `Object`, `Array`, `Promise`, `document`, `window`, `JSON`
- **Literals:** String (`"..."`, `'...'`, `` `...` ``), numbers, booleans (`true`, `false`), `null`, `undefined`
- **Edge cases:** Template literals with interpolation, regex literals, arrow functions, destructuring

### HTML (`html.js`)

- **Keywords:** Tag names (`<div>`, `<span>`, `<html>`, `<head>`, `<body>`)
- **Built-ins:** Attribute names (`class`, `id`, `src`, `href`, `data-*`)
- **Literals:** Attribute values, text content between tags
- **Edge cases:** Self-closing tags, comments (`<!-- -->`), DOCTYPE declarations

### CSS (`css.js`)

- **Keywords:** Selectors (`.class`, `#id`, `element`, `:pseudo`, `@media`)
- **Built-ins:** Property names (`color`, `background`, `margin`, `padding`, `display`)
- **Literals:** Property values (`red`, `#fff`, `1px`, `solid`, `center`)
- **Edge cases:** CSS custom properties (`--variable`), media queries, keyframes

### SQL (`sql.js`)

- **Keywords:** `SELECT`, `FROM`, `WHERE`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`, `JOIN`, `GROUP BY`, `ORDER BY`
- **Built-ins:** Data types (`VARCHAR`, `INT`, `BOOLEAN`), functions (`COUNT`, `SUM`, `MAX`)
- **Literals:** String values, numeric values, `NULL`, `TRUE`, `FALSE`
- **Edge cases:** Quoted identifiers, nested queries, comments (`--`, `/* */`)

### Shell (`shell.js`)

- **Keywords:** Commands (`ls`, `cd`, `mkdir`, `rm`, `cp`, `mv`, `grep`, `find`, `npm`, `node`)
- **Built-ins:** Flags (`-l`, `-a`, `--help`, `--version`), operators (`|`, `>`, `>>`, `&&`, `||`)
- **Literals:** File paths, quoted strings, environment variables (`$VAR`, `${VAR}`)
- **Edge cases:** Command substitution (`` `command` ``, `$(command)`), heredoc

### XML (`xml.js`)

- **Keywords:** Tag names (`<root>`, `<element>`, `<ns:tag>`)
- **Built-ins:** Attribute names (`id`, `class`, `xmlns`, `type`, custom attributes)
- **Literals:** Attribute values (`"value"`, `'value'`), text content, CDATA sections
- **Constants:** Processing instructions (`<?xml?>`, `<?xml-stylesheet?>`), entities (`&lt;`, `&#65;`, `&custom;`)
- **Edge cases:** Namespaces, self-closing tags, mixed content, malformed XML

### JSON (`json.js`)

- **Keywords:** Object property keys (`"name"`, `"id"`, `"config"`)
- **Literals:** String values (`"hello world"`, `"path/to/file"`), arrays, objects
- **Constants:** Numbers (`42`, `3.14`, `1e10`), booleans (`true`, `false`), `null`
- **Edge cases:** Escaped strings, scientific notation, JSON5/JSONC comments (`//`, `/* */`)

## CSS Backfill Support

For environments without Bootstrap, the module provides complete CSS definitions replicating Bootstrap's default color scheme:

### Text Colors

```css
.text-primary {
  color: #0d6efd;
}
.text-secondary {
  color: #6c757d;
}
.text-success {
  color: #198754;
}
.text-info {
  color: #0dcaf0;
}
.text-warning {
  color: #ffc107;
}
.text-danger {
  color: #dc3545;
}
.text-muted {
  color: #6c757d;
}
.text-body {
  color: #212529;
}
```

### Code Widget Styling

```css
.bg-light {
  background-color: #f8f9fa;
}
.bg-dark {
  background-color: #212529;
}
.border {
  border: 1px solid #dee2e6;
}
.rounded {
  border-radius: 0.375rem;
}
.p-3 {
  padding: 1rem;
}
.font-monospace {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

Export function `getHighlightCSS()` returns complete CSS string for inline styles or style injection when Bootstrap unavailable.

---

**Mandate: 100% test coverage (lines + branches + functions).** Every tokenization pattern, edge case, and Bootstrap class mapping must be verified through comprehensive test suites. Code must be minimal, lean, and performant—targeting modern JavaScript environments with zero legacy compromises. Perfect ESM tree-shakability ensures users import only required language highlighters without dead code. Each language implementation runs independently with no shared state or cross-dependencies.
