/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file DOM utilities for browser-based reactive applications
 *
 * Isomorphic DOM mounting with automatic signal tracking.
 */

import { effect } from "../core/index.js";

/**
 * Environment detection with performance capability testing.
 * Internal implementation detail - not exposed to users.
 */
const ENV = {
	isBrowser: typeof window !== "undefined",
	isServer: typeof window === "undefined",
	capabilities: {
		cssContainment: false,
		contentVisibility: false,
		scheduler: false,
		weakRef: false,
	},

	init() {
		if (this.isBrowser) {
			// Performance feature detection
			this.capabilities = {
				cssContainment:
					typeof CSS !== "undefined" &&
					CSS.supports &&
					CSS.supports("contain", "layout"),
				contentVisibility:
					typeof CSS !== "undefined" &&
					CSS.supports &&
					CSS.supports("content-visibility", "auto"),
				scheduler: "scheduler" in globalThis,
				weakRef:
					typeof WeakRef !== "undefined" &&
					typeof FinalizationRegistry !== "undefined",
			};
		}
		return this;
	},
}.init();

/**
 * Virtual DOM element for server-side rendering.
 */
class VirtualElement {
	/**
	 * @param {string} tagName
	 */
	constructor(tagName) {
		/** @type {string} */
		this.tagName = tagName;
		/** @type {string} */
		this.innerHTML = "";
		/** @type {string} */
		this.textContent = "";
		/** @type {Object} */
		this.style = {};
		/** @type {Array<any>} */
		this.children = [];
		/** @type {any} */
		this.parentNode = null;
		/** @type {string} */
		this.id = "";
	}

	/**
	 * @param {any} child
	 */
	appendChild(child) {
		if (child.parentNode) {
			child.parentNode.removeChild(child);
		}
		this.children.push(child);
		child.parentNode = this;
		return child;
	}

	/**
	 * @param {any} child
	 */
	removeChild(child) {
		const index = this.children.indexOf(child);
		if (index > -1) {
			this.children.splice(index, 1);
			child.parentNode = null;
		}
		return child;
	}

	/**
	 * @param {string} selector
	 */
	querySelector(selector) {
		if (selector.startsWith("#")) {
			const id = selector.slice(1);
			if (this.id === id) return this;
			for (const child of this.children) {
				const found = child.querySelector?.(selector);
				if (found) return found;
			}
		}
		return null;
	}

	toHTML() {
		const tagLower = this.tagName.toLowerCase();
		let attrs = "";

		if (this.id) {
			attrs += ` id="${this.id}"`;
		}

		const styleStr = Object.entries(this.style)
			.map(([key, value]) => `${key}: ${value}`)
			.join("; ");
		if (styleStr) {
			attrs += ` style="${styleStr}"`;
		}

		return `<${tagLower}${attrs}>${this.innerHTML}</${tagLower}>`;
	}
}

/**
 * Isomorphic DOM adapter with transparent performance optimizations.
 */
class DOMAdapter {
	/**
	 * @param {string} tagName
	 */
	createElement(tagName) {
		if (ENV.isBrowser) {
			const element = document.createElement(tagName);
			this.applyPerformanceOptimizations(element);
			return element;
		}
		return new VirtualElement(tagName);
	}

	/**
	 * Apply browser performance optimizations transparently.
	 * @param {any} element
	 */
	applyPerformanceOptimizations(element) {
		if (!ENV.isBrowser) return;

		// CSS Containment for layout performance
		if (ENV.capabilities.cssContainment) {
			element.style.contain = "layout style";
		}

		// Content visibility for viewport optimization
		if (ENV.capabilities.contentVisibility) {
			element.style.contentVisibility = "auto";
		}
	}

	/**
	 * @param {any} element
	 * @param {string} html
	 */
	setInnerHTML(element, html) {
		element.innerHTML = html;
	}

	/**
	 * @param {any} target
	 * @param {any} child
	 */
	appendChild(target, child) {
		target.appendChild(child);
	}

	createDocumentFragment() {
		if (ENV.isBrowser) {
			return document.createDocumentFragment();
		}
		// Virtual fragment
		return /** @type {{ children: Array<any> }} */ ({ children: [] });
	}

	/**
	 * @param {any} element
	 */
	toHTML(element) {
		if (typeof element.toHTML === "function") {
			return element.toHTML();
		}
		return element.outerHTML || "";
	}
}

// Singleton
const domAdapter = new DOMAdapter();

/**
 * Optimized scheduling for DOM updates.
 * Uses best available scheduling API transparently.
 * @param {function(): any} callback
 * @returns {Promise<any>}
 */
function scheduleUpdate(callback) {
	if (ENV.isServer) {
		// Server: immediate execution
		return Promise.resolve().then(callback);
	}

	// Browser: use best available scheduler
	// @ts-expect-error - scheduler exists when capability is true
	if (ENV.capabilities.scheduler && globalThis.scheduler) {
		// @ts-expect-error - scheduler exists when capability is true
		return globalThis.scheduler.postTask(callback, {
			priority: "user-visible",
		});
	}

	// Fallback: requestIdleCallback
	if (typeof requestIdleCallback !== "undefined") {
		return new Promise((resolve) => {
			requestIdleCallback(() => {
				Promise.resolve(callback()).then(resolve);
			});
		});
	}

	// Final fallback: setTimeout
	return new Promise((resolve) => {
		setTimeout(() => {
			Promise.resolve(callback()).then(resolve);
		}, 0);
	});
}

/**
 * Memory manager for automatic cleanup using WeakRef when available.
 * Completely transparent to the user.
 */
class MemoryManager {
	constructor() {
		/** @type {Map<any, function>} */
		this.instances = new Map();
		/** @type {FinalizationRegistry<function>|null} */
		this.registry = null;

		// Initialize WeakRef-based cleanup if supported
		if (ENV.capabilities.weakRef) {
			this.registry = new FinalizationRegistry((cleanup) => {
				cleanup();
			});
		}
	}

	/**
	 * Track an instance for automatic cleanup.
	 * @param {any} instance
	 * @param {function} cleanup
	 */
	track(instance, cleanup) {
		this.instances.set(instance, cleanup);

		// Register for automatic cleanup if supported
		if (this.registry) {
			this.registry.register(instance, cleanup);
		}
	}

	/**
	 * Manual cleanup.
	 * @param {any} instance
	 */
	cleanup(instance) {
		const cleanup = this.instances.get(instance);
		if (cleanup) {
			cleanup();
			this.instances.delete(instance);
		}
	}
}

// Singleton memory manager
const memoryManager = new MemoryManager();

/**
 * Automatic DOM removal detector.
 * Cleans up mount instances when elements are removed from DOM.
 * Completely transparent to users - no manual unmount() needed.
 */
class AutoUnmountDetector {
	constructor() {
		/** @type {WeakMap<any, any>} */
		this.elementToInstance = new WeakMap();
		/** @type {MutationObserver|null} */
		this.observer = null;

		if (ENV.isBrowser && typeof MutationObserver !== "undefined") {
			this.observer = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const node of mutation.removedNodes) {
						this.handleRemovedNode(node);
					}
				}
			});
			// Watch entire document for removed elements
			this.observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		}
	}

	/**
	 * Track element for automatic cleanup.
	 * @param {any} element
	 * @param {any} instance
	 */
	track(element, instance) {
		this.elementToInstance.set(element, instance);
	}

	/**
	 * Handle removed DOM node and cleanup associated instances.
	 * @param {any} node
	 */
	handleRemovedNode(node) {
		// Check if this node or any child nodes have tracked instances
		const instance = this.elementToInstance.get(node);
		if (instance && typeof instance.cleanup === "function") {
			instance.cleanup();
			this.elementToInstance.delete(node);
		}

		// Check child nodes recursively
		if (node.querySelectorAll) {
			const descendants = node.querySelectorAll("*");
			for (const descendant of descendants) {
				const childInstance = this.elementToInstance.get(descendant);
				if (childInstance && typeof childInstance.cleanup === "function") {
					childInstance.cleanup();
					this.elementToInstance.delete(descendant);
				}
			}
		}
	}
}

// Singleton auto-unmount detector
const autoUnmountDetector = new AutoUnmountDetector();

/**
 * Resolve target parameter to actual element.
 * @param {string|any} target
 */
function resolveTarget(target) {
	if (typeof target === "string") {
		if (!ENV.isBrowser) {
			throw new Error(
				"CSS selectors only work in browser. Use DOM/virtual elements for isomorphic code.",
			);
		}

		const element = document.querySelector(target);
		if (!element) {
			throw new Error(`Element not found for selector: ${target}`);
		}
		return element;
	}

	return target;
}

/**
 * Create a reactive mount instance with transparent performance optimizations.
 * @param {function(): string} templateFn
 * @param {any} target
 */
function createReactiveMount(templateFn, target) {
	const element = domAdapter.createElement("div");
	let isDisposed = false;

	const mountInstance = {
		/** @type {any} */
		element,
		/** @type {function|null} */
		disposeEffect: null,

		// Internal cleanup method (automatic via DOM removal detection)
		cleanup() {
			if (isDisposed) return;
			isDisposed = true;

			if (this.disposeEffect) {
				this.disposeEffect();
				this.disposeEffect = null;
			}
		},

		// Optional manual cleanup (users don't need to call this)
		unmount() {
			this.cleanup();

			// Remove from DOM if still attached
			if (element.parentNode) {
				element.parentNode.removeChild(element);
			}
		},
	};

	// Set up reactive effect with optimized scheduling
	let isFirstRender = true;
	mountInstance.disposeEffect = effect(() => {
		if (isDisposed) return;

		const html = templateFn();

		if (isFirstRender) {
			// First render: immediate for synchronous mounting
			domAdapter.setInnerHTML(element, html);
			isFirstRender = false;
		} else {
			// Subsequent updates: use optimized scheduling
			scheduleUpdate(() => {
				if (isDisposed) return;
				domAdapter.setInnerHTML(element, html);
			});
		}
	});

	// Append to target
	if (target.appendChild) {
		domAdapter.appendChild(target, element);
	} else {
		throw new Error("Target element must support appendChild");
	}

	// Track for automatic DOM removal detection
	autoUnmountDetector.track(element, mountInstance);

	// Track for automatic memory cleanup (prevent recursion)
	memoryManager.track(mountInstance, () => {
		if (!isDisposed) {
			isDisposed = true; // Prevent recursive cleanup
			if (mountInstance.disposeEffect) {
				mountInstance.disposeEffect();
				mountInstance.disposeEffect = null;
			}
		}
	});

	return mountInstance;
}

/**
 * Mount reactive template to DOM element.
 * Signal reads inside templateFn automatically trigger DOM updates.
 *
 * @param {function(): string} templateFn - Function returning HTML string
 * @param {string|Element|any} target - CSS selector or DOM element
 * @returns {Object} Mount instance with unmount() method
 */
export const mount = (templateFn, target) => {
	if (typeof templateFn !== "function") {
		throw new Error("mount() requires a template function as first argument");
	}

	if (!target) {
		throw new Error("mount() requires a target as second argument");
	}

	const resolvedTarget = resolveTarget(target);
	return createReactiveMount(templateFn, resolvedTarget);
};
