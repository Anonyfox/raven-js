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
	it("extracts USD amounts", () => {
		const text = "The price is $19.99";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$19.99"]);
	});

	it("extracts EUR amounts", () => {
		const text = "Costs €45.50 in Europe";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["€45.50"]);
	});

	it("extracts GBP amounts", () => {
		const text = "UK price is £29.99";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["£29.99"]);
	});

	it("extracts JPY amounts", () => {
		const text = "Japan price ¥1500";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["¥1500"]);
	});

	it("extracts INR amounts", () => {
		const text = "India price ₹999.00";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["₹999.00"]);
	});

	it("extracts RUB amounts", () => {
		const text = "Russia price ₽2500.50";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["₽2500.50"]);
	});

	it("extracts multiple currency amounts", () => {
		const text = "Prices: $50.00, €45.50, £40.00";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$50.00", "€45.50", "£40.00"]);
	});

	it("extracts amounts with spaces after symbol", () => {
		const text = "Cost is $ 19.99 and € 25.50";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$ 19.99", "€ 25.50"]);
	});

	it("extracts whole number amounts", () => {
		const text = "Simple pricing: $100 and €200";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$100", "€200"]);
	});

	it("extracts amounts with two decimal places", () => {
		const text = "Precise pricing: $12.34 and £56.78";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$12.34", "£56.78"]);
	});

	it("handles large amounts", () => {
		const text = "Expensive item costs $12345.67";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$12345.67"]);
	});

	it("handles amounts at start of text", () => {
		const text = "$99.99 is the regular price";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$99.99"]);
	});

	it("handles amounts at end of text", () => {
		const text = "The total comes to $149.99";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$149.99"]);
	});

	it("handles amounts surrounded by punctuation", () => {
		const text = "Pricing ($19.99) and deals [€15.50]!";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$19.99", "€15.50"]);
	});

	it("handles amounts in financial contexts", () => {
		const text = "Budget: $1000.00, Revenue: €2500.50, Profit: £750.25";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$1000.00", "€2500.50", "£750.25"]);
	});

	it("handles amounts with various spacing", () => {
		const text = "Prices: $10.00, € 15.50, £ 20.99";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$10.00", "€ 15.50", "£ 20.99"]);
	});

	it("ignores currency symbols without amounts", () => {
		const text = "Use $ for variables or € symbol alone";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, []);
	});

	it("ignores unsupported currency symbols", () => {
		const text =
			"Price in Canadian C dollar 19.99 or Australian A dollar 25.00";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, []);
	});

	it("handles amounts in different sentence structures", () => {
		const text = "If you pay $50.00, you'll save versus the €60.00 option";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$50.00", "€60.00"]);
	});

	it("extracts amounts in price ranges", () => {
		const text = "Range from $10.00 to $99.99";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$10.00", "$99.99"]);
	});

	it("returns empty array for text without currency", () => {
		const text = "This text has no currency amounts";
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, []);
	});

	it("handles empty string", () => {
		const amounts = extractCurrency("");
		deepStrictEqual(amounts, []);
	});

	it("replaces currency with placeholders when requested", () => {
		const text = "Price is $19.99 and tax is $2.50";
		const result = extractCurrency(text, true);
		strictEqual(result, "Price is <CURRENCY> and tax is <CURRENCY>");
	});

	it("handles placeholder replacement with no currency", () => {
		const text = "No currency amounts here";
		const result = extractCurrency(text, true);
		strictEqual(result, text);
	});

	it("handles currency in formatted financial text", () => {
		const text = `
			Financial Summary:
			Revenue: $125,000.00
			Expenses: €95,000.50
			Profit: £30,000.25
		`;
		// Note: Our current regex doesn't handle thousand separators
		// This test documents current behavior
		const amounts = extractCurrency(text);
		deepStrictEqual(amounts, ["$125", "€95", "£30"]);
	});
});
