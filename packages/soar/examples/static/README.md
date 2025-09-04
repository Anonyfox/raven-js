# Static Site Deployment Example

This example demonstrates how to deploy a static website using **@raven-js/soar** to Cloudflare Workers.

## 🦅 What's Included

- **`index.html`** - RavenJS-themed one-page site with modern styling
- **`style.css`** - Responsive CSS with gradient themes and animations
- **`favicon.ico`** - RavenJS favicon from project media
- **`soar.config.js`** - Deployment configuration with multiple environments

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
export CF_API_TOKEN="your-cloudflare-api-token"
export CF_ACCOUNT_ID="your-cloudflare-account-id"
```

**Get your credentials:**

- API Token: https://dash.cloudflare.com/profile/api-tokens
- Account ID: https://dash.cloudflare.com/ (right sidebar)

### 2. Customize Configuration

Edit `soar.config.js` and update the `scriptName`:

```javascript
target: {
  scriptName: "my-awesome-site",  // This becomes your URL
  // ... other config
}
```

### 3. Deploy

```bash
# Plan deployment (dry-run)
npx soar plan soar.config.js

# Deploy to production
npx soar deploy soar.config.js

# Deploy to staging environment
npx soar deploy soar.config.js:staging
```

Your site will be live at: `https://my-awesome-site.{account-id}.workers.dev`

## 🎯 Features Demonstrated

- **Zero Dependencies** - Pure Node.js built-ins, no external packages
- **File Scanning** - Automatic discovery and hashing of static assets
- **MIME Detection** - Proper content types for HTML, CSS, JS, images
- **Environment Management** - Multiple deployment targets (prod/staging)
- **Validation** - Configuration and credential validation before deployment
- **Modern Deployment** - Cloudflare Workers with Static Assets API

## 📁 File Structure

```
examples/static/
├── index.html          # Main HTML page
├── style.css           # Stylesheet with RavenJS theming
├── favicon.ico         # RavenJS favicon
├── soar.config.js      # Deployment configuration
└── README.md           # This file
```

## 🔧 Configuration Options

The `soar.config.js` supports:

```javascript
export default {
  artifact: {
    type: "static",
    path: ".", // Directory to deploy
    exclude: [
      // Files to skip
      "*.log",
      "soar.config.js",
    ],
  },
  target: {
    name: "cloudflare-workers",
    scriptName: "my-site", // Required: Worker name
    accountId: process.env.CF_ACCOUNT_ID,
    apiToken: process.env.CF_API_TOKEN,
    compatibilityDate: "2024-01-01",
    dispatchNamespace: null, // Optional: custom domain
  },
};
```

## 📊 Deployment Process

1. **Validation** - Checks config and environment variables
2. **File Scanning** - Discovers all files and calculates checksums
3. **Manifest Generation** - Creates deployment manifest with metadata
4. **Upload Session** - Starts Cloudflare Workers upload session
5. **File Upload** - Uploads files in optimized batches
6. **Script Deployment** - Deploys Worker script with static asset routing
7. **Success** - Returns live URL and deployment details

## 🌐 Live Example

This example creates a beautiful, responsive one-page site featuring:

- **Modern Design** - Gradient backgrounds, glassmorphism effects
- **Responsive Layout** - Mobile-first design that works everywhere
- **RavenJS Branding** - Consistent with the toolkit's visual identity
- **Interactive Elements** - Hover effects and smooth animations
- **Console Messages** - Deployment info logged for developers

Perfect for showcasing the power and simplicity of RavenJS Soar! 🦅
