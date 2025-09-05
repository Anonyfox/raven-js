/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Home page snippets for inline code
 */

import { js } from "@raven-js/beak";

export const homeHandlerSnippet = js`
  // src/pages/home/index.js
  export const handler = (ctx) => {
    const content = md\`Pure **JavaScript** content...\`;
    return ctx.html(Layout({ title: "Home", content }));
  };
`;

export const routeRegistrationSnippet = js`
  import { handler as homeHandler } from "./pages/home/index.js";
  router.get("/", homeHandler);
`;
