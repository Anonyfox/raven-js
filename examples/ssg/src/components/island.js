/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Islands helper - selective client-side hydration with loading strategies
 */

import { html } from "@raven-js/beak";

/**
 * Generate island with client-side hydration
 * @param {Function} Component - Component function reference
 * @param {Object} [props={}] - Component props
 * @param {Object} [options={}] - Island options
 * @param {'load'|'idle'|'visible'} [options.client='load'] - Loading strategy
 * @returns {string} HTML with hydration script
 */
export const island = (Component, props = {}, options = {}) => {
	const { client = "load" } = options;
	const id = `island-${Math.random().toString(36).substr(2, 9)}`;

	// Convention: /apps/${componentName}.js
	const modulePath = `/apps/${Component.name.toLowerCase()}.js`;

	// Generate loading strategy wrapper
	let scriptContent = "";

	switch (client) {
		case "idle":
			scriptContent = `(window.requestIdleCallback || setTimeout)(() => { import('${modulePath}').then(m => m.hydrate('#${id}', ${JSON.stringify(props)})).catch(console.error); });`;
			break;

		case "visible":
			scriptContent = `if ('IntersectionObserver' in window) { const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { import('${modulePath}').then(m => m.hydrate('#${id}', ${JSON.stringify(props)})).catch(console.error); observer.disconnect(); } }); observer.observe(document.getElementById('${id}')); } else { import('${modulePath}').then(m => m.hydrate('#${id}', ${JSON.stringify(props)})).catch(console.error); }`;
			break;

		default:
			scriptContent = `import('${modulePath}').then(m => m.hydrate('#${id}', ${JSON.stringify(props)})).catch(console.error);`;
			break;
	}

	return html`<div id="${id}"></div><script type="module">${scriptContent}</script>`;
};
