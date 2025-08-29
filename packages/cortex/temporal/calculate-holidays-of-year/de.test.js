/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { GERMAN_HOLIDAYS, NATIONAL_HOLIDAYS, REGIONAL_HOLIDAYS } from "./de.js";
import { HolidayDefinition } from "./holiday.js";

describe("German holiday definitions", () => {
	describe("National holidays", () => {
		it("should have exactly 9 national holidays", () => {
			assert.strictEqual(NATIONAL_HOLIDAYS.length, 9);
		});

		it("should contain all expected national holidays", () => {
			const expectedNames = [
				"Neujahr",
				"Karfreitag",
				"Ostermontag",
				"Tag der Arbeit",
				"Christi Himmelfahrt",
				"Pfingstmontag",
				"Tag der Deutschen Einheit",
				"Erster Weihnachtstag",
				"Zweiter Weihnachtstag",
			];

			const actualNames = NATIONAL_HOLIDAYS.map((h) => h.name);
			expectedNames.forEach((name) => {
				assert.ok(
					actualNames.includes(name),
					`Missing national holiday: ${name}`,
				);
			});
		});

		it("should have all holidays as HolidayDefinition instances", () => {
			NATIONAL_HOLIDAYS.forEach((holiday) => {
				assert.ok(
					holiday instanceof HolidayDefinition,
					`${holiday.name} should be a HolidayDefinition instance`,
				);
			});
		});

		it("should have all national holidays as work-free", () => {
			NATIONAL_HOLIDAYS.forEach((holiday) => {
				assert.strictEqual(
					holiday.workFree,
					true,
					`${holiday.name} should be work-free`,
				);
			});
		});

		it("should have correct fixed date holidays", () => {
			const fixedHolidays = NATIONAL_HOLIDAYS.filter((h) => h.type === "fixed");
			const expectedFixed = [
				{ name: "Neujahr", month: 1, day: 1 },
				{ name: "Tag der Arbeit", month: 5, day: 1 },
				{ name: "Tag der Deutschen Einheit", month: 10, day: 3 },
				{ name: "Erster Weihnachtstag", month: 12, day: 25 },
				{ name: "Zweiter Weihnachtstag", month: 12, day: 26 },
			];

			assert.strictEqual(fixedHolidays.length, expectedFixed.length);

			expectedFixed.forEach((expected) => {
				const holiday = fixedHolidays.find((h) => h.name === expected.name);
				assert.ok(holiday, `Missing fixed holiday: ${expected.name}`);
				assert.strictEqual(holiday.month, expected.month);
				assert.strictEqual(holiday.day, expected.day);
			});
		});

		it("should have correct easter relative holidays", () => {
			const easterHolidays = NATIONAL_HOLIDAYS.filter(
				(h) => h.type === "easter_relative",
			);
			const expectedEaster = [
				{ name: "Karfreitag", offset: -2 },
				{ name: "Ostermontag", offset: 1 },
				{ name: "Christi Himmelfahrt", offset: 39 },
				{ name: "Pfingstmontag", offset: 50 },
			];

			assert.strictEqual(easterHolidays.length, expectedEaster.length);

			expectedEaster.forEach((expected) => {
				const holiday = easterHolidays.find((h) => h.name === expected.name);
				assert.ok(holiday, `Missing easter holiday: ${expected.name}`);
				assert.strictEqual(holiday.offset, expected.offset);
			});
		});
	});

	describe("Regional holidays", () => {
		it("should have all 16 German states", () => {
			const expectedStates = [
				"BW",
				"BY",
				"BE",
				"BB",
				"HB",
				"HH",
				"HE",
				"MV",
				"NI",
				"NW",
				"RP",
				"SL",
				"SN",
				"ST",
				"SH",
				"TH",
			];

			expectedStates.forEach((state) => {
				assert.ok(
					REGIONAL_HOLIDAYS[state],
					`Missing regional holidays for state: ${state}`,
				);
				assert.ok(
					Array.isArray(REGIONAL_HOLIDAYS[state]),
					`Regional holidays for ${state} should be an array`,
				);
			});
		});

		it("should have all regional holidays as HolidayDefinition instances", () => {
			Object.entries(REGIONAL_HOLIDAYS).forEach(([state, holidays]) => {
				holidays.forEach((holiday) => {
					assert.ok(
						holiday instanceof HolidayDefinition,
						`${state}:${holiday.name} should be a HolidayDefinition instance`,
					);
				});
			});
		});

		it("should have Baden-Württemberg specific holidays", () => {
			const bwHolidays = REGIONAL_HOLIDAYS.BW;
			const expectedNames = [
				"Heilige Drei Könige",
				"Fronleichnam",
				"Allerheiligen",
			];

			assert.strictEqual(bwHolidays.length, expectedNames.length);
			expectedNames.forEach((name) => {
				assert.ok(
					bwHolidays.some((h) => h.name === name),
					`BW missing holiday: ${name}`,
				);
			});
		});

		it("should have Bavaria specific holidays", () => {
			const byHolidays = REGIONAL_HOLIDAYS.BY;
			const expectedNames = [
				"Heilige Drei Könige",
				"Fronleichnam",
				"Mariä Himmelfahrt",
				"Allerheiligen",
			];

			assert.strictEqual(byHolidays.length, expectedNames.length);
			expectedNames.forEach((name) => {
				assert.ok(
					byHolidays.some((h) => h.name === name),
					`BY missing holiday: ${name}`,
				);
			});
		});

		it("should have Saxony with calculated holiday", () => {
			const snHolidays = REGIONAL_HOLIDAYS.SN;
			const bussUndBettag = snHolidays.find(
				(h) => h.name === "Buß- und Bettag",
			);

			assert.ok(bussUndBettag, "SN should have Buß- und Bettag");
			assert.strictEqual(bussUndBettag.type, "calculated");
			assert.strictEqual(typeof bussUndBettag.calculator, "function");
		});

		it("should have Protestant states with Reformation Day", () => {
			const protestantStates = ["BB", "HB", "HH", "MV", "NI", "SN", "ST", "SH"];

			protestantStates.forEach((state) => {
				const holidays = REGIONAL_HOLIDAYS[state];
				const reformationDay = holidays.find(
					(h) => h.name === "Reformationstag",
				);
				assert.ok(reformationDay, `${state} should have Reformationstag`);
				assert.strictEqual(reformationDay.type, "fixed");
				assert.strictEqual(reformationDay.month, 10);
				assert.strictEqual(reformationDay.day, 31);
			});
		});

		it("should have Catholic states with specific holidays", () => {
			// States with Fronleichnam
			const fronleichnamStates = [
				"BW",
				"BY",
				"HE",
				"NW",
				"RP",
				"SL",
				"SN",
				"TH",
			];

			fronleichnamStates.forEach((state) => {
				const holidays = REGIONAL_HOLIDAYS[state];
				const fronleichnam = holidays.find((h) => h.name === "Fronleichnam");
				assert.ok(fronleichnam, `${state} should have Fronleichnam`);
				assert.strictEqual(fronleichnam.type, "easter_relative");
				assert.strictEqual(fronleichnam.offset, 60);
			});

			// States with Allerheiligen
			const allerheilligenStates = ["BW", "BY", "NW", "RP", "SL"];

			allerheilligenStates.forEach((state) => {
				const holidays = REGIONAL_HOLIDAYS[state];
				const allerheiligen = holidays.find((h) => h.name === "Allerheiligen");
				assert.ok(allerheiligen, `${state} should have Allerheiligen`);
				assert.strictEqual(allerheiligen.type, "fixed");
				assert.strictEqual(allerheiligen.month, 11);
				assert.strictEqual(allerheiligen.day, 1);
			});
		});

		it("should have unique Berlin holiday", () => {
			const beHolidays = REGIONAL_HOLIDAYS.BE;
			assert.strictEqual(beHolidays.length, 1);

			const frauentag = beHolidays[0];
			assert.strictEqual(frauentag.name, "Internationaler Frauentag");
			assert.strictEqual(frauentag.type, "fixed");
			assert.strictEqual(frauentag.month, 3);
			assert.strictEqual(frauentag.day, 8);
		});
	});

	describe("Buß- und Bettag calculation", () => {
		it("should calculate correct dates for known years", () => {
			// Get the calculator from Saxony's holidays
			const snHolidays = REGIONAL_HOLIDAYS.SN;
			const bussUndBettag = snHolidays.find(
				(h) => h.name === "Buß- und Bettag",
			);
			const calculator = bussUndBettag.calculator;

			// Known Buß- und Bettag dates
			const knownDates = [
				{ year: 2023, month: 11, day: 22 }, // November 22, 2023
				{ year: 2024, month: 11, day: 20 }, // November 20, 2024
				{ year: 2025, month: 11, day: 19 }, // November 19, 2025
			];

			knownDates.forEach(({ year, month, day }) => {
				const result = calculator(year);
				assert.strictEqual(result.getUTCFullYear(), year);
				assert.strictEqual(result.getUTCMonth() + 1, month);
				assert.strictEqual(result.getUTCDate(), day);
			});
		});

		it("should always fall on a Wednesday", () => {
			const snHolidays = REGIONAL_HOLIDAYS.SN;
			const bussUndBettag = snHolidays.find(
				(h) => h.name === "Buß- und Bettag",
			);
			const calculator = bussUndBettag.calculator;

			// Test multiple years
			for (let year = 2020; year <= 2030; year++) {
				const result = calculator(year);
				const dayOfWeek = result.getUTCDay();
				assert.strictEqual(
					dayOfWeek,
					3,
					`Buß- und Bettag ${year} should be Wednesday (3), got ${dayOfWeek}`,
				);
			}
		});

		it("should fall between November 16 and November 22", () => {
			const snHolidays = REGIONAL_HOLIDAYS.SN;
			const bussUndBettag = snHolidays.find(
				(h) => h.name === "Buß- und Bettag",
			);
			const calculator = bussUndBettag.calculator;

			// Test range for multiple years
			for (let year = 2020; year <= 2030; year++) {
				const result = calculator(year);
				const month = result.getUTCMonth() + 1;
				const day = result.getUTCDate();

				assert.strictEqual(month, 11, `Should be in November for ${year}`);
				assert.ok(
					day >= 16 && day <= 22,
					`Day should be 16-22, got ${day} for ${year}`,
				);
			}
		});

		it("should be before November 23", () => {
			const snHolidays = REGIONAL_HOLIDAYS.SN;
			const bussUndBettag = snHolidays.find(
				(h) => h.name === "Buß- und Bettag",
			);
			const calculator = bussUndBettag.calculator;

			for (let year = 2020; year <= 2030; year++) {
				const result = calculator(year);
				const nov23 = new Date(Date.UTC(year, 10, 23, 0, 0, 0, 0));
				assert.ok(
					result < nov23,
					`Buß- und Bettag ${year} should be before November 23`,
				);
			}
		});
	});

	describe("GERMAN_HOLIDAYS structure", () => {
		it("should export correct structure", () => {
			assert.ok(GERMAN_HOLIDAYS.national);
			assert.ok(GERMAN_HOLIDAYS.regional);
			assert.strictEqual(GERMAN_HOLIDAYS.national, NATIONAL_HOLIDAYS);
			assert.strictEqual(GERMAN_HOLIDAYS.regional, REGIONAL_HOLIDAYS);
		});

		it("should have immutable references", () => {
			// Verify we're not accidentally sharing mutable references
			assert.notStrictEqual(GERMAN_HOLIDAYS.national, GERMAN_HOLIDAYS.regional);
			assert.ok(Array.isArray(GERMAN_HOLIDAYS.national));
			assert.ok(typeof GERMAN_HOLIDAYS.regional === "object");
		});
	});

	describe("Holiday data consistency", () => {
		it("should have consistent work-free status", () => {
			// All current German holidays are work-free
			NATIONAL_HOLIDAYS.forEach((holiday) => {
				assert.strictEqual(
					holiday.workFree,
					true,
					`National holiday ${holiday.name} should be work-free`,
				);
			});

			Object.entries(REGIONAL_HOLIDAYS).forEach(([state, holidays]) => {
				holidays.forEach((holiday) => {
					assert.strictEqual(
						holiday.workFree,
						true,
						`Regional holiday ${state}:${holiday.name} should be work-free`,
					);
				});
			});
		});

		it("should have no duplicate names within scope", () => {
			// National holidays should have unique names
			const nationalNames = NATIONAL_HOLIDAYS.map((h) => h.name);
			const uniqueNationalNames = [...new Set(nationalNames)];
			assert.strictEqual(
				nationalNames.length,
				uniqueNationalNames.length,
				"National holidays should have unique names",
			);

			// Regional holidays within each state should have unique names
			Object.entries(REGIONAL_HOLIDAYS).forEach(([state, holidays]) => {
				const stateNames = holidays.map((h) => h.name);
				const uniqueStateNames = [...new Set(stateNames)];
				assert.strictEqual(
					stateNames.length,
					uniqueStateNames.length,
					`State ${state} holidays should have unique names`,
				);
			});
		});

		it("should have valid calculation types", () => {
			const validTypes = ["fixed", "easter_relative", "calculated"];

			[
				...NATIONAL_HOLIDAYS,
				...Object.values(REGIONAL_HOLIDAYS).flat(),
			].forEach((holiday) => {
				assert.ok(
					validTypes.includes(holiday.type),
					`Holiday ${holiday.name} has invalid type: ${holiday.type}`,
				);
			});
		});
	});
});
