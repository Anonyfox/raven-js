/**
 * Read the request body as a Buffer from an HTTP request stream.
 *
 * This function handles the complete lifecycle of reading a request body,
 * including data events, end events, and error events. It returns a Promise
 * that resolves to the body Buffer or undefined if no body data was received.
 *
 * @param {import('node:http').IncomingMessage} request - The HTTP request object
 * @returns {Promise<Buffer|undefined>} A Promise that resolves to the request body or undefined
 */
export async function readBody(request) {
	return new Promise((resolve) => {
		const bodyParts = /** @type {Buffer[]} */ ([]);

		request
			.on("data", (chunk) => {
				bodyParts.push(chunk);
			})
			.on("end", () => {
				if (bodyParts.length === 0) return resolve(undefined);
				const body = Buffer.concat(bodyParts);
				resolve(body);
			})
			.on("error", (err) => {
				console.error("Error reading request body:", err);
				resolve(undefined);
			});
	});
}
