# RavenJS Homepage

Official homepage for RavenJS built using the RavenJS toolkit itself.

## Development

```bash
# Start development server with auto-reload
npm start

# Build static site
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Format code
npm run format

# Lint code
npm run lint
```

## Deployment Setup

To deploy to Cloudflare Workers, you need to set up environment variables:

### 1. Get Cloudflare Credentials

- **API Token**: Get from [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
  - Required permissions: `Cloudflare Workers:Edit`, `Account:Read`, `Zone:Read`
- **Account ID**: Find in [Cloudflare Dashboard](https://dash.cloudflare.com/) (right sidebar)

### 2. Set Environment Variables

```bash
export CF_API_TOKEN="your_cloudflare_api_token_here"
export CF_ACCOUNT_ID="your_cloudflare_account_id_here"
```

### 3. Deploy

```bash
npm run deploy
```

The site will be deployed to: `https://ravenjs-homepage.{your-account}.workers.dev`

## Structure

- `src/pages/` - File-based routes
- `src/components/` - Reusable components
- `src/apps/` - Client-side JavaScript (islands)
- `public/` - Static assets
- `dist/` - Built static site output
- `raven.config.js` - Build and deployment configuration

## Features

- ✅ File-based routing via Wings
- ✅ Markdown content via Beak
- ✅ Islands hydration via Reflex
- ✅ Static site generation via Fledge
- ✅ Cloudflare Workers deployment via Soar
- ✅ Zero-config development server

Built with **RavenJS** - the swift web development toolkit.
