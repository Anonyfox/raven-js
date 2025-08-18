/**
 * @fileoverview Tests for IP utility functions
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { getClientIP, isIPAllowed, isIPInCIDR, parseCIDR } from "./ip-utils.js";

describe("parseCIDR", () => {
	it("should parse valid IPv4 CIDR notation", () => {
		const result = parseCIDR("192.168.1.0/24");
		assert.deepStrictEqual(result, { network: "192.168.1.0", prefix: 24 });
	});

	it("should parse valid IPv6 CIDR notation", () => {
		const result = parseCIDR("2001:db8::/32");
		assert.deepStrictEqual(result, { network: "2001:db8::", prefix: 32 });
	});

	it("should handle /0 prefix", () => {
		const result = parseCIDR("0.0.0.0/0");
		assert.deepStrictEqual(result, { network: "0.0.0.0", prefix: 0 });
	});

	it("should handle maximum IPv4 prefix", () => {
		const result = parseCIDR("192.168.1.1/32");
		assert.deepStrictEqual(result, { network: "192.168.1.1", prefix: 32 });
	});

	it("should handle maximum IPv6 prefix", () => {
		const result = parseCIDR("::1/128");
		assert.deepStrictEqual(result, { network: "::1", prefix: 128 });
	});

	it("should return null for non-string input", () => {
		assert.strictEqual(parseCIDR(null), null);
		assert.strictEqual(parseCIDR(undefined), null);
		assert.strictEqual(parseCIDR(123), null);
		assert.strictEqual(parseCIDR({}), null);
	});

	it("should return null for malformed CIDR strings", () => {
		assert.strictEqual(parseCIDR("192.168.1.0"), null);
		assert.strictEqual(parseCIDR("192.168.1.0/"), null);
		assert.strictEqual(parseCIDR("/24"), null);
		assert.strictEqual(parseCIDR("192.168.1.0/24/8"), null);
	});

	it("should return null for invalid IP addresses", () => {
		assert.strictEqual(parseCIDR("300.168.1.0/24"), null);
		assert.strictEqual(parseCIDR("192.168.1/24"), null);
		assert.strictEqual(parseCIDR("invalid-ip/24"), null);
	});

	it("should return null for invalid prefix lengths", () => {
		assert.strictEqual(parseCIDR("192.168.1.0/33"), null);
		assert.strictEqual(parseCIDR("192.168.1.0/-1"), null);
		assert.strictEqual(parseCIDR("192.168.1.0/abc"), null);
		assert.strictEqual(parseCIDR("2001:db8::/129"), null);
		assert.strictEqual(parseCIDR("2001:db8::/-1"), null);
	});
});

describe("isIPInCIDR", () => {
	describe("IPv4", () => {
		it("should correctly identify IPs in /24 range", () => {
			assert.strictEqual(isIPInCIDR("192.168.1.1", "192.168.1.0/24"), true);
			assert.strictEqual(isIPInCIDR("192.168.1.255", "192.168.1.0/24"), true);
			assert.strictEqual(isIPInCIDR("192.168.2.1", "192.168.1.0/24"), false);
		});

		it("should correctly identify IPs in /16 range", () => {
			assert.strictEqual(isIPInCIDR("192.168.1.1", "192.168.0.0/16"), true);
			assert.strictEqual(isIPInCIDR("192.168.255.255", "192.168.0.0/16"), true);
			assert.strictEqual(isIPInCIDR("192.169.1.1", "192.168.0.0/16"), false);
		});

		it("should correctly identify IPs in /8 range", () => {
			assert.strictEqual(isIPInCIDR("10.1.2.3", "10.0.0.0/8"), true);
			assert.strictEqual(isIPInCIDR("10.255.255.255", "10.0.0.0/8"), true);
			assert.strictEqual(isIPInCIDR("11.1.2.3", "10.0.0.0/8"), false);
		});

		it("should handle /0 (all IPs)", () => {
			assert.strictEqual(isIPInCIDR("192.168.1.1", "0.0.0.0/0"), true);
			assert.strictEqual(isIPInCIDR("255.255.255.255", "0.0.0.0/0"), true);
		});

		it("should handle /32 (single IP)", () => {
			assert.strictEqual(isIPInCIDR("192.168.1.1", "192.168.1.1/32"), true);
			assert.strictEqual(isIPInCIDR("192.168.1.2", "192.168.1.1/32"), false);
		});

		it("should handle unusual prefix lengths", () => {
			// /25 means 128 addresses
			assert.strictEqual(isIPInCIDR("192.168.1.127", "192.168.1.0/25"), true);
			assert.strictEqual(isIPInCIDR("192.168.1.128", "192.168.1.0/25"), false);
		});
	});

	describe("IPv6", () => {
		it("should correctly identify IPs in IPv6 range", () => {
			assert.strictEqual(isIPInCIDR("2001:db8::1", "2001:db8::/32"), true);
			assert.strictEqual(isIPInCIDR("2001:db8:ffff::1", "2001:db8::/32"), true);
			assert.strictEqual(isIPInCIDR("2001:db9::1", "2001:db8::/32"), false);
		});

		it("should handle compressed IPv6 addresses", () => {
			assert.strictEqual(isIPInCIDR("::1", "::/0"), true);
			assert.strictEqual(isIPInCIDR("2001:db8::1", "2001:db8::/64"), true);
		});

		it("should handle /128 (single IPv6)", () => {
			assert.strictEqual(isIPInCIDR("::1", "::1/128"), true);
			assert.strictEqual(isIPInCIDR("::2", "::1/128"), false);
		});

		it("should handle partial byte matching", () => {
			// /36 means 4 complete bytes + 4 bits of the 5th byte
			assert.strictEqual(
				isIPInCIDR("2001:db8:1000::", "2001:db8:1000::/36"),
				true,
			);
			assert.strictEqual(
				isIPInCIDR("2001:db8:1f00::", "2001:db8:1000::/36"),
				true,
			);
			assert.strictEqual(
				isIPInCIDR("2001:db8:2000::", "2001:db8:1000::/36"),
				false,
			);
		});
	});

	describe("Invalid inputs", () => {
		it("should return false for invalid IP addresses", () => {
			assert.strictEqual(isIPInCIDR("invalid-ip", "192.168.1.0/24"), false);
			assert.strictEqual(isIPInCIDR("300.168.1.1", "192.168.1.0/24"), false);
		});

		it("should return false for invalid CIDR notation", () => {
			assert.strictEqual(isIPInCIDR("192.168.1.1", "invalid-cidr"), false);
			assert.strictEqual(isIPInCIDR("192.168.1.1", "192.168.1.0/33"), false);
		});

		it("should return false for mixed IPv4/IPv6", () => {
			assert.strictEqual(isIPInCIDR("192.168.1.1", "2001:db8::/32"), false);
			assert.strictEqual(isIPInCIDR("2001:db8::1", "192.168.1.0/24"), false);
		});

		it("should handle null and undefined inputs", () => {
			assert.strictEqual(isIPInCIDR(null, "192.168.1.0/24"), false);
			assert.strictEqual(isIPInCIDR("192.168.1.1", null), false);
		});
	});
});

describe("getClientIP", () => {
	const mockContext = (headers) => ({
		requestHeaders: new Map(Object.entries(headers)),
	});

	it("should return IP from x-forwarded-for when trusting proxy", () => {
		const ctx = mockContext({ "x-forwarded-for": "203.0.113.1" });
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.1");
	});

	it("should return first IP from comma-separated x-forwarded-for", () => {
		const ctx = mockContext({
			"x-forwarded-for": "203.0.113.1, 198.51.100.1, 192.168.1.1",
		});
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.1");
	});

	it("should trim whitespace from x-forwarded-for", () => {
		const ctx = mockContext({ "x-forwarded-for": "  203.0.113.1  " });
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.1");
	});

	it("should fallback to x-real-ip when x-forwarded-for is not present", () => {
		const ctx = mockContext({ "x-real-ip": "203.0.113.2" });
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.2");
	});

	it("should trim whitespace from x-real-ip", () => {
		const ctx = mockContext({ "x-real-ip": "  203.0.113.2  " });
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.2");
	});

	it("should prefer x-forwarded-for over x-real-ip", () => {
		const ctx = mockContext({
			"x-forwarded-for": "203.0.113.1",
			"x-real-ip": "203.0.113.2",
		});
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.1");
	});

	it("should fallback to remote-addr when trusting proxy but no proxy headers", () => {
		const ctx = mockContext({ "remote-addr": "203.0.113.3" });
		assert.strictEqual(getClientIP(ctx, true), "203.0.113.3");
	});

	it("should ignore proxy headers when not trusting proxy", () => {
		const ctx = mockContext({
			"x-forwarded-for": "203.0.113.1",
			"x-real-ip": "203.0.113.2",
			"remote-addr": "203.0.113.3",
		});
		assert.strictEqual(getClientIP(ctx, false), "203.0.113.3");
	});

	it("should return 'unknown' when no IP headers are present", () => {
		const ctx = mockContext({});
		assert.strictEqual(getClientIP(ctx, false), "unknown");
		assert.strictEqual(getClientIP(ctx, true), "unknown");
	});

	it("should use default trustProxy=false", () => {
		const ctx = mockContext({
			"x-forwarded-for": "203.0.113.1",
			"remote-addr": "203.0.113.3",
		});
		assert.strictEqual(getClientIP(ctx), "203.0.113.3");
	});
});

describe("isIPAllowed", () => {
	describe("disabled mode", () => {
		it("should always return true", () => {
			const config = { mode: "disabled", whitelist: [], blacklist: [] };
			assert.strictEqual(isIPAllowed("192.168.1.1", config), true);
			assert.strictEqual(isIPAllowed("invalid-ip", config), true);
		});
	});

	describe("whitelist mode", () => {
		it("should allow IPs in whitelist", () => {
			const config = {
				mode: "whitelist",
				whitelist: ["192.168.1.1", "10.0.0.0/8"],
				blacklist: [],
			};
			assert.strictEqual(isIPAllowed("192.168.1.1", config), true);
			assert.strictEqual(isIPAllowed("10.1.2.3", config), true);
		});

		it("should deny IPs not in whitelist", () => {
			const config = {
				mode: "whitelist",
				whitelist: ["192.168.1.1"],
				blacklist: [],
			};
			assert.strictEqual(isIPAllowed("192.168.1.2", config), false);
			assert.strictEqual(isIPAllowed("10.1.2.3", config), false);
		});

		it("should handle CIDR ranges in whitelist", () => {
			const config = {
				mode: "whitelist",
				whitelist: ["192.168.1.0/24"],
				blacklist: [],
			};
			assert.strictEqual(isIPAllowed("192.168.1.100", config), true);
			assert.strictEqual(isIPAllowed("192.168.2.100", config), false);
		});

		it("should return false for empty whitelist", () => {
			const config = { mode: "whitelist", whitelist: [], blacklist: [] };
			assert.strictEqual(isIPAllowed("192.168.1.1", config), false);
		});
	});

	describe("blacklist mode", () => {
		it("should deny IPs in blacklist", () => {
			const config = {
				mode: "blacklist",
				whitelist: [],
				blacklist: ["192.168.1.1", "10.0.0.0/8"],
			};
			assert.strictEqual(isIPAllowed("192.168.1.1", config), false);
			assert.strictEqual(isIPAllowed("10.1.2.3", config), false);
		});

		it("should allow IPs not in blacklist", () => {
			const config = {
				mode: "blacklist",
				whitelist: [],
				blacklist: ["192.168.1.1"],
			};
			assert.strictEqual(isIPAllowed("192.168.1.2", config), true);
			assert.strictEqual(isIPAllowed("10.1.2.3", config), true);
		});

		it("should handle CIDR ranges in blacklist", () => {
			const config = {
				mode: "blacklist",
				whitelist: [],
				blacklist: ["192.168.1.0/24"],
			};
			assert.strictEqual(isIPAllowed("192.168.1.100", config), false);
			assert.strictEqual(isIPAllowed("192.168.2.100", config), true);
		});

		it("should allow all IPs for empty blacklist", () => {
			const config = { mode: "blacklist", whitelist: [], blacklist: [] };
			assert.strictEqual(isIPAllowed("192.168.1.1", config), true);
		});
	});

	describe("unknown mode", () => {
		it("should default to allow for unknown modes", () => {
			const config = { mode: "unknown-mode", whitelist: [], blacklist: [] };
			assert.strictEqual(isIPAllowed("192.168.1.1", config), true);
		});
	});

	describe("edge cases", () => {
		it("should handle mixed exact IPs and CIDR ranges", () => {
			const config = {
				mode: "whitelist",
				whitelist: ["192.168.1.1", "10.0.0.0/8", "203.0.113.0/24"],
				blacklist: [],
			};
			assert.strictEqual(isIPAllowed("192.168.1.1", config), true); // exact match
			assert.strictEqual(isIPAllowed("10.5.10.15", config), true); // CIDR match
			assert.strictEqual(isIPAllowed("203.0.113.50", config), true); // CIDR match
			assert.strictEqual(isIPAllowed("172.16.1.1", config), false); // no match
		});

		it("should handle IPv6 addresses", () => {
			const config = {
				mode: "whitelist",
				whitelist: ["::1", "2001:db8::/32"],
				blacklist: [],
			};
			assert.strictEqual(isIPAllowed("::1", config), true);
			assert.strictEqual(isIPAllowed("2001:db8::1", config), true);
			assert.strictEqual(isIPAllowed("2001:db9::1", config), false);
		});
	});
});
