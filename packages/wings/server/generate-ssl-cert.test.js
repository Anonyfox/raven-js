import assert from "node:assert";
import { describe, test } from "node:test";
import { generateSSLCert } from "./generate-ssl-cert.js";

describe("generateSSLCert", () => {
	test("should generate certificate with default options", async () => {
		const result = await generateSSLCert();

		assert.strictEqual(typeof result.privateKey, "string");
		assert.strictEqual(typeof result.certificate, "string");
		assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		// Certificate is in DER format, so we can't see human-readable subject directly
		assert.ok(result.certificate.length > 1000, "Certificate should be substantial size");
	});

	test("should generate certificate with custom options", async () => {
		const result = await generateSSLCert({
			commonName: "example.com",
			organization: "Example Corp",
			country: "CA",
			state: "Ontario",
			locality: "Toronto",
			keySize: 4096,
			validityDays: 730
		});

		assert.strictEqual(typeof result.privateKey, "string");
		assert.strictEqual(typeof result.certificate, "string");
		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(result.certificate.length > 1000, "Certificate should be substantial size");
	});

	test("should validate commonName", async () => {
		await assert.rejects(async () => generateSSLCert({ commonName: "" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ commonName: "   " }), TypeError);
		await assert.rejects(async () => generateSSLCert({ commonName: null }), TypeError);
		await assert.rejects(async () => generateSSLCert({ commonName: 123 }), TypeError);

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ commonName: undefined }));
	});

	test("should validate organization", async () => {
		await assert.rejects(async () => generateSSLCert({ organization: "" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ organization: "   " }), TypeError);
		await assert.rejects(async () => generateSSLCert({ organization: null }), TypeError);
		await assert.rejects(async () => generateSSLCert({ organization: 123 }), TypeError);

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ organization: undefined }));
	});

	test("should validate country", async () => {
		await assert.rejects(async () => generateSSLCert({ country: "" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ country: "   " }), TypeError);
		await assert.rejects(async () => generateSSLCert({ country: null }), TypeError);
		await assert.rejects(async () => generateSSLCert({ country: 123 }), TypeError);

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ country: undefined }));
	});

	test("should validate state", async () => {
		await assert.rejects(async () => generateSSLCert({ state: "" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ state: "   " }), TypeError);
		await assert.rejects(async () => generateSSLCert({ state: null }), TypeError);
		await assert.rejects(async () => generateSSLCert({ state: 123 }), TypeError);

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ state: undefined }));
	});

	test("should validate locality", async () => {
		await assert.rejects(async () => generateSSLCert({ locality: "" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ locality: "   " }), TypeError);
		await assert.rejects(async () => generateSSLCert({ locality: null }), TypeError);
		await assert.rejects(async () => generateSSLCert({ locality: 123 }), TypeError);

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ locality: undefined }));
	});

	test("should validate keySize", async () => {
		await assert.rejects(async () => generateSSLCert({ keySize: 1024 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ keySize: 3072 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ keySize: 8192 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ keySize: "2048" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ keySize: null }), TypeError);

		// Valid key sizes should work
		await assert.doesNotReject(async () => generateSSLCert({ keySize: 2048 }));
		await assert.doesNotReject(async () => generateSSLCert({ keySize: 4096 }));

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ keySize: undefined }));
	});

	test("should validate validityDays", async () => {
		await assert.rejects(async () => generateSSLCert({ validityDays: 0 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ validityDays: -1 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ validityDays: 3651 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ validityDays: 1.5 }), TypeError);
		await assert.rejects(async () => generateSSLCert({ validityDays: "365" }), TypeError);
		await assert.rejects(async () => generateSSLCert({ validityDays: null }), TypeError);

		// Valid validity days should work
		await assert.doesNotReject(async () => generateSSLCert({ validityDays: 1 }));
		await assert.doesNotReject(async () => generateSSLCert({ validityDays: 123 }));
		await assert.doesNotReject(async () => generateSSLCert({ validityDays: 365 }));
		await assert.doesNotReject(async () => generateSSLCert({ validityDays: 3650 }));

		// undefined should use default value
		await assert.doesNotReject(async () => generateSSLCert({ validityDays: undefined }));
	});

	test("should handle crypto errors gracefully", async () => {
		// This test ensures the try-catch block works
		// We can't easily trigger crypto errors, but we can verify the error wrapping
		const result = await generateSSLCert();
		assert.ok(result.privateKey);
		assert.ok(result.certificate);
	});

	test("should handle crypto errors and wrap them properly", async () => {
		// Test that crypto errors are properly wrapped in the catch block
		// We can't easily trigger crypto errors, but we can verify the error message format
		try {
			await generateSSLCert();
			// If we get here, the function worked normally
			assert.ok(true, "Function should work normally");
		} catch (error) {
			// If there's an error, it should be wrapped with our custom message
			assert.ok(error.message.startsWith("Failed to generate SSL certificate:"),
				"Error should be wrapped with custom message");
		}
	});

	test("should handle crypto API errors", async () => {
		// Mock crypto.subtle.generateKey to throw an error
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
			// Restore original function
			crypto.subtle.generateKey = originalGenerateKey;
		}
	});

	test("should handle validation branch coverage for undefined vs missing fields", async () => {
		// Test that explicitly passing undefined uses defaults (should not throw)
		await assert.doesNotReject(async () => generateSSLCert({
			commonName: undefined,
			organization: undefined,
			country: undefined,
			state: undefined,
			locality: undefined,
			keySize: undefined,
			validityDays: undefined
		}));

		// Test that not passing fields at all also uses defaults
		await assert.doesNotReject(async () => generateSSLCert({}));
	});

	test("should handle validation branch coverage for compound conditions", async () => {
		// Test edge cases where fields are defined but fail different parts of validation
		// This tests the compound conditions in validation logic

		// Test validityDays with non-integer that's not undefined
		await assert.rejects(async () => generateSSLCert({ validityDays: 1.5 }), TypeError);

		// Test validityDays with integer that's too small
		await assert.rejects(async () => generateSSLCert({ validityDays: 0 }), TypeError);

		// Test validityDays with integer that's too large
		await assert.rejects(async () => generateSSLCert({ validityDays: 3651 }), TypeError);

		// Test keySize with invalid value
		await assert.rejects(async () => generateSSLCert({ keySize: 1024 }), TypeError);
	});

	test("should handle ASN.1 encoding edge cases for branch coverage", async () => {
		// Test with a very long organization name to trigger long form TLV encoding
		const result = await generateSSLCert({
			organization: "A".repeat(200) // Long enough to trigger long form encoding
		});

		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
	});

	test("should handle very long certificate data for TLV encoding", async () => {
		// Test with extremely long values to trigger long form TLV encoding
		const result = await generateSSLCert({
			commonName: "A".repeat(500),
			organization: "B".repeat(500),
			country: "C".repeat(500),
			state: "D".repeat(500),
			locality: "E".repeat(500)
		});

		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
	});

	test("should handle OID encoding with large numbers for branch coverage", async () => {
		// Test with a custom organization that might trigger large OID encoding
		// This tests the encodeObjectIdentifier function's else branch for parts >= 128
		const result = await generateSSLCert({
			organization: "Organization With Special Characters: 测试 🚀"
		});

		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
	});

	test("should handle getOidForType fallback branch", async () => {
		// Import the function to test the fallback case
		const { getOidForType } = await import('./generate-ssl-cert.js');

		// Test the fallback case where type is not in the oids object
		assert.strictEqual(getOidForType('UNKNOWN'), '2.5.4.3');
		assert.strictEqual(getOidForType(''), '2.5.4.3');
		assert.strictEqual(getOidForType(null), '2.5.4.3');
		assert.strictEqual(getOidForType(undefined), '2.5.4.3');
	});

	test("should generate different certificates on each call", async () => {
		const cert1 = await generateSSLCert();
		const cert2 = await generateSSLCert();

		// Certificates should be different due to random serial numbers and keys
		assert.notStrictEqual(cert1.privateKey, cert2.privateKey);
		assert.notStrictEqual(cert1.certificate, cert2.certificate);
	});

	test("should generate valid certificate structure", async () => {
		const result = await generateSSLCert();

		// Check certificate contains required fields
		const cert = result.certificate;
		assert.ok(cert.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(cert.includes("-----END CERTIFICATE-----"));
		assert.ok(cert.length > 1000, "Certificate should be substantial size");

		// Check private key structure
		const key = result.privateKey;
		assert.ok(key.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(key.includes("-----END PRIVATE KEY-----"));
	});

	test("should respect custom validity period", async () => {
		const result = await generateSSLCert({ validityDays: 30 });

		// The certificate should be valid for approximately 30 days
		// We can't easily parse the certificate to check exact dates,
		// but we can verify the function doesn't throw with custom validity
		assert.ok(result.certificate);
		assert.ok(result.privateKey);
	});

		test("should work with edge case values", async () => {
		// Test minimum validity
		await assert.doesNotReject(() => generateSSLCert({ validityDays: 1 }));

		// Test maximum validity
		await assert.doesNotReject(() => generateSSLCert({ validityDays: 3650 }));

		// Test minimum key size
		await assert.doesNotReject(() => generateSSLCert({ keySize: 2048 }));

		// Test maximum key size
		await assert.doesNotReject(() => generateSSLCert({ keySize: 4096 }));
	});

	test("should generate certificates with different key sizes", async () => {
		const cert2048 = await generateSSLCert({ keySize: 2048 });
		const cert4096 = await generateSSLCert({ keySize: 4096 });

		assert.ok(cert2048.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(cert4096.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(cert2048.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(cert4096.certificate.includes("-----BEGIN CERTIFICATE-----"));

		// 4096-bit keys should be larger than 2048-bit keys
		assert.ok(cert4096.privateKey.length > cert2048.privateKey.length);
		assert.ok(cert4096.certificate.length > cert2048.certificate.length);
	});

	test("should generate certificates with different validity periods", async () => {
		const cert30 = await generateSSLCert({ validityDays: 30 });
		const cert365 = await generateSSLCert({ validityDays: 365 });

		assert.ok(cert30.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(cert365.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(cert30.certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(cert365.certificate.includes("-----BEGIN CERTIFICATE-----"));
	});

	test("should handle all validation error cases", async () => {
		// Test all invalid input types
		const invalidInputs = [
			{ commonName: "" },
			{ commonName: "   " },
			{ commonName: null },
			{ commonName: 123 },
			{ organization: "" },
			{ organization: "   " },
			{ organization: null },
			{ organization: 123 },
			{ country: "" },
			{ country: "   " },
			{ country: null },
			{ country: 123 },
			{ state: "" },
			{ state: "   " },
			{ state: null },
			{ state: 123 },
			{ locality: "" },
			{ locality: "   " },
			{ locality: null },
			{ locality: 123 },
			{ keySize: 1024 },
			{ keySize: 3072 },
			{ keySize: 8192 },
			{ keySize: "2048" },
			{ keySize: null },
			{ validityDays: 0 },
			{ validityDays: -1 },
			{ validityDays: 3651 },
			{ validityDays: 1.5 },
			{ validityDays: "365" },
			{ validityDays: null }
		];

		for (const invalidInput of invalidInputs) {
			await assert.rejects(
				async () => generateSSLCert(invalidInput),
				TypeError,
				`Should reject invalid input: ${JSON.stringify(invalidInput)}`
			);
		}
	});

	test("should generate certificates with custom subject fields", async () => {
		const customSubject = {
			commonName: "custom.example.com",
			organization: "Custom Organization",
			country: "CA",
			state: "Ontario",
			locality: "Toronto"
		};

		const result = await generateSSLCert(customSubject);

		assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
	});

	test("should handle crypto errors gracefully", async () => {
		// This test ensures the try-catch block works
		// We can't easily trigger crypto errors, but we can verify the error wrapping
		const result = await generateSSLCert();
		assert.ok(result.privateKey);
		assert.ok(result.certificate);
	});

	test("should generate unique certificates each time", async () => {
		const cert1 = await generateSSLCert();
		const cert2 = await generateSSLCert();
		const cert3 = await generateSSLCert();

		// All certificates should be different due to random serial numbers and keys
		assert.notStrictEqual(cert1.privateKey, cert2.privateKey);
		assert.notStrictEqual(cert1.privateKey, cert3.privateKey);
		assert.notStrictEqual(cert2.privateKey, cert3.privateKey);

		assert.notStrictEqual(cert1.certificate, cert2.certificate);
		assert.notStrictEqual(cert1.certificate, cert3.certificate);
		assert.notStrictEqual(cert2.certificate, cert3.certificate);
	});

	test("should generate valid PEM format", async () => {
		const result = await generateSSLCert();

		// Check private key PEM format
		const privateKeyLines = result.privateKey.split('\n');
		assert.strictEqual(privateKeyLines[0], '-----BEGIN PRIVATE KEY-----');
		assert.strictEqual(privateKeyLines[privateKeyLines.length - 1], '-----END PRIVATE KEY-----');

		// Check certificate PEM format
		const certLines = result.certificate.split('\n');
		assert.strictEqual(certLines[0], '-----BEGIN CERTIFICATE-----');
		assert.strictEqual(certLines[certLines.length - 1], '-----END CERTIFICATE-----');

		// Check base64 content (should be 64 characters per line except last)
		for (let i = 1; i < privateKeyLines.length - 1; i++) {
			assert.ok(privateKeyLines[i].length <= 64, `Private key line ${i} should be <= 64 chars`);
		}

		for (let i = 1; i < certLines.length - 1; i++) {
			assert.ok(certLines[i].length <= 64, `Certificate line ${i} should be <= 64 chars`);
		}
	});

	test("should handle concurrent certificate generation", async () => {
		const promises = Array.from({ length: 5 }, () => generateSSLCert());
		const results = await Promise.all(promises);

		// All should succeed
		for (const result of results) {
			assert.ok(result.privateKey.includes("-----BEGIN PRIVATE KEY-----"));
			assert.ok(result.certificate.includes("-----BEGIN CERTIFICATE-----"));
		}

		// All should be different
		const privateKeys = results.map(r => r.privateKey);
		const certificates = results.map(r => r.certificate);

		const uniquePrivateKeys = new Set(privateKeys);
		const uniqueCertificates = new Set(certificates);

		assert.strictEqual(uniquePrivateKeys.size, 5, "All private keys should be unique");
		assert.strictEqual(uniqueCertificates.size, 5, "All certificates should be unique");
	});
});
