# Hello World Example

A simple example demonstrating how to use RavenJS Wings and Beak packages together.

## What it does

- Uses **Wings** dev server to serve a web application
- Uses **Beak** HTML templating to render a beautiful hello world page
- Demonstrates the basic setup for a RavenJS application

## Running the example

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open your browser to [http://localhost:3000](http://localhost:3000)

## Code Quality

This example includes Biome for code formatting and linting:

- **Format code**: `npm run format`
- **Lint code**: `npm run lint`
- **Check both**: `npm run check`

## Features demonstrated

- **Wings dev server**: Hot reloading development server
- **Beak HTML templating**: JSX-like syntax for HTML generation
- **Modern styling**: CSS with gradients, flexbox, and responsive design
- **Live editing**: Make changes to `index.js` and see them reflected immediately

## Project structure

```
examples/helloworld/
├── index.js          # Main application file
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

The example uses local file references to the RavenJS packages, so any changes you make to the packages will be immediately reflected in this example.
