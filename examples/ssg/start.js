/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Development server - starts Wings DevServer with auto-reload
 */

import { DevServer, Logger, Resolve } from "@raven-js/wings/server";
import { router } from "./src/router.js";

/**
 * Start development server
 */
async function startServer() {
  // Add logging middleware
  router.useEarly(new Logger());

  // Add Resolve middleware for nobuild ESM development in the browser
  router.use(new Resolve({ sourceFolder: "./src" }));

  // Create development server
  const server = new DevServer(router);

  // Start server
  const port = Number(process.env.PORT) || 3000;
  await server.listen(port);

  console.log(`🦅 RavenJS SSG development server running at: http://localhost:${port}`);
  console.log(`
📝 Content As Code:
   • Edit pages in src/pages/
   • Components in src/components/
   • Auto-reload on file changes

🚀 Ready to build:
   • npm run build (generate static site)
  `);
}

// Start server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
