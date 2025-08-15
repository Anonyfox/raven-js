import { processJSTemplate } from "./template-processor.js";

/**
 * Creates JavaScript snippets from template literals with intelligent value interpolation.
 *
 * This function processes JavaScript template literals by:
 * - Interpolating dynamic values (strings, numbers, arrays, objects, functions)
 * - Automatically joining arrays with empty string (no separators)
 * - Filtering out null/undefined/false/empty string values (except 0)
 * - Preserving modern JavaScript syntax and features
 * - Trimming whitespace for clean output
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The processed JavaScript snippet.
 *
 * @example
 * // Basic variable interpolation
 * import { js } from '@raven-js/beak';
 *
 * const varName = 'userCount';
 * const count = 42;
 * const snippet = js`const ${varName} = ${count};`;
 * // Result: "const userCount = 42;"
 *
 * @example
 * // Modern JavaScript features
 * const config = { apiUrl: 'https://api.example.com', timeout: 5000 };
 * const handlers = ['onSuccess', 'onError'];
 * const code = js`
 *   const { apiUrl, timeout } = ${config};
 *   const [${handlers.join(', ')}] = handlers;
 *   const fetchData = async () => {
 *     const response = await fetch(apiUrl, { timeout });
 *     return response.json();
 *   };
 * `;
 *
 * @example
 * // Conditional logic and expressions
 * const isProduction = true;
 * const debugLevel = 'verbose';
 * const code = js`
 *   const config = {
 *     debug: ${isProduction ? 'false' : 'true'},
 *     logLevel: ${isProduction ? '"error"' : `"${debugLevel}"`},
 *     features: ${isProduction ? '["core"]' : '["core", "debug", "dev"]'}
 *   };
 * `;
 *
 * @example
 * // Function generation with complex logic
 * const methodName = 'validateUser';
 * const validationRules = ['required', 'email', 'minLength'];
 * const code = js`
 *   const ${methodName} = (user) => {
 *     const errors = [];
 *     ${validationRules.map(rule => `
 *       if (!${rule}Validation(user.${rule})) {
 *         errors.push('${rule} validation failed');
 *       }
 *     `).join('')}
 *     return errors.length === 0;
 *   };
 * `;
 *
 * @example
 * // Template literal expressions
 * const prefix = 'user';
 * const id = 123;
 * const code = js`
 *   const key = \`${prefix}_${id}\`;
 *   const message = \`User \${key} has been updated\`;
 * `;
 *
 * @example
 * // Array and object manipulation
 * const items = ['apple', 'banana', 'cherry'];
 * const user = { name: 'John', age: 30 };
 * const code = js`
 *   const fruits = [${items}];
 *   const { name, age } = ${user};
 *   const userInfo = \`\${name} is \${age} years old\`;
 * `;
 *
 * @example
 * // Error handling and edge cases
 * const errorHandler = 'handleError';
 * const fallback = 'defaultValue';
 * const code = js`
 *   try {
 *     const result = await riskyOperation();
 *     return result;
 *   } catch (error) {
 *     ${errorHandler}(error);
 *     return ${fallback};
 *   }
 * `;
 */
export const js = processJSTemplate;

/**
 * Creates JavaScript snippets wrapped in `<script>` tags for direct HTML insertion.
 *
 * This function combines the power of the `js()` function with automatic
 * `<script>` tag wrapping, making it perfect for:
 * - Dynamic script generation
 * - Server-side rendering
 * - Component-based JavaScript injection
 * - Inline script creation
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The JavaScript snippet wrapped in `<script>` tags.
 *
 * @example
 * // Basic script tag generation
 * import { script } from '@raven-js/beak';
 *
 * const apiKey = 'abc123';
 * const endpoint = 'https://api.example.com';
 * const scriptTag = script`
 *   window.API_CONFIG = {
 *     key: '${apiKey}',
 *     endpoint: '${endpoint}',
 *     timeout: 5000
 *   };
 * `;
 * // Result: "<script type="text/javascript">window.API_CONFIG = { key: 'abc123', endpoint: 'https://api.example.com', timeout: 5000 };</script>"
 *
 * @example
 * // Dynamic component initialization
 * const componentName = 'UserProfile';
 * const props = { userId: 123, theme: 'dark' };
 * const scriptTag = script`
 *   document.addEventListener('DOMContentLoaded', () => {
 *     const app = new ${componentName}(${JSON.stringify(props)});
 *     app.mount('#app');
 *   });
 * `;
 *
 * @example
 * // Event handler injection
 * const eventType = 'click';
 * const handlerName = 'handleUserClick';
 * const scriptTag = script`
 *   document.getElementById('user-button').addEventListener('${eventType}', ${handlerName});
 *   function ${handlerName}(event) {
 *     console.log('User clicked:', event.target.dataset.userId);
 *   }
 * `;
 *
 * @example
 * // Configuration injection
 * const config = {
 *   debug: true,
 *   features: ['auth', 'analytics'],
 *   endpoints: { api: '/api', ws: '/ws' }
 * };
 * const scriptTag = script`
 *   window.APP_CONFIG = ${JSON.stringify(config)};
 *   console.log('App initialized with config:', window.APP_CONFIG);
 * `;
 */
export const script = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript">${jsContent}</script>`;
};

/**
 * Creates JavaScript snippets wrapped in `<script>` tags with the "defer" attribute.
 *
 * This function is ideal for scripts that need to:
 * - Execute after the HTML document has been parsed
 * - Access DOM elements without blocking page rendering
 * - Load in parallel but execute in order
 * - Improve page load performance
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The JavaScript snippet wrapped in `<script>` tags with "defer" attribute.
 *
 * @example
 * // Deferred initialization script
 * import { scriptDefer } from '@raven-js/beak';
 *
 * const appName = 'MyApp';
 * const version = '1.0.0';
 * const scriptTag = scriptDefer`
 *   console.log('${appName} v${version} initializing...');
 *   const app = document.getElementById('app');
 *   if (app) {
 *     app.innerHTML = '<h1>${appName} is ready!</h1>';
 *   }
 * `;
 * // Result: "<script type="text/javascript" defer>console.log('MyApp v1.0.0 initializing...'); const app = document.getElementById('app'); if (app) { app.innerHTML = '<h1>MyApp is ready!</h1>'; }</script>"
 *
 * @example
 * // Deferred analytics setup
 * const trackingId = 'GA-123456789';
 * const scriptTag = scriptDefer`
 *   // Google Analytics initialization
 *   window.dataLayer = window.dataLayer || [];
 *   function gtag(){dataLayer.push(arguments);}
 *   gtag('js', new Date());
 *   gtag('config', '${trackingId}');
 * `;
 *
 * @example
 * // Deferred feature detection and polyfills
 * const features = ['IntersectionObserver', 'ResizeObserver'];
 * const scriptTag = scriptDefer`
 *   // Feature detection and polyfill loading
 *   ${features.map(feature => `
 *     if (!window.${feature}) {
 *       console.log('Loading polyfill for ${feature}');
 *       // Load polyfill dynamically
 *     }
 *   `).join('')}
 * `;
 *
 * @example
 * // Deferred third-party integration
 * const widgetId = 'chat-widget-123';
 * const scriptTag = scriptDefer`
 *   // Initialize chat widget after page load
 *   window.ChatWidget = {
 *     init: function() {
 *       this.widget = document.createElement('div');
 *       this.widget.id = '${widgetId}';
 *       document.body.appendChild(this.widget);
 *     }
 *   };
 *   window.ChatWidget.init();
 * `;
 */
export const scriptDefer = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript" defer>${jsContent}</script>`;
};

/**
 * Creates JavaScript snippets wrapped in `<script>` tags with the "async" attribute.
 *
 * This function is perfect for scripts that:
 * - Can execute independently without blocking
 * - Don't depend on other scripts
 * - Need to load as quickly as possible
 * - Handle analytics, tracking, or non-critical features
 *
 * @param {TemplateStringsArray} strings - The static parts of the template.
 * @param {...any} values - The interpolated values.
 * @returns {string} The JavaScript snippet wrapped in `<script>` tags with "async" attribute.
 *
 * @example
 * // Async analytics tracking
 * import { scriptAsync } from '@raven-js/beak';
 *
 * const eventName = 'page_view';
 * const userId = 'user_123';
 * const scriptTag = scriptAsync`
 *   // Fire analytics event asynchronously
 *   fetch('/analytics', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       event: '${eventName}',
 *       userId: '${userId}',
 *       timestamp: Date.now()
 *     })
 *   }).catch(console.error);
 * `;
 * // Result: "<script type="text/javascript" async>fetch('/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'page_view', userId: 'user_123', timestamp: Date.now() }) }).catch(console.error);</script>"
 *
 * @example
 * // Async performance monitoring
 * const metricName = 'page_load_time';
 * const scriptTag = scriptAsync`
 *   // Measure and report page load performance
 *   const loadTime = performance.now();
 *   navigator.sendBeacon('/metrics', JSON.stringify({
 *     metric: '${metricName}',
 *     value: loadTime,
 *     url: window.location.href
 *   }));
 * `;
 *
 * @example
 * // Async error reporting
 * const errorEndpoint = '/errors';
 * const scriptTag = scriptAsync`
 *   // Set up global error handler
 *   window.addEventListener('error', (event) => {
 *     fetch('${errorEndpoint}', {
 *       method: 'POST',
 *       body: JSON.stringify({
 *         message: event.message,
 *         filename: event.filename,
 *         lineno: event.lineno,
 *         colno: event.colno,
 *         stack: event.error?.stack
 *       })
 *     });
 *   });
 * `;
 *
 * @example
 * // Async feature flags
 * const featureFlags = { darkMode: true, newUI: false };
 * const scriptTag = scriptAsync`
 *   // Load feature flags asynchronously
 *   window.FEATURE_FLAGS = ${JSON.stringify(featureFlags)};
 *   if (window.FEATURE_FLAGS.darkMode) {
 *     document.body.classList.add('dark-mode');
 *   }
 * `;
 */
export const scriptAsync = (strings, ...values) => {
	const jsContent = js(strings, ...values);
	return `<script type="text/javascript" async>${jsContent}</script>`;
};
