# Hello World Example

A simple example demonstrating how to use RavenJS Wings and Beak packages together.

## What it does

- Uses **Wings** dev server to serve a web application
- Uses **Beak** HTML templating to render a beautiful hello world page
- Demonstrates **Logger middleware** for request logging and performance monitoring
- Shows environment-based configuration for development vs production
- Shows the basic setup for a RavenJS application

## Running the example

```bash
# Development mode (default)
npm start

# Production mode (any of these work)
NODE_ENV=production npm start
NODE_ENV=prod npm start
NODE_ENV=live npm start
```

Then open your browser to [http://localhost:3000](http://localhost:3000)

## Code Quality

This example includes Biome for code formatting and linting:

- **Format code**: `npm run format`
- **Lint code**: `npm run lint`

## Features demonstrated

- **Wings dev server**: Hot reloading development server
- **Wings clustered server**: Production-ready server with clustering
- **Beak HTML templating**: JSX-like syntax for HTML generation
- **Logger middleware**: Request logging with performance indicators (⚡🚀🐌)
- **Environment-based configuration**: Different logger settings for dev/prod
- **Modern styling**: CSS with gradients, flexbox, and responsive design
- **Live editing**: Make changes to `src/index.js` and see them reflected immediately

## Logger Middleware

The logger is configured in `boot.js` as a runtime choice:

- **Development**: Colored terminal output with performance indicators
- **Production**: Structured JSON logging for compliance (SOC2, ISO 27001, GDPR)

## Environment Detection

The example follows community best practices for production detection:

```javascript
function isProduction() {
  const env = process.env.NODE_ENV?.toLowerCase();
  return env === "production" || env === "prod" || env === "live";
}
```

The example uses local file references to the RavenJS packages, so any changes you make to the packages will be immediately reflected in this example.
