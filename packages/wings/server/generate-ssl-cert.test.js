import assert from "node:assert";
import { describe, test } from "node:test";
import { generateSSLCert } from "./generate-ssl-cert.js";

describe("generateSSLCert", () => {
	test("should generate certificate with default and custom options", async () => {
		// Test default options
		const defaultResult = await generateSSLCert();
		assert.strictEqual(typeof defaultResult.privateKey, "string");
		assert.strictEqual(typeof defaultResult.certificate, "string");
		assert.ok(defaultResult.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(defaultResult.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(defaultResult.certificate.length > 1000);

		// Test custom options
		const customResult = await generateSSLCert({
			commonName: "example.com",
			organization: "Example Corp",
			country: "CA",
			state: "Ontario",
			locality: "Toronto",
			keySize: 4096,
			validityDays: 730
		});
		assert.ok(customResult.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(customResult.certificate.length > 1000);
	});

	test("should validate all input fields", async () => {
		// Test all validation cases in one test for efficiency
		const validationTests = [
			// String field validations
			{ field: "commonName", invalidValues: ["", "   ", null, 123] },
			{ field: "organization", invalidValues: ["", "   ", null, 123] },
			{ field: "country", invalidValues: ["", "   ", null, 123] },
			{ field: "state", invalidValues: ["", "   ", null, 123] },
			{ field: "locality", invalidValues: ["", "   ", null, 123] },
			// Numeric field validations
			{ field: "keySize", invalidValues: [1024, 3072, 8192, "2048", null] },
			{ field: "validityDays", invalidValues: [0, -1, 3651, 1.5, "365", null] }
		];

		for (const { field, invalidValues } of validationTests) {
			for (const invalidValue of invalidValues) {
				await assert.rejects(
					async () => generateSSLCert({ [field]: invalidValue }),
					TypeError,
					`Should reject invalid ${field}: ${JSON.stringify(invalidValue)}`
				);
			}
		}

		// Test that undefined values use defaults
		await assert.doesNotReject(async () => generateSSLCert({
			commonName: undefined,
			organization: undefined,
			country: undefined,
			state: undefined,
			locality: undefined,
			keySize: undefined,
			validityDays: undefined
		}));
		await assert.doesNotReject(async () => generateSSLCert({}));
	});

	test("should handle crypto errors and edge cases", async () => {
		// Test crypto error handling
		const originalGenerateKey = crypto.subtle.generateKey;
		crypto.subtle.generateKey = async () => {
			throw new Error("Mock crypto error");
		};

		try {
			await assert.rejects(
				async () => generateSSLCert(),
				Error,
				"Should throw wrapped error when crypto API fails"
			);
		} finally {
			crypto.subtle.generateKey = originalGenerateKey;
		}

		// Test getOidForType fallback branch
		const { getOidForType } = await import('./generate-ssl-cert.js');
		assert.strictEqual(getOidForType('UNKNOWN'), '2.5.4.3');
		assert.strictEqual(getOidForType(''), '2.5.4.3');
		assert.strictEqual(getOidForType(null), '2.5.4.3');
		assert.strictEqual(getOidForType(undefined), '2.5.4.3');
	});

	test("should handle ASN.1 encoding edge cases", async () => {
		// Test long form TLV encoding and OID encoding in one test
		const result = await generateSSLCert({
			commonName: "A".repeat(200),
			organization: "Organization With Special Characters: 测试 🚀",
			country: "B".repeat(200),
			state: "C".repeat(200),
			locality: "D".repeat(200)
		});

		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
	});

	test("should generate unique certificates with different configurations", async () => {
		// Test uniqueness, different key sizes, and validity periods in one test
		const [cert1, cert2, cert2048, cert4096, cert30, cert365] = await Promise.all([
			generateSSLCert(),
			generateSSLCert(),
			generateSSLCert({ keySize: 2048 }),
			generateSSLCert({ keySize: 4096 }),
			generateSSLCert({ validityDays: 30 }),
			generateSSLCert({ validityDays: 365 })
		]);

		// Test uniqueness
		assert.notStrictEqual(cert1.privateKey, cert2.privateKey);
		assert.notStrictEqual(cert1.certificate, cert2.certificate);

		// Test key size differences
		assert.ok(cert4096.privateKey.length > cert2048.privateKey.length);
		assert.ok(cert4096.certificate.length > cert2048.certificate.length);

		// Test all have valid structure
		[cert1, cert2, cert2048, cert4096, cert30, cert365].forEach(cert => {
			assert.ok(cert.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
			assert.ok(cert.certificate.includes("-----BEGIN CERTIFICATE-----"));
		});
	});

	test("should generate valid PEM format and handle concurrent generation", async () => {
		// Test PEM format validation
		const result = await generateSSLCert();
		const privateKeyLines = result.privateKey.split('\n');
		const certLines = result.certificate.split('\n');

		assert.strictEqual(privateKeyLines[0], '-----BEGIN PRIVATE KEY-----');
		assert.strictEqual(privateKeyLines[privateKeyLines.length - 1], '-----END PRIVATE KEY-----');
		assert.strictEqual(certLines[0], '-----BEGIN CERTIFICATE-----');
		assert.strictEqual(certLines[certLines.length - 1], '-----END CERTIFICATE-----');

		// Test base64 line length
		for (let i = 1; i < privateKeyLines.length - 1; i++) {
			assert.ok(privateKeyLines[i].length <= 64);
		}
		for (let i = 1; i < certLines.length - 1; i++) {
			assert.ok(certLines[i].length <= 64);
		}

		// Test concurrent generation
		const promises = Array.from({ length: 3 }, () => generateSSLCert());
		const results = await Promise.all(promises);

		const privateKeys = results.map(r => r.privateKey);
		const certificates = results.map(r => r.certificate);

		assert.strictEqual(new Set(privateKeys).size, 3);
		assert.strictEqual(new Set(certificates).size, 3);
	});
});
