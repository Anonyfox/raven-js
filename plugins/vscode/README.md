# RavenJS VS Code Extension 🦅

_Soar above the complexity of modern web development with intelligent syntax highlighting for RavenJS tagged templates._

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-purple.svg)](https://marketplace.visualstudio.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## What This Extension Does

The RavenJS VS Code Extension transforms your development experience by providing intelligent syntax highlighting and IntelliSense for all RavenJS tagged template literals. No more squinting at monochrome template strings - get proper syntax highlighting for HTML, CSS, SQL, Markdown, and JavaScript within your tagged templates.

## Features

### 🎨 Intelligent Syntax Highlighting

- **HTML Templates**: Full HTML syntax highlighting with proper tag recognition
- **CSS Templates**: Complete CSS support with property and value highlighting
- **SQL Templates**: SQL syntax highlighting for database queries
- **Markdown Templates**: Markdown rendering and syntax support
- **JavaScript Templates**: Nested JavaScript with proper highlighting

### 🚀 Smart IntelliSense

- **Auto-completion**: Get suggestions for all RavenJS template functions
- **Hover Information**: Detailed descriptions when hovering over template functions
- **Snippets**: Quick templates for common RavenJS patterns

### 🔧 Seamless Integration

- **Zero Configuration**: Works out of the box with your existing JavaScript/TypeScript files
- **No Dependencies**: Lightweight extension that doesn't slow down your editor
- **Modern JavaScript**: Built for modern development environments

## Supported Template Functions

| Function      | Description                    | Example                                  |
| ------------- | ------------------------------ | ---------------------------------------- |
| `html`        | HTML template with escaping    | `html\`<div>Hello World</div>\``         |
| `safeHtml`    | HTML template without escaping | `safeHtml\`<div>${content}</div>\``      |
| `css`         | CSS template                   | `css\`.button { color: red; }\``         |
| `style`       | CSS template (alias)           | `style\`.container { padding: 1rem; }\`` |
| `md`          | Markdown template              | `md\`# Heading\n**Bold text**\``         |
| `js`          | JavaScript template            | `js\`console.log('Hello');\``            |
| `script`      | JavaScript template (alias)    | `script\`const x = 1;\``                 |
| `scriptDefer` | Deferred JavaScript            | `scriptDefer\`// Deferred execution\``   |
| `scriptAsync` | Async JavaScript               | `scriptAsync\`// Async execution\``      |
| `sql`         | SQL template                   | `sql\`SELECT \* FROM users\``            |

## Installation

### From VSIX Package

1. Download the latest `.vsix` package from the releases
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Choose the downloaded file

### From Source

```bash
# Clone the repository
git clone https://github.com/Anonyfox/raven-js.git
cd raven-js/plugins/vscode-extension

# Build the extension
npm run build

# Install the generated .vsix file in VS Code
```

## Usage

### Basic Syntax Highlighting

Simply use any RavenJS tagged template in your JavaScript files:

```javascript
import { html, css, sql } from "@raven-js/beak";

// HTML template with syntax highlighting
const page = html`
  <div class="container">
    <h1>Welcome to RavenJS</h1>
    <p>${user.name}, you're soaring above complexity!</p>
  </div>
`;

// CSS template with syntax highlighting
const styles = css`
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #2c3e50;
    font-size: 2.5rem;
  }
`;

// SQL template with syntax highlighting
const query = sql`
  SELECT u.name, u.email, p.title
  FROM users u
  JOIN posts p ON u.id = p.user_id
  WHERE u.active = true
`;
```

### Auto-completion

Type any RavenJS template function and press `` ` `` to get auto-completion:

```javascript
// Type 'html' and press ` to get:
html` $1 `;
```

### Snippets

Use the following snippets for quick template creation:

- `raven-html` → HTML template
- `raven-css` → CSS template
- `raven-md` → Markdown template
- `raven-sql` → SQL template
- `raven-js` → JavaScript template
- `raven-interp` → Template with interpolation

## Configuration

The extension works automatically with JavaScript and TypeScript files. No additional configuration required.

### Language Support

- JavaScript (`.js`, `.mjs`, `.cjs`)
- TypeScript (`.ts`, `.tsx`)
- JSX files (`.jsx`)

## Development

### Building the Extension

```bash
npm run build
```

This creates a `.vsix` package that can be installed in VS Code.

### Project Structure

```
vscode-extension/
├── extension.js              # Main extension logic
├── language-configuration.json  # Language configuration
├── syntaxes/
│   └── ravenjs.tmLanguage.json  # TextMate grammar
├── snippets/
│   └── ravenjs.code-snippets    # Code snippets
├── icon.png                  # Extension icon
└── package.json              # Extension manifest
```

## Why RavenJS?

RavenJS is built for developers who value:

- **Simplicity**: Zero dependencies, zero bloat
- **Modern JavaScript**: ESNext features without transpilation
- **Pragmatic Solutions**: Focus on what actually works
- **Developer Experience**: Tools that get out of your way

This VS Code extension embodies these principles by providing intelligent tooling that enhances your development experience without adding complexity.

## Contributing

Contributions are welcome! This extension is part of the larger RavenJS ecosystem. See the main [RavenJS repository](https://github.com/Anonyfox/raven-js) for contribution guidelines.

## License

MIT License - see the [LICENSE](../../LICENSE) file for details.

---

_Built with the wisdom of a raven - intelligent, efficient, and always ready to soar above complexity._ 🦅

---

<div align="center">

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**

</div>
