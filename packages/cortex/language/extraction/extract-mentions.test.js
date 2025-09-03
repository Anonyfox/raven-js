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
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("parses mentions across forms and positions", () => {
			// single mention
			deepStrictEqual(extractMentions("Thanks @user for the help"), ["@user"]);
			// multiple mentions
			deepStrictEqual(extractMentions("CC @admin and @developer"), [
				"@admin",
				"@developer",
			]);
			// underscores
			deepStrictEqual(extractMentions("Contact @admin_user for support"), [
				"@admin_user",
			]);
			// numbers
			deepStrictEqual(extractMentions("Follow @user123 and @dev2024"), [
				"@user123",
				"@dev2024",
			]);
			// mixed
			deepStrictEqual(extractMentions("Thanks @user_123 and @admin2_test"), [
				"@user_123",
				"@admin2_test",
			]);
			// start and end of text
			deepStrictEqual(extractMentions("@user can you help with this?"), [
				"@user",
			]);
			deepStrictEqual(extractMentions("Great work @developer"), ["@developer"]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles punctuation, separators, invalids, and empties", () => {
			// punctuation
			deepStrictEqual(extractMentions("See (@admin) and check @user!"), [
				"@admin",
				"@user",
			]);
			// separators
			deepStrictEqual(extractMentions("Contact @user, @admin; or @support."), [
				"@user",
				"@admin",
				"@support",
			]);
			// just @ symbols
			deepStrictEqual(extractMentions("Email @ symbol or @ at end"), []);
			// invalid characters (regex stops at hyphen/dot)
			deepStrictEqual(extractMentions("Invalid @user-name or @user.name"), [
				"@user",
				"@user",
			]);
			// different contexts
			deepStrictEqual(
				extractMentions("Twitter: @user, Discord: @admin, GitHub: @developer"),
				["@user", "@admin", "@developer"],
			);
			// longer usernames
			deepStrictEqual(
				extractMentions("Follow @very_long_username_here for updates"),
				["@very_long_username_here"],
			);
			// consecutive mentions
			deepStrictEqual(extractMentions("@user @admin @developer"), [
				"@user",
				"@admin",
				"@developer",
			]);
			// case preserved
			deepStrictEqual(extractMentions("Contact @AdminUser and @DevTeam"), [
				"@AdminUser",
				"@DevTeam",
			]);
			// code-like context
			deepStrictEqual(
				extractMentions("git blame shows @contributor made changes"),
				["@contributor"],
			);
			// no matches
			deepStrictEqual(
				extractMentions("This text has no @ mentions at all"),
				[],
			);
			// empty input
			deepStrictEqual(extractMentions(""), []);
			// placeholders
			strictEqual(
				extractMentions("Thanks @user and @admin", true),
				"Thanks <MENTION> and <MENTION>",
			);
			strictEqual(
				extractMentions("No mentions in this text", true),
				"No mentions in this text",
			);
		});
	});

	describe("integration scenarios", () => {
		it("extracts from multiline team update", () => {
			const text = `
				Team updates:
				@developer - working on features
				@designer - creating mockups
				@manager - planning sprint
			`;
			deepStrictEqual(extractMentions(text), [
				"@developer",
				"@designer",
				"@manager",
			]);
		});
	});
});
