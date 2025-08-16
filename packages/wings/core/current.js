/**
 * @typedef {((current: Current) => void | Promise<void>)} Handler
 */

/**
 * The **current** context of the http request/response.
 *
 * This class is a general abstraction over the HTTP lifecycle and is _isomorphic_.
 * This means it can also be used in the client/browser, not just in the server.
 *
 * It also supports registering callback functions that can be called before and after
 * the actual handler is called. This is useful for middleware.
 *
 * Most properties are also private and can be accessed via methods, in order to
 * ensure integrity and consistency, and to prevent common mistakes.
 */
export class Current {
	#requestHeaders = new Headers();

	/**
	 * HTTP Headers of the request.
	 *
	 * Note: All keys are lowercased to make working with it easier.
	 *
	 * Is set via the constructor and then hard freezed to prevent accidental
	 * modification later on. This allows safe exposure via a getter of the whole
	 * Headers object.
	 */
	get requestHeaders() {
		return this.#requestHeaders;
	}

	/**
	 * The unparsed body of the request, if existing.
	 *
	 * Note: All keys are lowercased to make working with it easier.
	 *
	 * @type {Buffer|null}
	 */
	#requestBody = null;

	/**
	 * The parsed body of the request, if existing.
	 * This is either a string, a Buffer, or an object, depending on the content-type.
	 * If the content-type is "application/json", it will be parsed as JSON.
	 * If the content-type is "application/x-www-form-urlencoded", it will be parsed as URLSearchParams.
	 * Otherwise, it will be a Buffer.
	 * If there is no body, this will be null.
	 *
	 * @returns {Buffer|Object|null}
	 */
	requestBody() {
		if (!this.#requestBody) return null;
		const ct = this.requestHeaders.get("content-type");
		if (ct.includes("application/json")) {
			return JSON.parse(this.#requestBody.toString("utf8"));
		}
		if (ct.includes("application/x-www-form-urlencoded")) {
			return Object.fromEntries(
				new URLSearchParams(this.#requestBody.toString("utf8")),
			);
		}
		return this.#requestBody;
	}

	/**
	 * named parameters and their respective values parsed from the URL path.
	 *
	 * Example: for a path `/users/:id` with the URL `/users/42`, this object
	 * would contain `{ "id": "42" }`.
	 *
	 * @type {Object.<string, string>}
	 */
	pathParams = {};

	#queryParams = new URLSearchParams();

	/**
	 * Query parameters parsed from the URL.
	 *
	 * Is set via the constructor and then hard freezed to prevent accidental
	 * modification later on. This allows safe exposure via a getter of the whole
	 * Headers object.
	 *
	 * @type {URLSearchParams}
	 */
	get queryParams() {
		return this.#queryParams;
	}

	#method = "";

	/**
	 * The HTTP method of the request. in UPPERCASE.
	 *
	 * @type {string}
	 */
	get method() {
		return this.#method;
	}

	#path = "";

	/**
	 * The URL path of the request. optional trailing slash is removed.
	 *
	 * @type {string}
	 */
	get path() {
		return this.#path;
	}

	/**
	 * HTTP Headers to send in the response.
	 *
	 * Note: All keys should be lowercased to make working with it easier.
	 */
	responseHeaders = new Headers();

	/**
	 * the body to return in the HTTP response.
	 *
	 * @type {string|Buffer|null}
	 */
	responseBody = null;

	/**
	 * the status code to return in the HTTP response.
	 */
	responseStatusCode = 200;

	/**
	 * Set to true when the response has been "sent".
	 *
	 * Either the handler has run and returned a response, or a middleware has
	 * set it directly. If this is true before the handler is called, the handler
	 * will not be called, and other "beforeCallbacks" are skipped, but
	 * "afterCallbacks" are still called.
	 */
	responseEnded = false;

	/**
	 * Custom data container to store intermediate stuff, can be used by
	 * before/after callbacks for state.
	 *
	 * @type {Object.<string, any>}
	 */
	data = {};

	/**
	 * List of functions to call before the handler is called (in order).
	 *
	 * Each function gets this current instance as the first argument and can modify it
	 * directly. Mutation is simply more performant than returning a new context.
	 *
	 * @type {Handler[]}
	 */
	#beforeCallbacks = [];

	/**
	 * Add a function to call before the handler is called. It is placed at the end of the
	 * existing list of beforeCallbacks.
	 *
	 * Will not be executed if the `responseEnded` flag is set to true.
	 *
	 * @param {Handler} callback
	 */
	addBeforeCallback(callback) {
		this.#beforeCallbacks.push(callback);
	}

	/**
	 * execute ALL beforeCallbacks in order.
	 *
	 * Note: this method is async and will wait for each callback to finish before
	 * proceeding to the next one. Executing a callback will remove it from the list
	 * (its "consumed").
	 *
	 * Protipp: it is possible for a callback to add _more_ callbacks _during_ its
	 * execution! This enables dynamic logic wizardry for callbacks instead of being
	 * strictly restricted to do a simple task.
	 *
	 */
	async runBeforeCallbacks() {
		while (this.#beforeCallbacks.length > 0) {
			const callback = this.#beforeCallbacks.shift();
			if (this.responseEnded) break;
			await callback(this);
		}
	}

	/**
	 * List of functions to call after the handler is called (in order).
	 *
	 * Each function gets this current instance as the first argument and can modify it
	 * directly. Mutation is simply more performant than returning a new context.
	 *
	 * Will not be executed if the `responseEnded` flag is set to true.
	 *
	 * @type {Handler[]}
	 */
	#afterCallbacks = [];

	/**
	 * Add a function to call before the handler is called. It is placed at the end of the
	 * existing list of beforeCallbacks.
	 *
	 * @param {Handler} callback
	 */
	addAfterCallback(callback) {
		this.#afterCallbacks.push(callback);
	}

	/**
	 * execute ALL afterCallbacks in order.
	 *
	 * Note: this method is async and will wait for each callback to finish after
	 * proceeding to the next one. Executing a callback will remove it from the list
	 * (its "consumed").
	 *
	 * Protipp: it is possible for a callback to add _more_ callbacks _during_ its
	 * execution! This enables dynamic logic wizardry for callbacks instead of being
	 * strictly restricted to do a simple task.
	 *
	 */
	async runAfterCallbacks() {
		while (this.#afterCallbacks.length > 0) {
			const callback = this.#afterCallbacks.shift();
			if (this.responseEnded) break;
			await callback(this);
		}
	}

	/**
	 * Create a new Current instance from the given request informations
	 *
	 * @param {string} method
	 * @param {URL} url - The URL object of the request, including path *and* query params
	 * @param {Headers} headers
	 * @param {Buffer|undefined} [body]
	 */
	constructor(method, url, headers, body) {
		// validate and set #method properly
		if (!method) throw new Error(`Method is required, got: ${method}`);
		this.#method = method;

		// validate and set #path properly
		const path = url.pathname;
		if (!path) throw new Error(`Path is required, got: ${path}`);
		this.#path = path;

		// set the query params and headers and freeze them to prevent nasty bugs
		this.#queryParams = Object.freeze(url.searchParams);
		this.#requestHeaders = Object.freeze(headers);

		// set the body if given
		if (body) this.#requestBody = body;
	}

	/**
	 * shortcut to send a 200 OK response with a text/plain body.
	 *
	 * @param {string} data
	 * @returns {void}
	 */
	text(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "text/plain");
		this.responseBody = data;
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
	}

	/**
	 * shortcut to send a 200 OK response with a text/html body.
	 *
	 * @param {string} data
	 * @returns {void}
	 */
	html(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "text/html");
		this.responseBody = data;
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
	}

	/**
	 * shortcut to send a 200 OK response with a application/xml body.
	 *
	 * @param {string} data
	 * @returns {void}
	 */
	xml(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "application/xml");
		this.responseBody = data;
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
	}

	/**
	 * shortcut to send a 200 OK response with a application/json body.
	 *
	 * @param {object} data
	 * @returns {void}
	 */
	json(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "application/json");
		this.responseBody = JSON.stringify(data);
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
	}

	/**
	 * shortcut to send a 200 OK response with a application/javascript body.
	 *
	 * @param {string} data
	 * @returns {void}
	 */
	js(data) {
		this.responseStatusCode = 200;
		this.responseHeaders.set("content-type", "application/javascript");
		this.responseBody = data;
		this.responseHeaders.set(
			"Content-Length",
			Buffer.byteLength(this.responseBody).toString(),
		);
	}

	/**
	 * Redirect the client to a different URL instead of sending a content response.
	 *
	 * @param {string} url
	 * @param {number} [status]
	 */
	redirect(url, status = 302) {
		this.responseStatusCode = status;
		this.responseHeaders.set("Location", url);
	}
}
