## RavenJS CSS Lab – Agent Guide

### Mission

Create and iterate on Bootstrap themes locally. Produce pure CSS artifacts per theme with zero guessing.

### Ground Truth – What exists

- **Sandbox**: `examples/css-lab`
- **SCSS source**: `examples/css-lab/scss/` (original Bootstrap SCSS + themes)
- **Themes**: `examples/css-lab/scss/themes/*.scss` (e.g., `default.scss`, `experiement.scss`)
- **Dev server**: Wings-based, serves pages and dynamic CSS
- **Dynamic CSS route**: `/dev/theme/:name.css` (compiles on demand via `npx sass`)
- **Theme discovery**: Reads `scss/themes/*.scss` to list options
- **Switching**: `/?theme=<name>` or navbar dropdown
- **Build output**: `examples/css-lab/dist/<theme>.css` (one CSS file per theme)

### Do this (no guesswork)

- To run dev server (short bursts are fine):
  - From `examples/css-lab`: `npm start`
  - Open `http://localhost:3000/`
  - Switch themes via navbar or `/?theme=<name>`
  - CSS is loaded from `/dev/theme/<name>.css` (compiled in-memory, no disk output)
- To build distributable CSS files:
  - From `examples/css-lab`: `npm run build` (or `npm run build:themes`)
  - Result: `dist/<theme>.css` for every file in `scss/themes/*.scss`

### Where to edit / add themes

- Edit an existing theme: `examples/css-lab/scss/themes/default.scss`
- Add a new theme: create `examples/css-lab/scss/themes/<your-name>.scss`
  - Name must match: `/^[A-Za-z0-9_-]+$/`
  - The dev route expects `/dev/theme/<your-name>.css`

### Theme file structure (critical)

- Override Bootstrap variables FIRST.
- Then import the main Bootstrap entry LAST.
- Pattern:

```scss
// Custom overrides
$primary: #4f46e5 !default;
$secondary: #64748b !default;
$font-family-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !default;
$border-radius: 0.5rem !default;
$spacer: 1rem !default;
$spacers: (
  0: 0,
  1: $spacer * 0.25,
  2: $spacer * 0.5,
  3: $spacer,
  4: $spacer * 1.5,
  5: $spacer * 3,
) !default;

// Import Bootstrap AFTER overrides
@import "../bootstrap.scss";
```

- Using `!default` is correct here: Bootstrap also uses `!default`, so your values (set earlier) win.

### Variables to consider (high impact)

- **Colors**: `$primary`, `$secondary`, `$success`, `$danger`, `$warning`, `$info`, `$light`, `$dark`
- **Typography**: `$font-family-sans-serif`, `$font-size-base`, `$line-height-base`
- **Spacing**: `$spacer`, `$spacers` map
- **Borders**: `$border-width`, `$border-color`, `$border-radius`, `$border-radius-sm`, `$border-radius-lg`
- **Shadows**: `$box-shadow`, `$box-shadow-sm`, `$box-shadow-lg`
- Any other Bootstrap variables are available in `scss/_variables.scss` and component partials.

### Dev server behavior (important)

- Dynamic route: `/dev/theme/:name.css`
  - Compiles `scss/themes/<name>.scss` via `npx sass` each request (with in-memory caching by mtimes)
  - Headers: `Content-Type: text/css; charset=utf-8`, `Cache-Control: no-store, max-age=0`, `ETag: <hash>`
  - Invalid name → 400 CSS comment; Missing theme → 404 CSS comment
- UI:
  - Navbar lists discovered themes and updates URL
  - If `?theme` is invalid, a toast informs fallback selection

### Build (no SSG)

- We do not use Fledge for this example’s output.
- Build script: `examples/css-lab/scripts/build-themes.mjs`
  - Discovers `scss/themes/*.scss`
  - Runs `npx sass --no-source-map --style=expanded` per entry
  - Outputs to `dist/<theme>.css`
- Commands:
  - `npm run build`
  - `npm run build:themes`

### Constraints / Rules

- Zero new dependencies; use `npx sass` only.
- Do not modify Bootstrap source files in `scss/` (except adding themes in `scss/themes/`).
- Keep theme names alphanumeric with dashes/underscores.
- No changes to public APIs of RavenJS packages.
- Keep code lean, readable, and fast; prefer variable overrides over complex CSS.

### Quality bar (definition of done)

- The demo page renders with your theme without layout breakage.
- Interactive components (dropdowns, modals, tooltips, popovers, tabs, accordions) remain usable.
- Colors and spacing are coherent and readable; avoid extreme contrasts that harm UX.
- `npm run build` produces `dist/<theme>.css` with expected changes.

### Quick examples

- Switch to built-in themes:
  - `/?theme=default`
  - `/?theme=experiement`
- Create a new theme `mytheme`:
  - Add `scss/themes/mytheme.scss` using the pattern above
  - Dev: `/?theme=mytheme` (served from memory at `/dev/theme/mytheme.css`)
  - Build: `npm run build` → `dist/mytheme.css`

### Common pitfalls

- Forgetting to import `../bootstrap.scss` at the end → overrides won’t apply.
- Putting overrides after the import → Bootstrap defaults will win.
- Using an invalid theme name (fails regex) → 400 from dev route.
- Expecting HTML to link built CSS automatically → it doesn’t (by design). Dev uses dynamic CSS, build writes to `dist/` only.

### Files you may touch

- Add/edit: `examples/css-lab/scss/themes/<name>.scss`
- Optional content changes: `examples/css-lab/src/pages/index.js` (demo layout only)
- Do not touch: other RavenJS packages, Bootstrap source files, server/router internals

### Commands cheat sheet

- Dev: `npm start`
- Build: `npm run build`
- Format: `npm run format`
- Lint: `npm run lint`

Follow this guide precisely. Focus on variable overrides; avoid custom selectors unless absolutely necessary. Keep iteration tight: change variables → refresh → validate components → build CSS.
