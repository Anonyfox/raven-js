/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { isIP } from "node:net";

/**
 *
 * Parse a CIDR notation string into network and mask
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
 * Check if an IP address is within a CIDR range
 *
 * @param {string} ip - IP address to check
 * @param {string} cidr - CIDR notation string
 * @returns {boolean} True if IP is within the CIDR range
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
 * Check if an IPv4 address is within a CIDR range
 *
 * @param {string} ip - IPv4 address
 * @param {string} network - Network address
 * @param {number} prefix - Prefix length
 * @returns {boolean} True if IP is within range
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
 * Check if an IPv6 address is within a CIDR range
 *
 * @param {string} ip - IPv6 address
 * @param {string} network - Network address
 * @param {number} prefix - Prefix length
 * @returns {boolean} True if IP is within range
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
 * Convert IPv4 address string to integer
 *
 * @param {string} ip - IPv4 address
 * @returns {number | null} Integer representation or null if invalid
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
 * Convert IPv6 address string to byte array
 *
 * @param {string} ip - IPv6 address
 * @returns {Uint8Array | null} Byte array or null if invalid
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
 * Expand compressed IPv6 address to full form
 *
 * @param {string} ip - IPv6 address (possibly compressed)
 * @returns {string | null} Expanded IPv6 address or null if invalid
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
 * Extract client IP address from context, respecting proxy headers if configured
 *
 * @param {import('../../../core/context.js').Context} ctx - Request context
 * @param {boolean} trustProxy - Whether to trust proxy headers
 * @returns {string} Client IP address
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
 * Check if an IP address is allowed based on whitelist/blacklist configuration
 *
 * @param {string} ip - IP address to check
 * @param {Object} config - IP control configuration
 * @param {string} config.mode - 'whitelist', 'blacklist', or 'disabled'
 * @param {string[]} config.whitelist - Array of allowed IPs/CIDRs
 * @param {string[]} config.blacklist - Array of blocked IPs/CIDRs
 * @returns {boolean} True if IP is allowed
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
