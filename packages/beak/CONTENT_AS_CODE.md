# Content-As-Code

> Write content using JavaScript template literals instead of separate files. Everything becomes programmable text.

## What It Is

Content-As-Code means authoring HTML, CSS, SQL, Markdown, and other content types using JavaScript template literals instead of dedicated files. Instead of separate `styles.css`, `template.html`, and `queries.sql` files, you write:

```javascript
import { html, css, sql } from '@raven-js/beak';

// Content as JavaScript strings with full programming power
const styles = css`
  .button {
    color: ${theme.primary};
    padding: ${spacing.medium}px;
  }
`;

const template = html`
  <button class="button" onclick=${handleClick}>
    ${buttonText}
  </button>
`;

const query = sql`
  SELECT ${fields.join(', ')}
  FROM users
  WHERE status = ${userStatus}
`;
```

## How It Differs From Traditional Files

**Traditional approach:**

- Content lives in separate files (`.html`, `.css`, `.sql`)
- Build tools compile/process each file type differently
- Runtime loads multiple assets (HTML, CSS, JS)
- Changes require coordination across multiple files

**Content-As-Code approach:**

- Everything becomes JavaScript strings
- One build pipeline processes everything
- Single JavaScript bundle contains all content
- Changes happen in one programming environment

## Core Benefits

### 1. Unified Build Pipeline

Everything becomes JavaScript that existing bundlers already understand. No special loaders for CSS, HTML, or SQL files.

```javascript
// Before: Multiple compilation steps
// styles.css → CSS loader → bundle
// template.html → HTML loader → bundle
// component.js → JS loader → bundle

// After: Single compilation
// component.js → JS bundler → single bundle
```

### 2. Runtime Content Generation

Content creation gets full JavaScript power: conditionals, loops, functions, modules.

```javascript
// Dynamic content generation
const menuItems = ['Home', 'About', 'Contact'];

const nav = html`
  <nav>
    ${menuItems.map(item =>
      html`<a href="/${item.toLowerCase()}">${item}</a>`
    )}
  </nav>
`;

// Conditional content
const header = user.isLoggedIn ? html`
  <div>Welcome back, ${user.name}!</div>
` : html`
  <div>Please log in</div>
`;
```

### 3. Consistent Tooling Ecosystem

One debugger, profiler, linter, and test runner for all code and content.

```javascript
// Refactoring works across content types
// Rename 'userName' → 'userDisplayName' updates SQL, HTML, and JS in one go

// TypeScript catches mismatches
const user: User = { name: 'John' };
const greeting = html`<p>Hello ${user.name}</p>`; // Type-safe interpolation
```

### 4. Simplified Asset Management

No separate file watching or optimization pipelines. Everything gets:

- Tree-shaken (unused content removed)
- Code-split (content loaded on demand)
- Minified (strings compressed)
- Cached (functions memoized)

## Trade-offs

### 1. Larger Initial Bundles

Content strings increase JavaScript bundle size. For large applications, this can impact initial load time.

```javascript
// This CSS becomes part of your JS bundle
const largeStylesheet = css`
  /* 10KB of CSS rules */
`;

// Instead of separate CSS file loaded in parallel
```

### 2. Runtime Overhead

Content generation happens at runtime instead of build time. Complex templates may impact performance.

```javascript
// This runs every time the component renders
const dynamicTable = html`
  <table>
    ${data.map(row => html`<tr>${row.map(cell => html`<td>${cell}</td>`)}</tr>`)}
  </table>
`;
```

### 3. No Automatic Cross-Referencing

CSS class names in HTML templates don't automatically update corresponding CSS definitions. Both remain disconnected strings.

```javascript
// These are separate - no magic linking
const styles = css`.user-profile { color: blue; }`;
const template = html`<div class="user-profile">Profile</div>`;

// Rename 'user-profile' → 'user-card'? Manual update in both places
```

### 4. Different Mental Model

Designers and developers accustomed to separate HTML/CSS files may find the approach unfamiliar.

## When It Makes Sense

**Use Content-As-Code when:**

- Building component libraries or design systems
- Creating dynamic, data-driven user interfaces
- Runtime content generation is required
- Bundle size matters more than initial load time
- Team prefers unified JavaScript tooling

**Stick with separate files when:**

- Large static content (documentation sites, blogs)
- Designer-heavy workflows requiring visual editors
- Content rarely changes at runtime
- Initial load time is critical
- Team uses specialized tools for each content type

## Practical Examples

### Component with Scoped Styles

```javascript
import { html, css } from '@raven-js/beak';

const createButton = (text, variant = 'primary') => {
  const className = `btn btn--${variant}`;

  return {
    element: html`<button class="${className}">${text}</button>`,
    styles: css`
      .${className} {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: ${variant === 'primary' ? '#007bff' : '#6c757d'};
        color: white;
      }
    `
  };
};
```

### Dynamic SQL Generation

```javascript
import { sql } from '@raven-js/beak';

const buildUserQuery = (filters) => {
  const conditions = [];
  const params = {};

  if (filters.name) {
    conditions.push('name LIKE :name');
    params.name = `%${filters.name}%`;
  }

  if (filters.status) {
    conditions.push('status = :status');
    params.status = filters.status;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  return {
    query: sql`SELECT * FROM users ${whereClause} ORDER BY created_at DESC`,
    params
  };
};
```

### SEO-Optimized Page Generation

```javascript
import { html, openGraph } from '@raven-js/beak';

const createPage = (title, description, content) => html`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>${title}</title>
    <meta name="description" content="${description}">
    ${openGraph({ title, description, url: window.location.href })}
  </head>
  <body>
    <main>${content}</main>
  </body>
  </html>
`;
```

Content-As-Code leverages JavaScript's strengths for content generation while simplifying the build and deployment pipeline. It's not about replacing separate files—it's about choosing the right tool for each job.
