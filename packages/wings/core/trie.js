/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Trie data structure for route matching with support for static paths, named parameters, and wildcards.
 *
 * Provides tree-based route storage and matching with priority-ordered resolution:
 * fixed segments > named parameters > wildcards. Uses Object.create(null) for performance.
 */
/**
 * Trie data structure for route matching with support for wildcards and named parameters.
 *
 * Routes are stored as tree nodes with three types of children: fixed segments for exact matches,
 * dynamic segments for named parameters, and wildcards for catch-all patterns. Uses priority-based
 * matching with exact matches taking precedence over parameters and wildcards.
 *
 * @example
 * // Basic usage
 * const trie = new Trie();
 * trie.register(['api', 'users'], 1);
 * trie.register(['api', 'users', ':id'], 2);
 *
 * @example
 * // Route matching with parameters
 * const result = trie.match(['api', 'users', '123']);
 * // → { id: 2, params: { id: '123' } }
 */
export class Trie {
	/**
	 * Route identifier for this node (-1 indicates no route registered at this level).
	 *
	 * @type {number}
	 */
	id = -1;

	/**
	 * Segment name for this node, used for named parameter collection.
	 *
	 * @type {string|undefined}
	 */
	name;

	/**
	 * Fixed path segments for exact string matches.
	 *
	 * @type {Object<string, Trie>}
	 */
	fixed = Object.create(null);

	/**
	 * Dynamic path segments for named parameters (e.g., :id, :name).
	 *
	 * @type {Object<string, Trie>}
	 */
	dynamic = Object.create(null);

	/**
	 * Wildcard route identifier (-1 indicates no wildcard at this level).
	 *
	 * @type {number}
	 */
	wildcard = -1;

	/**
	 * Creates a new Trie node.
	 *
	 * @param {string} [name] - Segment name for this node
	 *
	 * @example
	 * // Basic trie creation
	 * const trie = new Trie();
	 *
	 * @example
	 * // Named node creation
	 * const userNode = new Trie('user');
	 */
	constructor(name) {
		this.name = name;
	}

	/**
	 * Registers a route path in the trie with the given identifier.
	 *
	 * Processes path segments recursively, creating trie nodes for each segment type.
	 * Validates wildcard placement (must be last) and uniqueness per segment.
	 *
	 * @param {string[]} pathSegments - Array of path segments to register
	 * @param {number} id - Unique identifier for this route
	 * @param {number} [startIndex=0] - Starting index for processing segments
	 *
	 * @example
	 * // Static route
	 * trie.register(['api', 'users'], 1);
	 *
	 * @example
	 * // Named parameter route
	 * trie.register(['api', 'users', ':id'], 2);
	 *
	 * @example
	 * // Wildcard route
	 * trie.register(['files', '*'], 3);
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
	 * Matches a path against registered routes using priority-based resolution.
	 *
	 * Tries exact matches first, then named parameters, then wildcards.
	 * Collects named parameter values during traversal.
	 *
	 * @param {string[]} remainingPathSegments - Path segments to match
	 * @param {Object<string, string>} [params={}] - Collected named parameters
	 * @returns {{id: number | undefined, params: Object<string, string>}} Match result
	 *
	 * @example
	 * // Exact match
	 * const result = trie.match(['api', 'users']);
	 * // → { id: 1, params: {} }
	 *
	 * @example
	 * // Parameter match
	 * const result = trie.match(['api', 'users', '123']);
	 * // → { id: 2, params: { id: '123' } }
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
			newParams[paramName] = decodeURIComponent(segment);

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
