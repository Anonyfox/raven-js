/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Unit tests for Soar shared flag definitions.
 *
 * Tests flag configuration arrays used across all Soar command classes.
 * Validates flag structure and naming conventions.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	ALL_DEPLOYMENT_FLAGS,
	ARTIFACT_FLAGS,
	AWS_FLAGS,
	CLOUDFLARE_FLAGS,
	COMMON_FLAGS,
	DIGITALOCEAN_FLAGS,
} from "./shared-flags.js";

describe("COMMON_FLAGS", () => {
	it("exports array of common flags", () => {
		strictEqual(Array.isArray(COMMON_FLAGS), true);
		strictEqual(COMMON_FLAGS.length > 0, true);
	});

	it("includes verbose flag with alias", () => {
		const verboseFlag = COMMON_FLAGS.find((f) => f.name === "verbose");
		strictEqual(verboseFlag.alias, "v");
		strictEqual(verboseFlag.type, "boolean");
	});

	it("includes auto-approve flag", () => {
		const autoApproveFlag = COMMON_FLAGS.find((f) => f.name === "auto-approve");
		strictEqual(autoApproveFlag.type, "boolean");
	});

	it("includes export flag", () => {
		const exportFlag = COMMON_FLAGS.find((f) => f.name === "export");
		strictEqual(exportFlag.type, "string");
	});
});

describe("ARTIFACT_FLAGS", () => {
	it("exports array of artifact flags", () => {
		strictEqual(Array.isArray(ARTIFACT_FLAGS), true);
		strictEqual(ARTIFACT_FLAGS.length > 0, true);
	});

	it("includes static flag", () => {
		const staticFlag = ARTIFACT_FLAGS.find((f) => f.name === "static");
		strictEqual(staticFlag.type, "string");
		strictEqual(typeof staticFlag.description, "string");
	});

	it("includes script flag for future use", () => {
		const scriptFlag = ARTIFACT_FLAGS.find((f) => f.name === "script");
		strictEqual(scriptFlag.type, "string");
	});

	it("includes binary flag for future use", () => {
		const binaryFlag = ARTIFACT_FLAGS.find((f) => f.name === "binary");
		strictEqual(binaryFlag.type, "string");
	});
});

describe("CLOUDFLARE_FLAGS", () => {
	it("exports array of Cloudflare flags", () => {
		strictEqual(Array.isArray(CLOUDFLARE_FLAGS), true);
		strictEqual(CLOUDFLARE_FLAGS.length > 0, true);
	});

	it("includes cf-workers flag", () => {
		const cfWorkersFlag = CLOUDFLARE_FLAGS.find((f) => f.name === "cf-workers");
		strictEqual(cfWorkersFlag.type, "string");
	});

	it("includes cloudflare-workers alias", () => {
		const cfWorkersAlias = CLOUDFLARE_FLAGS.find(
			(f) => f.name === "cloudflare-workers",
		);
		strictEqual(cfWorkersAlias.type, "string");
	});

	it("includes Cloudflare-specific config flags", () => {
		const cfToken = CLOUDFLARE_FLAGS.find((f) => f.name === "cf-token");
		const cfAccount = CLOUDFLARE_FLAGS.find((f) => f.name === "cf-account");
		const cfCompatibility = CLOUDFLARE_FLAGS.find(
			(f) => f.name === "cf-compatibility",
		);

		strictEqual(cfToken.type, "string");
		strictEqual(cfAccount.type, "string");
		strictEqual(cfCompatibility.type, "string");
	});
});

describe("AWS_FLAGS", () => {
	it("exports array of AWS flags for future use", () => {
		strictEqual(Array.isArray(AWS_FLAGS), true);
		strictEqual(AWS_FLAGS.length > 0, true);
	});

	it("includes aws-lambda flag", () => {
		const awsLambdaFlag = AWS_FLAGS.find((f) => f.name === "aws-lambda");
		strictEqual(awsLambdaFlag.type, "string");
	});

	it("includes aws-s3 flag", () => {
		const awsS3Flag = AWS_FLAGS.find((f) => f.name === "aws-s3");
		strictEqual(awsS3Flag.type, "string");
	});

	it("includes aws-region flag", () => {
		const awsRegionFlag = AWS_FLAGS.find((f) => f.name === "aws-region");
		strictEqual(awsRegionFlag.type, "string");
	});
});

describe("DIGITALOCEAN_FLAGS", () => {
	it("exports array of DigitalOcean flags for future use", () => {
		strictEqual(Array.isArray(DIGITALOCEAN_FLAGS), true);
		strictEqual(DIGITALOCEAN_FLAGS.length > 0, true);
	});

	it("includes do-droplets flag", () => {
		const doDropletsFlag = DIGITALOCEAN_FLAGS.find(
			(f) => f.name === "do-droplets",
		);
		strictEqual(doDropletsFlag.type, "string");
	});

	it("includes do-spaces flag", () => {
		const doSpacesFlag = DIGITALOCEAN_FLAGS.find((f) => f.name === "do-spaces");
		strictEqual(doSpacesFlag.type, "string");
	});

	it("includes do-token flag", () => {
		const doTokenFlag = DIGITALOCEAN_FLAGS.find((f) => f.name === "do-token");
		strictEqual(doTokenFlag.type, "string");
	});
});

describe("ALL_DEPLOYMENT_FLAGS", () => {
	it("exports combined array of all flags", () => {
		strictEqual(Array.isArray(ALL_DEPLOYMENT_FLAGS), true);

		const expectedLength =
			COMMON_FLAGS.length +
			ARTIFACT_FLAGS.length +
			CLOUDFLARE_FLAGS.length +
			AWS_FLAGS.length +
			DIGITALOCEAN_FLAGS.length;

		strictEqual(ALL_DEPLOYMENT_FLAGS.length, expectedLength);
	});

	it("contains all flag categories", () => {
		const flagNames = ALL_DEPLOYMENT_FLAGS.map((f) => f.name);

		// Check for flags from each category
		strictEqual(flagNames.includes("verbose"), true); // COMMON_FLAGS
		strictEqual(flagNames.includes("static"), true); // ARTIFACT_FLAGS
		strictEqual(flagNames.includes("cf-workers"), true); // CLOUDFLARE_FLAGS
		strictEqual(flagNames.includes("aws-lambda"), true); // AWS_FLAGS
		strictEqual(flagNames.includes("do-droplets"), true); // DIGITALOCEAN_FLAGS
	});

	it("follows provider-product naming convention", () => {
		const flagNames = ALL_DEPLOYMENT_FLAGS.map((f) => f.name);

		// Provider-product examples
		const providerProductFlags = flagNames.filter(
			(name) =>
				name.includes("cf-") || name.includes("aws-") || name.includes("do-"),
		);

		strictEqual(providerProductFlags.length > 0, true);
	});
});
