/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for social media mention extraction functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { extractMentions } from "./extract-mentions.js";

describe("extractMentions", () => {
	it("extracts basic mentions", () => {
		const text = "Thanks @user for the help";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user"]);
	});

	it("extracts multiple mentions", () => {
		const text = "CC @admin and @developer";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@admin", "@developer"]);
	});

	it("extracts mentions with underscores", () => {
		const text = "Contact @admin_user for support";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@admin_user"]);
	});

	it("extracts mentions with numbers", () => {
		const text = "Follow @user123 and @dev2024";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user123", "@dev2024"]);
	});

	it("extracts mentions with mixed alphanumeric and underscores", () => {
		const text = "Thanks @user_123 and @admin2_test";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user_123", "@admin2_test"]);
	});

	it("handles mentions at start of text", () => {
		const text = "@user can you help with this?";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user"]);
	});

	it("handles mentions at end of text", () => {
		const text = "Great work @developer";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@developer"]);
	});

	it("handles mentions surrounded by punctuation", () => {
		const text = "See (@admin) and check @user!";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@admin", "@user"]);
	});

	it("handles mentions with various separators", () => {
		const text = "Contact @user, @admin; or @support.";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user", "@admin", "@support"]);
	});

	it("ignores @ symbols without usernames", () => {
		const text = "Email @ symbol or @ at end";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, []);
	});

	it("ignores @ symbols with special characters", () => {
		const text = "Invalid @user-name or @user.name";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user", "@user"]);
	});

	it("handles mentions in different contexts", () => {
		const text = "Twitter: @user, Discord: @admin, GitHub: @developer";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user", "@admin", "@developer"]);
	});

	it("extracts mentions from longer usernames", () => {
		const text = "Follow @very_long_username_here for updates";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@very_long_username_here"]);
	});

	it("handles consecutive mentions", () => {
		const text = "@user @admin @developer";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@user", "@admin", "@developer"]);
	});

	it("preserves case in mentions", () => {
		const text = "Contact @AdminUser and @DevTeam";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@AdminUser", "@DevTeam"]);
	});

	it("handles mentions in code-like contexts", () => {
		const text = "git blame shows @contributor made changes";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@contributor"]);
	});

	it("returns empty array for text without mentions", () => {
		const text = "This text has no @ mentions at all";
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, []);
	});

	it("handles empty string", () => {
		const mentions = extractMentions("");
		deepStrictEqual(mentions, []);
	});

	it("replaces mentions with placeholders when requested", () => {
		const text = "Thanks @user and @admin";
		const result = extractMentions(text, true);
		strictEqual(result, "Thanks <MENTION> and <MENTION>");
	});

	it("handles placeholder replacement with no mentions", () => {
		const text = "No mentions in this text";
		const result = extractMentions(text, true);
		strictEqual(result, text);
	});

	it("handles mentions in multiline text", () => {
		const text = `
			Team updates:
			@developer - working on features
			@designer - creating mockups
			@manager - planning sprint
		`;
		const mentions = extractMentions(text);
		deepStrictEqual(mentions, ["@developer", "@designer", "@manager"]);
	});
});
