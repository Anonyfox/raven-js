/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for currency extraction functionality.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { extractCurrency } from "./extract-currency.js";

describe("extractCurrency", () => {
	// APEX PREDATOR PATTERN
	describe("core functionality", () => {
		it("parses major symbols, spacing, and precision", () => {
			// USD/EUR/GBP/JPY/INR/RUB
			deepStrictEqual(extractCurrency("The price is $19.99"), ["$19.99"]);
			deepStrictEqual(extractCurrency("Costs €45.50 in Europe"), ["€45.50"]);
			deepStrictEqual(extractCurrency("UK price is £29.99"), ["£29.99"]);
			deepStrictEqual(extractCurrency("Japan price ¥1500"), ["¥1500"]);
			deepStrictEqual(extractCurrency("India price ₹999.00"), ["₹999.00"]);
			deepStrictEqual(extractCurrency("Russia price ₽2500.50"), ["₽2500.50"]);
			// multiple currencies
			deepStrictEqual(extractCurrency("Prices: $50.00, €45.50, £40.00"), [
				"$50.00",
				"€45.50",
				"£40.00",
			]);
			// optional space after symbol
			deepStrictEqual(extractCurrency("Cost is $ 19.99 and € 25.50"), [
				"$ 19.99",
				"€ 25.50",
			]);
			// whole numbers and two decimals
			deepStrictEqual(extractCurrency("Simple pricing: $100 and €200"), [
				"$100",
				"€200",
			]);
			deepStrictEqual(extractCurrency("Precise pricing: $12.34 and £56.78"), [
				"$12.34",
				"£56.78",
			]);
		});
	});

	describe("edge cases and errors", () => {
		it("handles positions, punctuation, unsupported, and empties", () => {
			// large amounts
			deepStrictEqual(extractCurrency("Expensive item costs $12345.67"), [
				"$12345.67",
			]);
			// start and end
			deepStrictEqual(extractCurrency("$99.99 is the regular price"), [
				"$99.99",
			]);
			deepStrictEqual(extractCurrency("The total comes to $149.99"), [
				"$149.99",
			]);
			// punctuation wrappers
			deepStrictEqual(extractCurrency("Pricing ($19.99) and deals [€15.50]!"), [
				"$19.99",
				"€15.50",
			]);
			// financial contexts
			deepStrictEqual(
				extractCurrency("Budget: $1000.00, Revenue: €2500.50, Profit: £750.25"),
				["$1000.00", "€2500.50", "£750.25"],
			);
			// spacing variants
			deepStrictEqual(extractCurrency("Prices: $10.00, € 15.50, £ 20.99"), [
				"$10.00",
				"€ 15.50",
				"£ 20.99",
			]);
			// symbols without amounts ignored
			deepStrictEqual(
				extractCurrency("Use $ for variables or € symbol alone"),
				[],
			);
			// unsupported symbols ignored
			deepStrictEqual(
				extractCurrency(
					"Price in Canadian C dollar 19.99 or Australian A dollar 25.00",
				),
				[],
			);
			// sentence structures
			deepStrictEqual(
				extractCurrency(
					"If you pay $50.00, you'll save versus the €60.00 option",
				),
				["$50.00", "€60.00"],
			);
			// ranges
			deepStrictEqual(extractCurrency("Range from $10.00 to $99.99"), [
				"$10.00",
				"$99.99",
			]);
			// no matches
			deepStrictEqual(extractCurrency("This text has no currency amounts"), []);
			// empty input
			deepStrictEqual(extractCurrency(""), []);
			// placeholders
			strictEqual(
				extractCurrency("Price is $19.99 and tax is $2.50", true),
				"Price is <CURRENCY> and tax is <CURRENCY>",
			);
			strictEqual(
				extractCurrency("No currency amounts here", true),
				"No currency amounts here",
			);
		});
	});

	describe("integration scenarios", () => {
		it("documents thousand separator limitation in formatted text", () => {
			// thousands separators are not handled by current regex (documented)
			const text = `
				Financial Summary:
				Revenue: $125,000.00
				Expenses: €95,000.50
				Profit: £30,000.25
			`;
			deepStrictEqual(extractCurrency(text), ["$125", "€95", "£30"]);
		});
	});
});
