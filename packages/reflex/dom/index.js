/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { __getWriteVersion, effect, withTemplateContext } from "../index.js";

/**
 * Replace element HTML efficiently (preserves scroll if applicable).
 * @param {Element} el
 * @param {string} html
 */
function setHTML(el, html) {
	const scrollable =
		el.scrollHeight > el.clientHeight ||
		el.scrollWidth > el.clientWidth ||
		el === document.scrollingElement;

	const top = scrollable ? el.scrollTop : 0;
	const left = scrollable ? el.scrollLeft : 0;

	if (document.createRange && el.replaceChildren) {
		try {
			const range = document.createRange();
			const frag = range.createContextualFragment(html);
			el.replaceChildren(frag);
			if (scrollable) {
				el.scrollTop = top;
				el.scrollLeft = left;
			}
			return;
		} catch {}
	}
	el.innerHTML = html;
	if (scrollable) {
		el.scrollTop = top;
		el.scrollLeft = left;
	}
}

/**
 * Resolve a selector or element.
 * @param {string|Element} target
 * @returns {Element}
 */
function resolveTarget(target) {
	if (typeof target === "string") {
		const el = document.querySelector(target);
		if (!el) throw new Error(`mount(): No element for selector ${target}`);
		return el;
	}
	return /** @type {Element} */ (target);
}

/**
 * rAF-aligned update scheduling.
 * @template T
 * @param {() => T} cb
 * @returns {Promise<T>}
 */
function schedule(cb) {
	if (typeof requestAnimationFrame === "function") {
		return new Promise((res) => {
			requestAnimationFrame(() => {
				Promise.resolve().then(() => res(cb()));
			});
		});
	}
	return Promise.resolve().then(cb);
}

/**
 * Mounts a reactive template into a DOM element.
 * Accepts sync or async templates: () => string | Promise<string>
 *
 * @param {() => (string|Promise<string>)} templateFn
 * @param {string|Element} target
 * @param {{}} [_options]
 * @returns {{ unmount(): void }}
 */
export function mount(templateFn, target, /** @type {{}} */ _options = {}) {
	if (typeof window === "undefined") throw new Error("mount() is browser-only");
	const el = resolveTarget(target);

	const scope = { slots: /** @type {any[]} */ ([]), cursor: 0 };

	// --- HYDRATION AWARENESS ---
	const hydrationBaseline = __getWriteVersion(); // version before any client writes
	const hasSSRContent = el.childNodes && el.childNodes.length > 0;
	let first = !hasSSRContent; // if SSR present, we won't do a "first setHTML"
	let last = hasSSRContent ? el.innerHTML : ""; // track SSR HTML to compare against
	// ---------------------------

	let token = 0; // coalescing guard

	const dispose = effect(() => {
		const out = withTemplateContext(templateFn, scope);
		const runId = ++token;

		/** @param {string} html */
		const apply = (html) => {
			if (runId !== token) return;

			// --- SKIP INITIAL DOWNGRADE ---
			// If SSR already painted and no reactive writes occurred yet,
			// don't replace DOM with a different (usually "empty") HTML.
			if (hasSSRContent && __getWriteVersion() === hydrationBaseline) {
				// just record what the client *would* render; do not touch DOM yet
				last = String(html ?? "");
				return;
			}
			// ----------------------------------

			if (first) {
				setHTML(el, html);
				last = html;
				first = false;
			} else if (html !== last) {
				schedule(() => {
					if (runId !== token) return;
					if (html !== last) {
						setHTML(el, html);
						last = html;
					}
				});
			}
		};

		if (out && typeof (/** @type {any} */ (out).then) === "function") {
			/** @type {Promise<string>} */ (out)
				.then((s) => apply(String(s ?? "")))
				.catch((e) => console.error(e));
		} else {
			apply(String(out ?? ""));
		}
	});

	return {
		unmount() {
			dispose();
			// optional: el.innerHTML = "";
		},
	};
}
