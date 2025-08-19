/**
 * @file CLI to URL transformation utilities
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * Transform command-line arguments into URLs and vice versa.
 * Provides bidirectional conversion between CLI patterns and URL patterns.
 */

/**
 * Transforms CLI arguments into a URL-like string
 * @param {string[]} args - Array of command line arguments
 * @returns {string} URL string with path and query parameters
 *
 * @example
 * ArgsToUrl(['git', 'commit', '--message', 'Initial commit', '--amend'])
 * // Returns: '/git/commit?message=Initial%20commit&amend=true'
 *
 * @example
 * ArgsToUrl(['npm', 'install', 'express', '--save-dev', '--verbose'])
 * // Returns: '/npm/install/express?save-dev=true&verbose=true'
 */
export function ArgsToUrl(args) {
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
 * Transforms a URL string back into CLI arguments
 * @param {string} url - URL string with path and query parameters
 * @returns {string[]} Array of command line arguments
 *
 * @example
 * UrlToArgs('/git/commit?message=Initial%20commit&amend=true')
 * // Returns: ['git', 'commit', '--message', 'Initial commit', '--amend']
 *
 * @example
 * UrlToArgs('/npm/install/express?save-dev=true&verbose=true')
 * // Returns: ['npm', 'install', 'express', '--save-dev', '--verbose']
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
