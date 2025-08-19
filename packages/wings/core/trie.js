/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com} Trie data structure for fast route matching including wildcards and named param matches. see: https://www.enjoyalgorithms.com/blog/introduction-to-trie-data-structure - Accessing a random key in an object is roughly O(1) with a very low constant factor in JS. - class methods are more performant than object function literals and saves memory. (since they exist only once on the prototype and not on every instance) Building up the trie is roughly O(numRoutes * avgNumSegments), with special care of keeping the constant factor low (simple imperative operations, early returns, ...). Usually avgNumSegments is very low (1-3) for most routes, so this is very efficient, even though we have duplicated iterations for multiple named parameters in the same position in the sub-path. This is a trade-off for simpler code. A medium sized app might have 100 routes with ~3 segments each, and since we can exploit the low constant factor of O(1) for object key access, this is probably pretty much instant resolution, while allowing route declarations in arbitrary order.
 */
export class Trie {
	/**
	 *
	 * Unique identifier for the route, -1 (or < 0 actually) means no route.
	 * So if this is set, this is a leaf node representing a route.
	 */
	id = -1;

	/**
	 * Cache of the segment name for quicker retrieval of named parameters. this
	 * way we can avoid looking up the name in the parent Trie node (no pointer!).
	 *
	 * @type {string}
	 */
	name;

	/**
	 * Children: Normal path segments with a known string value
	 *
	 * @type {Object<string, Trie>}
	 */
	fixed = Object.create(null);

	/**
	 * Children: Dynamic path segments with a named parameter or wildcards.
	 * Their segment name actually is the name of the named parameter.
	 *
	 * V8 optimization: Object.create(null) creates cleaner object shapes
	 * without prototype pollution for faster property access.
	 *
	 * @type {Object<string, Trie>}
	 */
	dynamic = Object.create(null);

	/**
	 * Wildcard segment, only one per route segment is allowed.
	 * This is a special case of a dynamic segment, stopping further matching.
	 *
	 * @type {number}
	 */
	wildcard = -1;

	/**
	 * Create a new Trie instance.
	 * @param {string} [name] - the segment name for quicker retrieval of named parameters
	 */
	constructor(name) {
		this.name = name;
	}

	/**
	 * @param {string[]} pathSegments
	 * @param {number} id
	 * @param {number} [startIndex=0] - Index to start processing from (optimization to avoid array copying)
	 */
	register(pathSegments, id, startIndex = 0) {
		// stop recursion if there are no more path segments, this is a leaf node then
		if (startIndex >= pathSegments.length) {
			this.id = id;
			return;
		}

		// handle the next path segment
		const segment = pathSegments[startIndex];

		// handle wildcard segment - validate it's the last segment
		if (segment === "*") {
			const remainingSegments = pathSegments.length - startIndex - 1;
			if (remainingSegments > 0) {
				throw new Error("Wildcard must be the last segment in a route");
			}
			if (this.wildcard >= 0) {
				throw new Error("Only one wildcard per route segment is allowed");
			}
			this.wildcard = id;
			return;
		}

		// handle named parameter segment
		if (segment.startsWith(":") || segment.startsWith("*")) {
			const name = segment.slice(1); // empty string for wildcards suffices here
			if (!this.dynamic[name]) this.dynamic[name] = new Trie(name);
			this.dynamic[name].register(pathSegments, id, startIndex + 1);
			return;
		}

		// handle normal "static" segment
		if (!this.fixed[segment]) this.fixed[segment] = new Trie(segment);
		this.fixed[segment].register(pathSegments, id, startIndex + 1);
	}

	/**
	 * @param {string[]} remainingPathSegments
	 * @param {Object<string, string>} [params] - the collected named parameters
	 * @returns {{id: number | undefined, params: Object<string, string>}}
	 */
	match(remainingPathSegments, params = {}) {
		// stop recursion if there are no more path segments, this is a leaf node then
		if (remainingPathSegments.length === 0) {
			return { id: this.id, params };
		}

		// handle the next path segment
		const segment = remainingPathSegments[0];
		const nextSegments = remainingPathSegments.slice(1);

		// prio 1: exact match against fixed segments
		if (this.fixed[segment]) {
			return this.fixed[segment].match(nextSegments, params);
		}

		// prio 2: named parameter match - optimized for V8 inline caching
		for (const paramName in this.dynamic) {
			// V8 optimization: for...in is faster than Object.entries() array creation
			const paramTrie = this.dynamic[paramName];

			// Optimize by avoiding object spread - clone once then set property
			const newParams = Object.assign({}, params);
			newParams[paramName] = segment;

			const result = paramTrie.match(nextSegments, newParams);
			if (result.id !== undefined) {
				return result;
			}
		}

		// prio 3: handle wildcard segment if it is the last segment
		if (this.wildcard >= 0) {
			return { id: this.wildcard, params };
		}

		return { id: undefined, params };
	}
}
