/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file TF-IDF (Term Frequency-Inverse Document Frequency) model for text relevance ranking.
 *
 * A machine learning model that learns which terms are most characteristic of
 * documents to rank query relevance. Simple API returns ranked terms by default.
 */

import { foldCase, normalizeUnicode } from "../language/normalization/index.js";
import { tokenizeWords } from "../language/segmentation/tokenize-words.js";
import { Model } from "./model.js";

/**
 * TF-IDF model for learning document term importance and ranking query relevance.
 *
 * Train on a document corpus, then get relevant terms for any query ranked by TF-IDF scores.
 * Designed for common use cases: returns ranked string arrays by default, with advanced options available.
 *
 * @example
 * // Simple usage - train and get ranked terms
 * const tfidf = new Tfidf();
 * tfidf.train([
 *   'Machine learning revolutionizes technology',
 *   'Artificial intelligence powers modern apps',
 *   'Data science drives business decisions'
 * ]);
 *
 * const relevantTerms = tfidf.predict('machine learning apps');
 * console.log(relevantTerms); // ['machine', 'learning', 'apps', ...] - ready to use!
 *
 * @example
 * // Advanced usage - get scores for power users
 * const results = tfidf.predict('AI technology', { includeScores: true });
 * console.log(results); // [{term: 'technology', score: 2.3}, {term: 'ai', score: 1.8}]
 *
 * @example
 * // Incremental training for streaming data
 * const tfidf = new Tfidf();
 * tfidf.trainDocument('First document about cats');
 * tfidf.trainDocument('Second document about dogs');
 * const terms = tfidf.predict('pet animals');
 *
 * @example
 * // Model serialization and restoration
 * const modelData = tfidf.toJSON();
 * const restored = Tfidf.fromJSON(modelData);
 * console.log(restored.predict('search query')); // Same results
 */
export class Tfidf extends Model {
	/**
	 * Create a new TF-IDF model with text preprocessing options.
	 *
	 * @param {Object} options - Configuration options
	 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
	 * @param {boolean} [options.lowercase=true] - Convert to lowercase
	 * @param {boolean} [options.useStemming=false] - Apply stemming (requires stemmer function)
	 * @param {Function} [options.stemmer] - Stemming function to apply to terms
	 */
	constructor(options = {}) {
		super();

		this.options = {
			normalize: options.normalize ?? true,
			lowercase: options.lowercase ?? true,
			useStemming: options.useStemming ?? false,
			stemmer: options.stemmer,
		};

		// Model state - automatically serialized by Model base class
		/** @type {Map<string, number>} Document frequency for each term */
		this.documentFrequencies = new Map();
		/** @type {number} Total number of documents processed */
		this.documentCount = 0;
		/** @type {number[]} Document lengths for BM25 calculation */
		this.documentLengths = [];
		/** @type {number} Average document length for BM25 */
		this.averageDocumentLength = 0;
	}

	/**
	 * Train the model on a document corpus.
	 * Learns term frequencies across documents for relevance ranking.
	 *
	 * @param {string[]} documents - Array of document texts
	 * @returns {this} For method chaining
	 *
	 * @example
	 * tfidf.train(['Doc 1 text', 'Doc 2 text', 'Doc 3 text']);
	 */
	train(documents) {
		if (!Array.isArray(documents) || documents.length === 0) {
			throw new Error("Training requires a non-empty array of documents");
		}

		for (const document of documents) {
			this.trainDocument(document);
		}

		this._markTrained();
		return this;
	}

	/**
	 * Add a single document to training (incremental learning).
	 * Perfect for streaming data where documents arrive over time.
	 *
	 * @param {string} document - Document text
	 * @returns {this} For method chaining
	 *
	 * @example
	 * tfidf.trainDocument('Breaking: AI breakthrough announced');
	 * tfidf.trainDocument('Tech stocks rise after AI news');
	 */
	trainDocument(document) {
		if (typeof document !== "string") {
			throw new Error("Document must be a string");
		}

		const terms = this._preprocessText(document);
		const termFreqs = new Map();

		// Count term frequencies in this document
		for (const term of terms) {
			termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
		}

		// Update global document frequency counts
		for (const term of termFreqs.keys()) {
			this.documentFrequencies.set(
				term,
				(this.documentFrequencies.get(term) || 0) + 1,
			);
		}

		// Update document statistics
		this.documentCount += 1;
		this.documentLengths.push(terms.length);
		this.averageDocumentLength =
			this.documentLengths.reduce((sum, len) => sum + len, 0) /
			this.documentLengths.length;

		// Mark as trained after first document
		if (this.documentCount === 1) {
			this._markTrained();
		}

		return this;
	}

	/**
	 * Get relevant terms for a query, ranked by TF-IDF relevance.
	 *
	 * Common case: Returns string array of ranked terms ready for immediate use.
	 * Advanced case: Can return term-score objects when scores are needed.
	 *
	 * @param {string} query - Query text to find relevant terms for
	 * @param {Object} [options] - Prediction options
	 * @param {number} [options.maxTerms=10] - Maximum terms to return
	 * @param {number} [options.minScore=0] - Minimum relevance score threshold
	 * @param {boolean} [options.includeScores=false] - Return scores with terms
	 * @param {boolean} [options.useBM25=false] - Use BM25 instead of classic TF-IDF
	 * @param {boolean} [options.useSublinearTf=false] - Use log-scaled term frequency
	 * @param {number} [options.k1=1.2] - BM25 term frequency saturation parameter
	 * @param {number} [options.b=0.75] - BM25 document length normalization parameter
	 * @returns {string[]|Array<{term: string, score: number}>} Ranked terms or term-score pairs
	 *
	 * @example
	 * // Simple usage - get ranked terms
	 * const terms = tfidf.predict('artificial intelligence');
	 * console.log(terms); // ['artificial', 'intelligence', 'ai', ...]
	 *
	 * @example
	 * // Advanced usage - get scores and limit results
	 * const results = tfidf.predict('machine learning', {
	 *   maxTerms: 5,
	 *   includeScores: true,
	 *   minScore: 0.1
	 * });
	 * console.log(results); // [{term: 'machine', score: 2.1}, ...]
	 */
	predict(query, options = {}) {
		this._validateTrained();

		if (typeof query !== "string") {
			throw new Error("Query must be a string");
		}

		const {
			maxTerms = 10,
			minScore = 0,
			includeScores = false,
			useBM25 = false,
			useSublinearTf = false,
			k1 = 1.2,
			b = 0.75,
		} = options;

		// Compute scores using requested algorithm
		const scores = useBM25
			? this._computeBM25(query, { k1, b })
			: this._computeTfIdf(query, { useSublinearTf });

		// Sort by score descending and apply filters
		const rankedResults = Array.from(scores.entries())
			.filter(([, score]) => score >= minScore)
			.sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
			.slice(0, maxTerms);

		// Return format based on user preference
		if (includeScores) {
			return rankedResults.map(([term, score]) => ({ term, score }));
		} else {
			return rankedResults.map(([term]) => term);
		}
	}

	/**
	 * Get BM25 relevance ranking (alternative to TF-IDF).
	 * Convenience method that uses BM25 algorithm by default.
	 *
	 * @param {string} query - Query text
	 * @param {Object} [options] - Same options as predict()
	 * @returns {string[]|Array<{term: string, score: number}>} Ranked terms
	 *
	 * @example
	 * const terms = tfidf.predictBM25('search query');
	 * console.log(terms); // BM25-ranked terms
	 */
	predictBM25(query, options = {}) {
		return this.predict(query, { ...options, useBM25: true });
	}

	/**
	 * Get model statistics for introspection and debugging.
	 *
	 * @returns {Object} Model statistics
	 * @example
	 * const stats = tfidf.getStats();
	 * console.log(`Vocabulary: ${stats.vocabularySize} terms, ${stats.documentCount} docs`);
	 */
	getStats() {
		return {
			vocabularySize: this.documentFrequencies.size,
			documentCount: this.documentCount,
			averageDocumentLength: this.averageDocumentLength,
			trained: this._trained,
		};
	}

	/**
	 * Preprocesses text using the configured normalization pipeline.
	 *
	 * @param {string} text - Input text to preprocess
	 * @returns {string[]} Array of processed terms
	 * @private
	 */
	_preprocessText(text) {
		let processedText = text;

		// Apply normalization pipeline
		if (this.options.normalize) {
			processedText = normalizeUnicode(processedText);
		}

		if (this.options.lowercase) {
			processedText = foldCase(processedText);
		}

		// Tokenize using our hardened function
		let terms = tokenizeWords(processedText);

		// Apply stemming if configured
		if (this.options.useStemming && this.options.stemmer) {
			terms = terms.map((term) => this.options.stemmer(term));
		}

		return terms;
	}

	/**
	 * Computes classical TF-IDF scores for a query against the corpus.
	 *
	 * @param {string} query - Query text
	 * @param {Object} options - Scoring options
	 * @param {boolean} [options.useSublinearTf=false] - Use log-scaled term frequency
	 * @returns {Map<string, number>} Term TF-IDF scores
	 * @private
	 */
	_computeTfIdf(query, options = {}) {
		const { useSublinearTf = false } = options;
		const queryTerms = this._preprocessText(query);
		const termFreqs = new Map();
		const scores = new Map();

		// Count query term frequencies
		for (const term of queryTerms) {
			termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
		}

		// Calculate TF-IDF for each unique query term
		for (const [term, tf] of termFreqs) {
			const df = this.documentFrequencies.get(term) || 0;

			if (df === 0) {
				// Term not in corpus
				scores.set(term, 0);
				continue;
			}

			// Term frequency component
			const tfComponent = useSublinearTf ? 1 + Math.log(tf) : tf;

			// Inverse document frequency
			const idf = Math.log(this.documentCount / df);

			// Combined TF-IDF score
			scores.set(term, tfComponent * idf);
		}

		return scores;
	}

	/**
	 * Computes BM25 scores for a query against the corpus.
	 *
	 * @param {string} query - Query text
	 * @param {Object} options - BM25 parameters
	 * @param {number} [options.k1=1.2] - Term frequency saturation parameter
	 * @param {number} [options.b=0.75] - Document length normalization parameter
	 * @returns {Map<string, number>} Term BM25 scores
	 * @private
	 */
	_computeBM25(query, options = {}) {
		const { k1 = 1.2, b = 0.75 } = options;
		const queryTerms = this._preprocessText(query);
		const termFreqs = new Map();
		const scores = new Map();

		// Count query term frequencies
		for (const term of queryTerms) {
			termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
		}

		// Calculate BM25 for each unique query term
		for (const [term, qtf] of termFreqs) {
			const df = this.documentFrequencies.get(term) || 0;

			if (df === 0) {
				scores.set(term, 0);
				continue;
			}

			// IDF component (same as TF-IDF)
			const idf = Math.log(this.documentCount / df);

			// For BM25, we need to compute against a document length
			// Since we don't have specific document context, use average
			const docLength = this.averageDocumentLength;
			const normalizedTf =
				(qtf * (k1 + 1)) /
				(qtf + k1 * (1 - b + b * (docLength / this.averageDocumentLength)));

			scores.set(term, idf * normalizedTf);
		}

		return scores;
	}

	/**
	 * Create a new Tfidf instance from serialized state.
	 * Restores the complete model including all training data and parameters.
	 *
	 * @param {Record<string, any>} json - The serialized model state
	 * @returns {Tfidf} A new Tfidf instance
	 * @throws {Error} If the serialized data is invalid
	 *
	 * @example
	 * const modelData = JSON.parse(jsonString);
	 * const model = Tfidf.fromJSON(modelData);
	 * console.log(model.predict('query')); // Ready to use
	 */
	static fromJSON(json) {
		/** @type {Tfidf} */
		const result = /** @type {Tfidf} */ (Model.fromJSON(json, Tfidf));

		// Restore Map from serialized entries
		if (
			result.documentFrequencies &&
			Array.isArray(result.documentFrequencies)
		) {
			result.documentFrequencies = new Map(result.documentFrequencies);
		}

		return result;
	}

	/**
	 * Serialize the model state to a JSON-friendly object.
	 * Converts Map to array for JSON serialization.
	 *
	 * @returns {Object} The serialized model state
	 */
	toJSON() {
		const result = super.toJSON();

		// Convert Map to array for JSON serialization
		if (this.documentFrequencies instanceof Map) {
			// @ts-expect-error - result has dynamic properties from super.toJSON()
			result.documentFrequencies = Array.from(
				this.documentFrequencies.entries(),
			);
		}

		return result;
	}
}
