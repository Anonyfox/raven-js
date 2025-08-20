/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Bidirectional transformation between CLI arguments and URL patterns.
 *
 * **Purpose**: Enable CLI command routing through HTTP-like URL abstractions.
 * Transform command arguments into URL paths and query parameters, allowing
 * Wings router to handle CLI commands using same patterns as web routes.
 *
 * **Key Transformations**:
 * - Positional args → URL path segments (`git commit` → `/git/commit`)
 * - Flags → query parameters (`--message "text"` → `?message=text`)
 * - Boolean flags → `true` values (`--verbose` → `?verbose=true`)
 * - Bidirectional support for URL → CLI args conversion
 *
 * **Edge Cases**: Handles flag parsing edge cases, URL encoding/decoding,
 * empty arrays, special characters in arguments. Deterministic behavior.
 */

/**
 * Transform CLI arguments into URL pattern for routing.
 *
 * **Algorithm**: Parse positional args as path segments, flags as query params.
 * Stop parsing path at first flag (`--` or `-`). Handle flag=value syntax,
 * boolean flags, and short/long flag formats.
 *
 * **Flag Parsing**:
 * - `--flag value` → `?flag=value`
 * - `--flag=value` → `?flag=value`
 * - `--flag` → `?flag=true`
 * - `-f value` → `?f=value`
 * - `-f` → `?f=true`
 *
 * **Edge Cases**: Empty arrays return "/", special chars URL-encoded,
 * handles "--" and "-" as positional args, not flags.
 *
 * @param {string[]} args - Command line arguments array
 * @returns {string} URL pattern with path and query parameters
 *
 * @example
 * ```javascript
 * ArgsToUrl(['git', 'commit', '--message', 'Initial commit', '--amend'])
 * // Returns: '/git/commit?message=Initial%20commit&amend=true'
 *
 * ArgsToUrl(['npm', 'install', 'express', '--save-dev'])
 * // Returns: '/npm/install/express?save-dev=true'
 *
 * ArgsToUrl([])
 * // Returns: '/'
 * ```
 */
export function ArgsToUrl(/** @type {string[]} */ args) {
	if (!Array.isArray(args) || args.length === 0) {
		return "/";
	}

	const pathSegments = [];
	const queryParams = new URLSearchParams();
	let i = 0;

	// Parse subcommands and positional arguments (everything before first flag)
	while (
		i < args.length &&
		(!args[i].startsWith("-") || args[i] === "-" || args[i] === "--")
	) {
		pathSegments.push(encodeURIComponent(args[i]));
		i++;
	}

	// Parse flags and their values
	while (i < args.length) {
		const arg = args[i];

		if (arg.startsWith("--")) {
			// Long flag: --flag or --flag=value
			const flagName = arg.slice(2);

			if (flagName.includes("=")) {
				// --flag=value format
				const [name, value] = flagName.split("=", 2);
				queryParams.append(name, value);
			} else {
				// Check if next argument is a value (doesn't start with -)
				if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
					queryParams.append(flagName, args[i + 1]);
					i++; // Skip the value argument
				} else {
					// Boolean flag
					queryParams.append(flagName, "true");
				}
			}
		} else if (arg.startsWith("-") && arg.length > 1) {
			// Short flag: -f or -f value
			const flagName = arg.slice(1);

			// Check if next argument is a value (doesn't start with -)
			if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
				queryParams.append(flagName, args[i + 1]);
				i++; // Skip the value argument
			} else {
				// Boolean flag
				queryParams.append(flagName, "true");
			}
		}

		i++;
	}

	// Build URL
	const path = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "/";
	const query = queryParams.toString();

	return query ? `${path}?${query}` : path;
}

/**
 * Transform URL pattern back to CLI arguments array.
 *
 * **Reverse Operation**: Convert URL paths and query params back to CLI args.
 * Path segments become positional arguments, query parameters become flags.
 *
 * **Flag Generation**:
 * - Single char keys → short flags (`?f=value` → `-f value`)
 * - Multi char keys → long flags (`?flag=value` → `--flag value`)
 * - `true` values → boolean flags (`?verbose=true` → `--verbose`)
 * - Other values → flag with value (`?msg=text` → `--msg text`)
 *
 * **Edge Cases**: Invalid URLs return empty array, URL decoding applied,
 * empty paths handled gracefully.
 *
 * @param {string} url - URL string with path and query parameters
 * @returns {string[]} CLI arguments array (positional args + flags)
 *
 * @example
 * ```javascript
 * UrlToArgs('/git/commit?message=Initial%20commit&amend=true')
 * // Returns: ['git', 'commit', '--message', 'Initial commit', '--amend']
 *
 * UrlToArgs('/npm/install/express?save-dev=true&v=true')
 * // Returns: ['npm', 'install', 'express', '--save-dev', '-v']
 *
 * UrlToArgs('/')
 * // Returns: []
 * ```
 */
export function UrlToArgs(url) {
	if (!url || typeof url !== "string") {
		return [];
	}

	const urlObj = new URL(url, "http://localhost");
	const args = [];

	// Parse path segments (subcommands and positional arguments)
	const pathSegments = urlObj.pathname
		.split("/")
		.filter((segment) => segment.length > 0)
		.map((segment) => decodeURIComponent(segment));

	args.push(...pathSegments);

	// Parse query parameters (flags)
	for (const [key, value] of urlObj.searchParams) {
		const flagPrefix = key.length === 1 ? "-" : "--";

		if (value === "true") {
			// Boolean flag
			args.push(`${flagPrefix}${key}`);
		} else {
			// Flag with value
			args.push(`${flagPrefix}${key}`, value);
		}
	}

	return args;
}
