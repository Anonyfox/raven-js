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

import { effect } from "../index.js";

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

		// Include id attribute
		if (this.id) {
			attrs += ` id="${this.id}"`;
		}

		// Include style attribute
		const styleStr = Object.entries(this.style)
			.map(([key, value]) => `${key}: ${value}`)
			.join("; ");
		if (styleStr) {
			attrs += ` style="${styleStr}"`;
		}

		// Serialize children first if they exist, otherwise use innerHTML
		let content = "";
		if (this.children.length > 0) {
			content = this.children
				.map((child) =>
					typeof child.toHTML === "function" ? child.toHTML() : String(child),
				)
				.join("");
		} else if (this.innerHTML) {
			content = this.innerHTML;
		} else if (this.textContent) {
			content = this.textContent;
		}

		return `<${tagLower}${attrs}>${content}</${tagLower}>`;
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
	 * Apply narrow CSS containment optimizations to mount roots only.
	 * Users can opt-out via data-reflex-no-contain attribute.
	 * @param {any} element
	 */
	applyPerformanceOptimizations(element) {
		if (!ENV.isBrowser) return;

		// Allow opt-out via attribute
		if (element.hasAttribute?.("data-reflex-no-contain")) {
			return;
		}

		// Apply safer CSS containment (content instead of layout style)
		if (ENV.capabilities.cssContainment) {
			// Prefer contain: content (safer than layout style)
			if (CSS.supports("contain", "content")) {
				element.style.contain = "content";
			} else {
				element.style.contain = "layout style";
			}
		}
	}

	/**
	 * Fast, safe HTML replacement using modern DOM APIs when available.
	 * Preserves scroll position for scrollable elements.
	 * @param {any} element
	 * @param {string} html
	 */
	setInnerHTML(element, html) {
		if (!ENV.isBrowser) {
			element.innerHTML = html;
			return;
		}

		// Preserve scroll position for scrollable elements
		let scrollTop = 0;
		let scrollLeft = 0;
		const isScrollable =
			element.scrollHeight > element.clientHeight ||
			element.scrollWidth > element.clientWidth ||
			element === document.scrollingElement;

		if (isScrollable) {
			scrollTop = element.scrollTop;
			scrollLeft = element.scrollLeft;
		}

		// Use replaceChildren + createContextualFragment for better performance
		if (typeof element.replaceChildren === "function" && document.createRange) {
			try {
				const range = document.createRange();
				const fragment = range.createContextualFragment(html);
				element.replaceChildren(fragment);

				// Restore scroll position
				if (isScrollable) {
					element.scrollTop = scrollTop;
					element.scrollLeft = scrollLeft;
				}
				return;
			} catch (_error) {
				// Fallback if parsing fails
			}
		}

		// Fallback to innerHTML with scroll preservation
		element.innerHTML = html;
		if (isScrollable) {
			element.scrollTop = scrollTop;
			element.scrollLeft = scrollLeft;
		}
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
 * Paint-aligned scheduling for DOM updates.
 * Prioritizes visual smoothness by aligning with browser paint cycles.
 * @param {function(): any} callback
 * @returns {Promise<any>}
 */
function scheduleUpdate(callback) {
	if (ENV.isServer) {
		// Server: immediate execution
		return Promise.resolve().then(callback);
	}

	// Browser: prefer requestAnimationFrame for paint alignment
	if (typeof requestAnimationFrame !== "undefined") {
		return new Promise((resolve) => {
			requestAnimationFrame(() => {
				Promise.resolve(callback())
					.then(resolve)
					.catch(() => resolve());
			});
		});
	}

	// Fallback: microtask for immediate scheduling
	return Promise.resolve().then(callback);
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
	 * Manual cleanup with double-cleanup protection.
	 * @param {any} instance
	 */
	cleanup(instance) {
		const cleanup = this.instances.get(instance);
		if (cleanup) {
			// Check if instance has isDisposed flag and respect it
			if (instance && typeof instance === "object" && instance.isDisposed) {
				return; // Already disposed
			}

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
				// Collect removed nodes for batch processing
				/** @type {Node[]} */
				const removedNodes = [];
				for (const mutation of mutations) {
					for (const node of mutation.removedNodes) {
						removedNodes.push(node);
					}
				}

				// Defer cleanup to next microtask to avoid false positives during reparenting
				if (removedNodes.length > 0) {
					queueMicrotask(() => {
						for (const node of removedNodes) {
							this.handleRemovedNode(node);
						}
					});
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
	 * Includes isConnected check to prevent false unmounts during reparenting.
	 * @param {any} node
	 */
	handleRemovedNode(node) {
		// Skip if node is still connected (was moved, not removed)
		if (node.isConnected) {
			return;
		}

		// Check if this node has tracked instances
		const instance = this.elementToInstance.get(node);
		if (instance && typeof instance.cleanup === "function") {
			// Check isDisposed flag before cleanup
			if (!instance.isDisposed) {
				instance.cleanup();
			}
			this.elementToInstance.delete(node);
		}

		// Check child nodes recursively
		if (node.querySelectorAll) {
			const descendants = node.querySelectorAll("*");
			for (const descendant of descendants) {
				// Skip if descendant is still connected
				if (descendant.isConnected) {
					continue;
				}

				const childInstance = this.elementToInstance.get(descendant);
				if (childInstance && typeof childInstance.cleanup === "function") {
					// Check isDisposed flag before cleanup
					if (!childInstance.isDisposed) {
						childInstance.cleanup();
					}
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
	// Reuse target as mount element if it's empty, otherwise create wrapper
	let element;
	let isTargetReused = false;

	// Check if target is empty (no children)
	const isEmpty = !target.children || target.children.length === 0;

	if (isEmpty) {
		// Target is empty: use it directly (no extra wrapper)
		element = target;
		isTargetReused = true;
		if (ENV.isBrowser) {
			domAdapter.applyPerformanceOptimizations(element);
		}
	} else {
		// Target has children: create wrapper to avoid conflicts
		element = domAdapter.createElement("div");
		isTargetReused = false;
	}

	// Per-mount coalescing state
	let pendingToken = 0;
	let lastHtml = "";

	const mountInstance = {
		/** @type {any} */
		element,
		/** @type {function|null} */
		disposeEffect: null,
		/** @type {boolean} */
		isTargetReused,
		/** @type {boolean} */
		isDisposed: false,

		// Internal cleanup method (automatic via DOM removal detection)
		cleanup() {
			if (this.isDisposed) return;
			this.isDisposed = true;

			if (this.disposeEffect) {
				this.disposeEffect();
				this.disposeEffect = null;
			}
		},

		// Optional manual cleanup (users don't need to call this)
		unmount() {
			this.cleanup();

			// Only remove from DOM if we created a wrapper (not reusing target)
			if (!isTargetReused && element.parentNode) {
				element.parentNode.removeChild(element);
			} else if (isTargetReused) {
				// Clear content of reused target
				element.innerHTML = "";
			}
		},
	};

	// Set up reactive effect with optimized scheduling and coalescing
	let isFirstRender = true;
	mountInstance.disposeEffect = effect(() => {
		if (mountInstance.isDisposed) return;

		const html = templateFn();

		// Skip if HTML hasn't changed (identity check)
		if (!isFirstRender && html === lastHtml) {
			return;
		}

		if (isFirstRender) {
			// First render: immediate for synchronous mounting
			domAdapter.setInnerHTML(element, html);
			lastHtml = html;
			isFirstRender = false;
		} else {
			// Subsequent updates: use coalesced scheduling
			const currentToken = ++pendingToken;

			scheduleUpdate(() => {
				// Bail if this update was superseded by a newer one
				if (currentToken !== pendingToken || mountInstance.isDisposed) {
					return;
				}

				// Skip if HTML is now identical (could have changed since effect ran)
				if (html === lastHtml) {
					return;
				}

				domAdapter.setInnerHTML(element, html);
				lastHtml = html;
			});
		}
	});

	// Append to target only if we created a wrapper (not reusing target)
	if (!isTargetReused) {
		if (target.appendChild) {
			domAdapter.appendChild(target, element);
		} else {
			throw new Error("Target element must support appendChild");
		}
	}

	// Track for automatic DOM removal detection
	autoUnmountDetector.track(element, mountInstance);

	// Track for automatic memory cleanup with double-cleanup protection
	memoryManager.track(mountInstance, () => {
		if (!mountInstance.isDisposed) {
			mountInstance.cleanup();
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
