

/**
 * Generate a self-signed SSL certificate for development use.
 *
 * Creates a new RSA key pair and self-signed certificate suitable for HTTPS development servers.
 * The certificate will be valid for 1 year from generation and uses SHA-256 signing.
 *
 * @param {Object} options - Certificate generation options
 * @param {string} [options.commonName='localhost'] - Common name for the certificate
 * @param {string} [options.organization='RavenJS Development'] - Organization name
 * @param {string} [options.country='US'] - Country code
 * @param {string} [options.state='Development'] - State/province
 * @param {string} [options.locality='Development'] - City/locality
 * @param {number} [options.keySize=2048] - RSA key size in bits (must be 2048 or 4096)
 * @param {number} [options.validityDays=365] - Certificate validity in days
 * @returns {Promise<Object>} Object containing private key and certificate as PEM strings
 * @throws {TypeError} When options are invalid
 * @throws {Error} When certificate generation fails
 *
 * @example
 * ```javascript
 * const { privateKey, certificate } = await generateSSLCert();
 *
 * // Use with HTTPS server
 * const https = require('https');
 * const server = https.createServer({
 *   key: privateKey,
 *   cert: certificate
 * }, app);
 * ```
 */
export async function generateSSLCert(options = {}) {
	// Validate inputs first, before destructuring
	if (options.commonName !== undefined && (typeof options.commonName !== 'string' || options.commonName.trim() === '')) {
		throw new TypeError('commonName must be a non-empty string');
	}
	if (options.organization !== undefined && (typeof options.organization !== 'string' || options.organization.trim() === '')) {
		throw new TypeError('organization must be a non-empty string');
	}
	if (options.country !== undefined && (typeof options.country !== 'string' || options.country.trim() === '')) {
		throw new TypeError('country must be a non-empty string');
	}
	if (options.state !== undefined && (typeof options.state !== 'string' || options.state.trim() === '')) {
		throw new TypeError('state must be a non-empty string');
	}
	if (options.locality !== undefined && (typeof options.locality !== 'string' || options.locality.trim() === '')) {
		throw new TypeError('locality must be a non-empty string');
	}
	if (options.keySize !== undefined && ![2048, 4096].includes(options.keySize)) {
		throw new TypeError('keySize must be 2048 or 4096');
	}
	if (options.validityDays !== undefined && (!Number.isInteger(options.validityDays) || options.validityDays < 1 || options.validityDays > 3650)) {
		throw new TypeError('validityDays must be an integer between 1 and 3650');
	}

	const {
		commonName = 'localhost',
		organization = 'RavenJS Development',
		country = 'US',
		state = 'Development',
		locality = 'Development',
		keySize = 2048,
		validityDays = 365
	} = options;

	try {
		// Generate RSA key pair using WebCrypto
		const keyPair = await crypto.subtle.generateKey(
			{
				name: 'RSASSA-PKCS1-v1_5',
				modulusLength: keySize,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256'
			},
			true,
			['sign', 'verify']
		);

		// Export private key to PKCS8 format
		const privateKeyDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
		const privateKeyPem = derToPem(privateKeyDer, 'PRIVATE KEY');

		// Export public key to SPKI format (used internally in createSelfSignedCertificate)
		await crypto.subtle.exportKey('spki', keyPair.publicKey);

		// Generate certificate using WebCrypto and ASN.1 encoding
		const certificate = await createSelfSignedCertificate(
			keyPair,
			{
				commonName,
				organization,
				country,
				state,
				locality
			},
			validityDays
		);

		return {
			privateKey: privateKeyPem,
			certificate: certificate
		};
	} catch (error) {
		throw new Error(`Failed to generate SSL certificate: ${error.message}`);
	}
}

/**
 * Convert DER buffer to PEM format
 * @param {ArrayBuffer} der - DER encoded data
 * @param {string} type - PEM header type
 * @returns {string} PEM formatted string
 */
export function derToPem(der, type) {
	const base64 = Buffer.from(der).toString('base64');
	const chunks = [];
	for (let i = 0; i < base64.length; i += 64) {
		chunks.push(base64.slice(i, i + 64));
	}
	return `-----BEGIN ${type}-----\n${chunks.join('\n')}\n-----END ${type}-----`;
}

/**
 * Create self-signed certificate using WebCrypto and ASN.1 encoding
 * @param {CryptoKeyPair} keyPair - RSA key pair
 * @param {Object} subject - Certificate subject fields
 * @param {string} subject.commonName - Common name
 * @param {string} subject.organization - Organization
 * @param {string} subject.country - Country
 * @param {string} subject.state - State
 * @param {string} subject.locality - Locality
 * @param {number} validityDays - Certificate validity in days
 * @returns {Promise<string>} PEM formatted certificate
 */
export async function createSelfSignedCertificate(keyPair, subject, validityDays) {
	// Create ASN.1 certificate structure
	const now = new Date();
	const notAfter = new Date(now.getTime() + (validityDays * 24 * 60 * 60 * 1000));

	// Generate random serial number (use smaller size to avoid encoding issues)
	const serialNumber = crypto.getRandomValues(new Uint8Array(8));



	// Export public key to SPKI format
	const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);

	// Debug: Check SPKI algorithm
	const spkiBytes = new Uint8Array(spki);
	console.log("SPKI total length:", spki.byteLength);
	console.log("SPKI bytes:", Array.from(spkiBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

	// Create TBS (To-Be-Signed) certificate structure
	const tbs = createTBSCertificate(
		serialNumber,
		subject,
		subject, // issuer same as subject for self-signed
		now,
		notAfter,
		spki
	);

	// Sign the TBS with private key
	const signature = await crypto.subtle.sign(
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		keyPair.privateKey,
		tbs
	);



	// Create final certificate structure
	const certificate = createCertificateStructure(tbs, signature);

	// Convert to PEM
	return derToPem(certificate, 'CERTIFICATE');
}

/**
 * Create TBS (To-Be-Signed) certificate structure
 * @param {Uint8Array} serialNumber - Certificate serial number
 * @param {Object} subject - Subject fields
 * @param {string} subject.commonName - Common name
 * @param {string} subject.organization - Organization
 * @param {string} subject.country - Country
 * @param {string} subject.state - State
 * @param {string} subject.locality - Locality
 * @param {Object} issuer - Issuer fields
 * @param {string} issuer.commonName - Common name
 * @param {string} issuer.organization - Organization
 * @param {string} issuer.country - Country
 * @param {string} issuer.state - State
 * @param {string} issuer.locality - Locality
 * @param {Date} notBefore - Validity start date
 * @param {Date} notAfter - Validity end date
 * @param {ArrayBuffer} publicKey - Public key in SPKI format
 * @returns {ArrayBuffer} DER encoded TBS certificate
 */
function createTBSCertificate(serialNumber, subject, issuer, notBefore, notAfter, publicKey) {
	// X.509 v3 certificate structure
	const version = encodeVersion();
	const subjectName = encodeName(subject);
	const issuerName = encodeName(issuer);
	const validity = encodeValidity(notBefore, notAfter);
	const subjectPublicKeyInfo = encodeSubjectPublicKeyInfo(publicKey);

	// Combine all components into TBS structure
	const tbsComponents = [
		version,
		encodeInteger(serialNumber),
		encodeSequence([encodeObjectIdentifier('1.2.840.113549.1.1.11'), encodeNull()]), // sha256WithRSAEncryption
		issuerName,
		validity,
		subjectName,
		subjectPublicKeyInfo
	];

	return encodeSequence(tbsComponents);
}

/**
 * Encode certificate name (subject/issuer)
 * @param {Object} name - Name fields
 * @param {string} name.commonName - Common name
 * @param {string} name.organization - Organization
 * @param {string} name.country - Country
 * @param {string} name.state - State
 * @param {string} name.locality - Locality
 * @returns {ArrayBuffer} DER encoded name
 */
function encodeName(name) {
	// X.509 name components should be in reverse order (most specific to least specific)
	const components = [
		{ type: 'CN', value: name.commonName },
		{ type: 'O', value: name.organization },
		{ type: 'L', value: name.locality },
		{ type: 'ST', value: name.state },
		{ type: 'C', value: name.country }
	];

	const encodedComponents = components.map(comp =>
		encodeSequence([
			encodeObjectIdentifier(getOidForType(comp.type)),
			encodePrintableString(comp.value)
		])
	);

	return encodeSequence(encodedComponents);
}

/**
 * Get OID for name type
 * @param {string} type - Name type
 * @returns {string} OID string
 */
export function getOidForType(type) {
	/** @type {Record<string, string>} */
	const oids = {
		'CN': '2.5.4.3',  // commonName
		'O': '2.5.4.10',  // organizationName
		'C': '2.5.4.6',   // countryName
		'ST': '2.5.4.8',  // stateOrProvinceName
		'L': '2.5.4.7'    // localityName
	};
	return oids[type] || '2.5.4.3';
}

/**
 * Encode validity period
 * @param {Date} notBefore - Start date
 * @param {Date} notAfter - End date
 * @returns {ArrayBuffer} DER encoded validity
 */
function encodeValidity(notBefore, notAfter) {
	return encodeSequence([
		encodeUTCTime(notBefore),
		encodeUTCTime(notAfter)
	]);
}

/**
 * Encode subject public key info
 * @param {ArrayBuffer} publicKey - Public key in SPKI format
 * @returns {ArrayBuffer} DER encoded subject public key info
 */
function encodeSubjectPublicKeyInfo(publicKey) {
	// According to RFC 3279 Section 2.3.1, we need to extract the raw RSA public key
	// and encode it as RSAPublicKey structure, then wrap it in BIT_STRING

	// Parse the SPKI to extract the raw RSA public key
	const spkiBytes = new Uint8Array(publicKey);

	// Find the BIT_STRING containing the RSA public key
	let offset = 0;

	// Skip outer SEQUENCE
	if (spkiBytes[offset] !== 0x30) throw new Error('Invalid SPKI structure');
	offset++;

	// Skip length
	if (spkiBytes[offset] & 0x80) {
		const numBytes = spkiBytes[offset] & 0x7F;
		offset += numBytes + 1;
	} else {
		offset++;
	}

	// Skip algorithm SEQUENCE
	if (spkiBytes[offset] !== 0x30) throw new Error('Invalid SPKI structure');
	offset++;

	// Skip algorithm length
	if (spkiBytes[offset] & 0x80) {
		const numBytes = spkiBytes[offset] & 0x7F;
		offset += numBytes + 1;
	} else {
		offset++;
	}

	// Skip algorithm OID and NULL
	while (offset < spkiBytes.length && spkiBytes[offset] !== 0x03) {
		offset++;
	}

	// Extract the BIT_STRING containing the RSA public key
	const bitStringBytes = spkiBytes.slice(offset);

	// The BIT_STRING contains the DER-encoded RSAPublicKey
	// We need to extract the actual RSA public key data (skip unused bits byte)
	const rsaPublicKeyData = bitStringBytes.slice(1); // Skip unused bits byte

	// The rsaPublicKeyData is already the RSAPublicKey structure that RFC 3279 requires
	// We can use it directly as the subjectPublicKey in a BIT_STRING

	// Create new subject public key info with correct algorithm
	const algorithm = encodeSequence([
		encodeObjectIdentifier('1.2.840.113549.1.1.1'), // rsaEncryption
		encodeNull()
	]);

	// The rsaPublicKeyData is already the correct RSAPublicKey structure
	// We need to wrap it in a BIT_STRING with 0 unused bits
	const subjectPublicKey = encodeBitString(rsaPublicKeyData.buffer);

	return encodeSequence([algorithm, subjectPublicKey]);
}

/**
 * Create final certificate structure
 * @param {ArrayBuffer} tbs - TBS certificate
 * @param {ArrayBuffer} signature - Signature value
 * @returns {ArrayBuffer} DER encoded certificate
 */
function createCertificateStructure(tbs, signature) {
	const signatureAlgorithm = encodeSequence([
		encodeObjectIdentifier('1.2.840.113549.1.1.11'), // sha256WithRSAEncryption
		encodeNull()
	]);

	// Signature should be encoded as BIT STRING with 0 unused bits
	const signatureValue = encodeBitString(signature);

	return encodeSequence([
		tbs, // TBS certificate (no extra wrapper)
		signatureAlgorithm,
		signatureValue
	]);
}

// Basic ASN.1 encoding functions (simplified)
/**
 * @param {ArrayBuffer[]} components
 * @returns {ArrayBuffer}
 */
export function encodeSequence(components) {
	const content = new Uint8Array(components.reduce((acc, comp) => acc + comp.byteLength, 0));
	let offset = 0;
	for (const comp of components) {
		content.set(new Uint8Array(comp), offset);
		offset += comp.byteLength;
	}
	return encodeTLV(0x30, content); // SEQUENCE tag
}

/**
 * @param {Uint8Array} value
 * @returns {ArrayBuffer}
 */
export function encodeInteger(value) {
	// Handle sign bit correctly for DER encoding
	let bytes = new Uint8Array(value);

	// If the first bit is 1, we need to add a leading zero byte
	// to ensure the integer is interpreted as positive
	if (bytes.length > 0 && (bytes[0] & 0x80) !== 0) {
		const newBytes = new Uint8Array(bytes.length + 1);
		newBytes[0] = 0;
		newBytes.set(bytes, 1);
		bytes = newBytes;
	}

	return encodeTLV(0x02, bytes); // INTEGER tag
}

/**
 * @param {string} oid
 * @returns {ArrayBuffer}
 */
export function encodeObjectIdentifier(oid) {
	const parts = oid.split('.').map(Number);
	let bytes = new Uint8Array([parts[0] * 40 + parts[1]]);
	for (let i = 2; i < parts.length; i++) {
		const part = parts[i];
		if (part < 128) {
			const newBytes = new Uint8Array(bytes.length + 1);
			newBytes.set(bytes);
			newBytes[bytes.length] = part;
			bytes = newBytes;
		} else {
			// Proper base-128 encoding for large numbers
			const encoded = [];
			let remaining = part;
			while (remaining > 0) {
				encoded.unshift(remaining & 0x7F);
				remaining = remaining >>> 7;
			}
			// Set continuation bit on all but last byte
			for (let j = 0; j < encoded.length - 1; j++) {
				encoded[j] |= 0x80;
			}
			const newBytes = new Uint8Array(bytes.length + encoded.length);
			newBytes.set(bytes);
			newBytes.set(encoded, bytes.length);
			bytes = newBytes;
		}
	}
	return encodeTLV(0x06, bytes); // OBJECT IDENTIFIER tag
}

/**
 * @param {string} value
 * @returns {ArrayBuffer}
 */
export function encodePrintableString(value) {
	const bytes = new TextEncoder().encode(value);
	return encodeTLV(0x13, bytes); // PrintableString tag
}

/**
 * @param {Date} date
 * @returns {ArrayBuffer}
 */
export function encodeUTCTime(date) {
	// UTCTime format: YYMMDDHHMMSSZ
	const year = date.getUTCFullYear() % 100; // Last 2 digits
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	const hour = String(date.getUTCHours()).padStart(2, '0');
	const minute = String(date.getUTCMinutes()).padStart(2, '0');
	const second = String(date.getUTCSeconds()).padStart(2, '0');

	const str = `${year.toString().padStart(2, '0')}${month}${day}${hour}${minute}${second}Z`;
	const bytes = new TextEncoder().encode(str);
	return encodeTLV(0x17, bytes); // UTCTime tag
}

/**
 * @returns {ArrayBuffer}
 */
export function encodeNull() {
	return encodeTLV(0x05, new Uint8Array(0)); // NULL tag
}

/**
 * Encode certificate version (v3 = version 2)
 * @returns {ArrayBuffer} DER encoded version
 */
export function encodeVersion() {
	// X.509 v3 = version 2 (0-based)
	const version = new Uint8Array([0x02]);
	return encodeTLV(0xA0, version); // Context-specific tag 0
}

/**
 * @param {ArrayBuffer} data
 * @returns {ArrayBuffer}
 */
export function encodeBitString(data) {
	const bytes = new Uint8Array(data.byteLength + 1);
	bytes[0] = 0; // unused bits
	bytes.set(new Uint8Array(data), 1);
	return encodeTLV(0x03, bytes); // BIT STRING tag
}

/**
 * @param {ArrayBuffer} data
 * @returns {ArrayBuffer}
 */
export function encodeOctetString(data) {
	const bytes = new Uint8Array(data);
	return encodeTLV(0x04, bytes); // OCTET STRING tag
}

/**
 * Encode basic certificate extensions
 * @returns {ArrayBuffer} DER encoded extensions
 */
export function encodeExtensions() {
	// Basic extensions: key usage and subject key identifier
	const keyUsage = encodeSequence([
		encodeObjectIdentifier('2.5.29.15'), // keyUsage
		encodeOctetString(encodeSequence([
			encodeBitString(new Uint8Array([0x03, 0x02, 0x05, 0xA0]).buffer) // digitalSignature, keyEncipherment
		]))
	]);

	const subjectKeyIdentifier = encodeSequence([
		encodeObjectIdentifier('2.5.29.14'), // subjectKeyIdentifier
		encodeOctetString(encodeOctetString(new Uint8Array([0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]).buffer))
	]);

	return encodeSequence([keyUsage, subjectKeyIdentifier]);
}

/**
 * @param {number} tag
 * @param {Uint8Array} value
 * @returns {ArrayBuffer}
 */
export function encodeTLV(tag, value) {
	const length = value.length;
	let lengthBytes;

	if (length < 128) {
		lengthBytes = new Uint8Array([length]);
	} else {
		// Convert length to big-endian bytes
		const bytes = [];
		let remaining = length;
		while (remaining > 0) {
			bytes.unshift(remaining & 0xFF);
			remaining = remaining >>> 8;
		}
		// Add length-of-length byte
		lengthBytes = new Uint8Array([0x80 | bytes.length, ...bytes]);
	}



	const result = new Uint8Array(1 + lengthBytes.length + value.length);
	result[0] = tag;
	result.set(lengthBytes, 1);
	result.set(value, 1 + lengthBytes.length);

	return result.buffer;
}
