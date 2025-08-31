/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { isIP } from "node:net";

/**
 * @file IP address utilities with CIDR support and proxy header handling
 *
 * Zero-dependency IP address parsing and CIDR range matching using Node.js built-ins.
 * Optimized algorithms for IPv4/IPv6 address validation and subnet calculations.
 * Secure proxy header handling prevents IP spoofing vulnerabilities.
 *
 * **Dependencies**: Only Node.js built-in `net.isIP()` for validation
 * **Performance**: O(1) IP parsing, O(1) CIDR matching for IPv4, O(n) for IPv6 where n = prefix bits
 * **Security**: Validates all inputs before processing to prevent injection attacks
 * **IPv6 Support**: Full IPv6 including compressed notation and mixed IPv4/IPv6 networks
 */

/**
 * Parse CIDR notation string into validated network address and prefix length.
 *
 * @param {string} cidr - CIDR notation string (e.g., "192.168.1.0/24", "2001:db8::/32")
 * @returns {{network: string, prefix: number}|null} Parsed components or null if invalid
 *
 * @example
 * // Parse IPv4 CIDR
 * const parsed = parseCIDR('192.168.1.0/24'); // { network: '192.168.1.0', prefix: 24 }
 */
export function parseCIDR(/** @type {string} */ cidr) {
	if (typeof cidr !== "string") return null;

	const parts = cidr.split("/");
	if (parts.length !== 2) return null;

	const network = parts[0];
	const prefix = parseInt(parts[1], 10);

	// Validate IP address
	if (!isIP(network)) return null;

	// Validate prefix length
	const maxPrefix = network.includes(":") ? 128 : 32; // IPv6 vs IPv4
	if (Number.isNaN(prefix) || prefix < 0 || prefix > maxPrefix) return null;

	return { network, prefix };
}

/**
 * Check if IP address falls within specified CIDR range using optimized algorithms.
 *
 * @param {string} ip - IP address to test (IPv4 or IPv6)
 * @param {string} cidr - CIDR notation network range
 * @returns {boolean} true if IP is within CIDR range, false otherwise
 *
 * @example
 * // Check IPv4 address in CIDR range
 * const inRange = isIPInCIDR('192.168.1.100', '192.168.1.0/24'); // true
 */
export function isIPInCIDR(ip, cidr) {
	const parsed = parseCIDR(cidr);
	if (!parsed || !isIP(ip)) return false;

	const { network, prefix } = parsed;

	// Handle IPv4
	if (!ip.includes(":") && !network.includes(":")) {
		return isIPv4InCIDR(ip, network, prefix);
	}

	// Handle IPv6
	if (ip.includes(":") && network.includes(":")) {
		return isIPv6InCIDR(ip, network, prefix);
	}

	return false; // Mixed IPv4/IPv6
}

/**
 * Check if IPv4 address is within CIDR range using bitwise operations.
 * Converts addresses to 32-bit integers for efficient comparison.
 *
 * **Algorithm**: Convert IPs to integers, create subnet mask, compare network portions
 * **Performance**: O(1) - constant time regardless of prefix length
 * **Special Case**: /0 prefix matches all IPv4 addresses (0.0.0.0/0)
 * **Precision**: Uses unsigned right shift to handle JavaScript's signed integers correctly
 *
 * @param {string} ip - IPv4 address to test
 * @param {string} network - Network address from CIDR
 * @param {number} prefix - Prefix length (0-32)
 * @returns {boolean} true if IP is within IPv4 CIDR range
 */
function isIPv4InCIDR(ip, network, prefix) {
	const ipInt = ipv4ToInt(ip);
	const networkInt = ipv4ToInt(network);

	// Handle /0 case (matches all IPs)
	if (prefix === 0) return true;

	const mask = (-1 << (32 - prefix)) >>> 0; // Unsigned right shift
	return (ipInt & mask) === (networkInt & mask);
}

/**
 * Check if IPv6 address is within CIDR range using byte array comparison.
 * Expands compressed IPv6 addresses and compares byte-by-byte with masking.
 *
 * **Algorithm**: Convert to 16-byte arrays, compare full bytes + partial byte with masking
 * **Performance**: O(n) where n = prefix bits / 8 (early exit on mismatch)
 * **Expansion**: Handles :: compression and mixed case automatically
 * **Precision**: Supports bit-level precision for partial byte matching
 *
 * @param {string} ip - IPv6 address to test (may be compressed)
 * @param {string} network - Network address from CIDR
 * @param {number} prefix - Prefix length (0-128)
 * @returns {boolean} true if IP is within IPv6 CIDR range
 */
function isIPv6InCIDR(ip, network, prefix) {
	const ipBytes = ipv6ToBytes(ip);
	const networkBytes = ipv6ToBytes(network);

	const bytesToCheck = Math.floor(prefix / 8);
	const bitsInLastByte = prefix % 8;

	// Check complete bytes
	for (let i = 0; i < bytesToCheck; i++) {
		if (ipBytes[i] !== networkBytes[i]) return false;
	}

	// Check partial byte if needed
	if (bitsInLastByte > 0) {
		const mask = (0xff << (8 - bitsInLastByte)) & 0xff;
		if (
			(ipBytes[bytesToCheck] & mask) !==
			(networkBytes[bytesToCheck] & mask)
		) {
			return false;
		}
	}

	return true;
}

/**
 * Convert IPv4 address string to 32-bit unsigned integer.
 * Uses bitwise operations for efficient conversion without floating point.
 *
 * **Algorithm**: Parse octets, shift and combine using bit operations
 * **Validation**: Relies on caller's isIP() validation - assumes valid input
 * **Optimization**: Dead code eliminated (input validation) due to upstream checking
 * **Precision**: Uses unsigned right shift to handle JavaScript signed integer edge cases
 *
 * @param {string} ip - Valid IPv4 address string (pre-validated)
 * @returns {number} 32-bit unsigned integer representation
 */
function ipv4ToInt(ip) {
	const parts = ip.split(".");

	let result = 0;
	for (let i = 0; i < 4; i++) {
		const part = parseInt(parts[i], 10);
		// Note: part validation removed as unreachable - isIP() validates before this function is called
		result = (result << 8) + part;
	}

	return result >>> 0; // Convert to unsigned
}

/**
 * Convert IPv6 address string to 16-byte array via expansion and hex parsing.
 * Handles compressed notation (::) and converts to standardized byte representation.
 *
 * **Expansion**: Decompresses :: notation to full 8-group format
 * **Validation**: Relies on caller's isIP() validation - assumes valid input
 * **Output**: Fixed 16-byte Uint8Array for consistent memory layout
 * **Optimization**: Dead code eliminated (error checking) due to upstream validation
 *
 * @param {string} ip - Valid IPv6 address string (pre-validated, may be compressed)
 * @returns {Uint8Array} 16-byte array representation
 */
function ipv6ToBytes(ip) {
	// Expand compressed IPv6 addresses
	const expanded = expandIPv6(ip);

	const parts = expanded.split(":");

	const bytes = new Uint8Array(16);
	for (let i = 0; i < 8; i++) {
		const value = parseInt(parts[i], 16);
		// Note: value validation removed as unreachable - isIP() validates before this function is called
		bytes[i * 2] = (value >> 8) & 0xff;
		bytes[i * 2 + 1] = value & 0xff;
	}

	return bytes;
}

/**
 * Expand compressed IPv6 address (::) to full 8-group colon notation.
 * Calculates required zero groups and inserts them at :: position.
 *
 * **Compression Handling**: Single :: expansion, preserves existing groups
 * **Algorithm**: Count existing groups, calculate zeros needed, insert at :: position
 * **Edge Cases**: Already expanded addresses returned unchanged
 * **Output Format**: Standard 8-group colon-separated hex format
 *
 * @param {string} ip - IPv6 address with possible :: compression
 * @returns {string} Fully expanded IPv6 address (8 colon-separated groups)
 */
function expandIPv6(ip) {
	if (!ip.includes("::")) {
		// Already expanded - just return as-is, validation happens in caller
		return ip;
	}

	const parts = ip.split("::");

	const left = parts[0] ? parts[0].split(":") : [];
	const right = parts[1] ? parts[1].split(":") : [];

	const totalParts = left.length + right.length;

	const zerosNeeded = 8 - totalParts;
	const zeros = new Array(zerosNeeded).fill("0");

	const expanded = [...left, ...zeros, ...right];
	return expanded.join(":");
}

/**
 * Extract client IP address from request context with configurable proxy trust.
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context with headers
 * @param {boolean} [trustProxy=false] - Whether to trust proxy headers (SECURITY: false by default)
 * @returns {string} Client IP address or "unknown" if unavailable
 *
 * @example
 * // Extract client IP safely without trusting proxy headers
 * const ip = getClientIP(ctx, false); // Uses direct connection IP
 */
export function getClientIP(ctx, trustProxy = false) {
	if (trustProxy) {
		// Check proxy headers in order of preference
		const forwarded = ctx.requestHeaders.get("x-forwarded-for");
		if (forwarded) {
			// X-Forwarded-For can be a comma-separated list, take the first (client)
			return forwarded.split(",")[0].trim();
		}

		const realIP = ctx.requestHeaders.get("x-real-ip");
		if (realIP) return realIP.trim();
	}

	// Fallback to connection IP or unknown
	return ctx.requestHeaders.get("remote-addr") || "unknown";
}

/**
 * Determine if IP address is allowed based on whitelist/blacklist configuration.
 *
 * @param {string} ip - IP address to evaluate
 * @param {import('./config.js').IPAccessConfig} config - Access control configuration
 * @returns {boolean} true if IP should be allowed, false if blocked
 *
 * @example
 * // Check IP against whitelist configuration
 * const allowed = isIPAllowed('192.168.1.100', { mode: 'whitelist', whitelist: ['192.168.1.0/24'] });
 */
export function isIPAllowed(ip, config) {
	if (config.mode === "disabled") return true;

	// Handle exact IP matches and CIDR ranges
	const checkIPList = (/** @type {string[]} */ list) => {
		return list.some((/** @type {string} */ entry) => {
			if (entry.includes("/")) {
				return isIPInCIDR(ip, entry);
			}
			return ip === entry;
		});
	};

	if (config.mode === "whitelist") {
		return checkIPList(config.whitelist);
	}

	if (config.mode === "blacklist") {
		return !checkIPList(config.blacklist);
	}

	return true; // Default allow for unknown modes
}
