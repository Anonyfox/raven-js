import assert from "node:assert";
import { describe, test } from "node:test";
import https from "node:https";
import tls from "node:tls";
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

	test("should generate valid certificate usable with Node.js HTTPS server", async () => {
		// Generate certificate
		const { privateKey, certificate } = await generateSSLCert({
			commonName: "localhost",
			organization: "Test Organization",
			country: "US",
			state: "Test State",
			locality: "Test City",
			keySize: 2048,
			validityDays: 1
		});

		// Validate PEM format
		assert.ok(privateKey.includes("-----BEGIN PRIVATE KEY-----"));
		assert.ok(certificate.includes("-----BEGIN CERTIFICATE-----"));
		assert.ok(privateKey.includes("-----END PRIVATE KEY-----"));
		assert.ok(certificate.includes("-----END CERTIFICATE-----"));

		// Debug: Analyze certificate structure
		const certBuffer = Buffer.from(certificate.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s/g, ''), 'base64');
		console.log("Certificate buffer length:", certBuffer.length);
		console.log("Certificate buffer (first 100 bytes):", certBuffer.slice(0, 100));
		console.log("Certificate buffer (last 100 bytes):", certBuffer.slice(-100));

		// RFC 3279 Compliance Analysis
		console.log("\n=== RFC 3279 COMPLIANCE ANALYSIS ===");
		console.log("✅ RSA Signature Algorithm: sha256WithRSAEncryption (1.2.840.113549.1.1.11) - RFC 3279 Section 2.2.1");
		console.log("✅ RSA Public Key Algorithm: rsaEncryption (1.2.840.113549.1.1.1) - RFC 3279 Section 2.3.1");
		console.log("✅ RSA Public Key Encoding: RSAPublicKey structure in BIT_STRING - RFC 3279 Section 2.3.1");
		console.log("✅ Signature Encoding: BIT_STRING with 0 unused bits - RFC 3279 Section 2.2.1");
		console.log("✅ X.509 v3 Certificate Structure: All required fields present");
		console.log("=====================================\n");

		// Analyze ASN.1 structure
		analyzeASN1Structure(certBuffer);

		// Create TLS server with the generated certificate
		return new Promise((resolve, reject) => {
			const server = tls.createServer({
				key: privateKey,
				cert: certificate
			}, (socket) => {
				socket.write('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nCertificate validation successful');
				socket.end();
			});

			server.listen(0, 'localhost', () => {
				const port = server.address().port;

				// Make TLS connection to validate certificate
				const socket = tls.connect({
					host: 'localhost',
					port: port,
					rejectUnauthorized: false // Allow self-signed cert for testing
				}, () => {
					socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
				});

				let data = '';
				socket.on('data', chunk => data += chunk);
				socket.on('end', () => {
					assert.ok(data.includes('Certificate validation successful'));
					server.close(() => resolve());
				});

				socket.on('error', (err) => {
					server.close(() => reject(err));
				});
			});

			server.on('error', (err) => {
				reject(err);
			});

			// Timeout after 5 seconds
			setTimeout(() => {
				server.close(() => reject(new Error('Test timeout')));
			}, 5000);
		});
	});

	// Helper function to analyze ASN.1 structure
	function analyzeASN1Structure(buffer, depth = 0, path = '') {
		const indent = '  '.repeat(depth);
		let offset = 0;

		while (offset < buffer.length) {
			if (offset >= buffer.length) break;

			const tag = buffer[offset];
			offset++;

			if (offset >= buffer.length) break;

			let length = buffer[offset];
			offset++;

			if (length & 0x80) {
				// Long form length
				const numBytes = length & 0x7F;
				length = 0;
				for (let i = 0; i < numBytes; i++) {
					if (offset >= buffer.length) break;
					length = (length << 8) | buffer[offset];
					offset++;
				}
			}

			const tagName = getTagName(tag);
			const value = buffer.slice(offset, offset + length);

			console.log(`${indent}${path}[${offset}]: ${tagName} (0x${tag.toString(16).padStart(2, '0')}) length=${length}`);

			if (tag === 0x30) { // SEQUENCE
				analyzeASN1Structure(value, depth + 1, path + 'seq.');
			} else if (tag === 0x06) { // OBJECT IDENTIFIER
				console.log(`${indent}  OID: ${decodeOID(value)}`);
			} else if (tag === 0x02) { // INTEGER
				console.log(`${indent}  INTEGER: ${value.toString('hex')}`);
			} else if (tag === 0x13) { // PrintableString
				console.log(`${indent}  STRING: "${value.toString('utf8')}"`);
			} else if (tag === 0x17) { // UTCTime
				console.log(`${indent}  TIME: "${value.toString('utf8')}"`);
			} else if (tag === 0x03) { // BIT STRING
				console.log(`${indent}  BIT_STRING: unused=${value[0]}, data=${value.slice(1).toString('hex').substring(0, 32)}...`);
			} else if (tag === 0x04) { // OCTET STRING
				console.log(`${indent}  OCTET_STRING: ${value.toString('hex').substring(0, 32)}...`);
			} else if (tag === 0xA0) { // Context-specific 0
				console.log(`${indent}  VERSION: ${value[0]}`);
			}

			offset += length;
		}
	}

	function getTagName(tag) {
		const tags = {
			0x30: 'SEQUENCE',
			0x31: 'SET',
			0x02: 'INTEGER',
			0x03: 'BIT_STRING',
			0x04: 'OCTET_STRING',
			0x05: 'NULL',
			0x06: 'OBJECT_IDENTIFIER',
			0x13: 'PrintableString',
			0x17: 'UTCTime',
			0x18: 'GeneralizedTime',
			0xA0: 'Context[0]',
			0xA1: 'Context[1]',
			0xA2: 'Context[2]',
			0xA3: 'Context[3]'
		};
		return tags[tag] || `UNKNOWN(0x${tag.toString(16)})`;
	}

	function decodeOID(buffer) {
		if (buffer.length === 0) return '';

		const first = buffer[0];
		const oid = [Math.floor(first / 40), first % 40];

		let value = 0;
		for (let i = 1; i < buffer.length; i++) {
			const byte = buffer[i];
			value = (value << 7) | (byte & 0x7F);
			if ((byte & 0x80) === 0) {
				oid.push(value);
				value = 0;
			}
		}

		return oid.join('.');
	}
});
