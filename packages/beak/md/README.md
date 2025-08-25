# Markdown Parser

Template literal function for parsing markdown into HTML. Lightweight, deterministic parser with zero dependencies.

## Usage

```javascript
import { md } from "@raven-js-beak";

// Basic markdown
const html = md`
# Welcome to RavenJS

This is **bold** and _italic_ text with \`inline code\`.

- List item 1
- List item 2
`;

// Dynamic content
const title = "API Documentation";
const items = ["Authentication", "Endpoints", "Errors"];
const html = md`
# ${title}
${items.map((item) => `- ${item}`).join("\n")}
`;
```

## Supported Features

### Block Elements

- Headings: `# H1` through `###### H6`
- Paragraphs: Plain text blocks
- Lists: Unordered (`-`, `*`) and ordered (`1.`)
- Task lists: `- [x] done`, `- [ ] todo`
- Blockquotes: `> quoted text`
- Code blocks: Fenced (\`\`\`lang) and indented (4+ spaces)
- Tables: GitHub-flavored markdown tables
- HTML blocks: Raw HTML embedding
- Horizontal rules: `---`, `***`, `___`

### Inline Elements

- Bold: `**text**`, `__text__`
- Italic: `*text*`, `_text_`
- Strikethrough: `~~text~~`
- Inline code: `` `code` ``
- Links: `[text](url)`, reference-style `[text][ref]`
- Images: `![alt](url)`
- Autolinks: `https://example.com`
- Inline HTML: `<strong>text</strong>`

## Performance

- **O(n)** parsing complexity
- **Deterministic** - identical input produces identical output
- **Memory efficient** - minimal allocation during parsing
- **Zero dependencies** - pure JavaScript implementation

## Error Handling

Parser never throws exceptions:

- Gracefully handles malformed markdown
- Falls back to plain text for unrecognized patterns
- Always produces valid HTML output
