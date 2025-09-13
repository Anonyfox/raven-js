# CSS Lab (Bootstrap SCSS theming sandbox)

A minimal RavenJS example to iterate on theme overrides against a vendored Bootstrap SCSS seed, compile to a drop-in CSS file, and preview with Wings + Beak.

- Edit theme tokens in `scss/themes/*.scss`
- Compile with `npm run scss:build` (or watch via `npm run scss:watch`)
- Preview with `npm start`

> Note: The Bootstrap seed is not included here. Vendor your chosen version's SCSS into `scss/bootstrap.seed.scss` with MIT header intact.

## Scripts

- `npm start` – run Wings dev server for preview
- `npm run build` – generate static site to `dist/`
- `npm run scss:build` – compile `scss/themes/default.scss` → `public/styles.css`
- `npm run scss:watch` – watch and compile on change
- `npm run lint`, `npm run format` – Biome

## Structure

- `cfg/` – dev server + routes
- `src/` – Beak-driven preview pages
- `public/` – static assets and compiled CSS output target
- `scss/bootstrap.seed.scss` – vendored Bootstrap SCSS seed (immutable)
- `scss/themes/` – small, focused overrides (LLM edits target these)
