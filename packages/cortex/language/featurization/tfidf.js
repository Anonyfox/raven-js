/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Incremental TF-IDF computation with merge-friendly state management.
 *
 * Provides stateful TF-IDF vectorization that can be incrementally updated
 * and merged across multiple instances. Reuses existing tokenization and
 * normalization functions for consistent text processing.
 */

import { foldCase, normalizeUnicode } from "../normalization/index.js";
import { tokenizeWords } from "../segmentation/tokenize-words.js";

/**
 * Incremental TF-IDF vectorizer with merge-friendly state.
 * Maintains document frequencies and supports both classical TF-IDF and BM25 scoring.
 */
export class TfIdfVectorizer {
	/**
	 * Creates a new TF-IDF vectorizer instance.
	 *
	 * @param {Object} options - Configuration options
	 * @param {boolean} [options.normalize=true] - Apply Unicode normalization
	 * @param {boolean} [options.lowercase=true] - Convert to lowercase
	 * @param {boolean} [options.useStemming=false] - Apply stemming (requires stemmer function)
	 * @param {Function} [options.stemmer] - Stemming function to apply to terms
	 */
	constructor(options = {}) {
		const {
			normalize = true,
			lowercase = true,
			useStemming = false,
			stemmer,
		} = options;

		this.options = {
			normalize,
			lowercase,
			useStemming,
			stemmer,
		};

		// Merge-friendly state: document frequencies and document count
		this.state = {
			df: new Map(), // Document frequency for each term
			docCount: 0, // Total number of documents processed
		};

		// Cache for document lengths (needed for BM25)
		/** @type {number[]} */
		this._docLengths = [];
		this._avgDocLength = 0;
	}

	/**
	 * Preprocesses text using the configured normalization pipeline.
	 *
	 * @param {string} text - Input text to preprocess
	 * @returns {string[]} Array of processed terms
	 */
	preprocessText(text) {
		if (typeof text !== "string") {
			throw new Error("Input must be a string");
		}

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
	 * Adds a document to the corpus and updates term frequencies.
	 *
	 * @param {string} document - Document text to add
	 * @returns {Object} Document term frequencies for this document
	 */
	addDocument(document) {
		const terms = this.preprocessText(document);
		const docTermFreqs = new Map();

		// Count term frequencies in this document
		for (const term of terms) {
			docTermFreqs.set(term, (docTermFreqs.get(term) || 0) + 1);
		}

		// Update document frequency counts
		for (const term of docTermFreqs.keys()) {
			this.state.df.set(term, (this.state.df.get(term) || 0) + 1);
		}

		// Update document count and length tracking
		this.state.docCount += 1;
		this._docLengths.push(terms.length);
		this._avgDocLength =
			this._docLengths.reduce((sum, len) => sum + len, 0) /
			this._docLengths.length;

		return Object.fromEntries(docTermFreqs);
	}

	/**
	 * Computes classical TF-IDF scores for a query against the corpus.
	 *
	 * @param {string} query - Query text
	 * @param {Object} options - Scoring options
	 * @param {boolean} [options.useSublinearTf=false] - Use log-scaled term frequency
	 * @returns {Map<string, number>} Term TF-IDF scores
	 */
	computeTfIdf(query, options = {}) {
		const { useSublinearTf = false } = options;
		const queryTerms = this.preprocessText(query);
		const termFreqs = new Map();
		const scores = new Map();

		// Count query term frequencies
		for (const term of queryTerms) {
			termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
		}

		// Calculate TF-IDF for each unique query term
		for (const [term, tf] of termFreqs) {
			const df = this.state.df.get(term) || 0;

			if (df === 0) {
				// Term not in corpus
				scores.set(term, 0);
				continue;
			}

			// Term frequency component
			const tfComponent = useSublinearTf ? 1 + Math.log(tf) : tf;

			// Inverse document frequency
			const idf = Math.log(this.state.docCount / df);

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
	 */
	computeBm25(query, options = {}) {
		const { k1 = 1.2, b = 0.75 } = options;
		const queryTerms = this.preprocessText(query);
		const termFreqs = new Map();
		const scores = new Map();

		// Count query term frequencies
		for (const term of queryTerms) {
			termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
		}

		// Calculate BM25 for each unique query term
		for (const [term, qtf] of termFreqs) {
			const df = this.state.df.get(term) || 0;

			if (df === 0) {
				scores.set(term, 0);
				continue;
			}

			// IDF component (same as TF-IDF)
			const idf = Math.log(this.state.docCount / df);

			// For BM25, we need to compute against a document length
			// Since we don't have specific document context, use average
			const docLength = this._avgDocLength;
			const normalizedTf =
				(qtf * (k1 + 1)) /
				(qtf + k1 * (1 - b + b * (docLength / this._avgDocLength)));

			scores.set(term, idf * normalizedTf);
		}

		return scores;
	}

	/**
	 * Merges another TF-IDF vectorizer's state into this one.
	 *
	 * @param {TfIdfVectorizer} other - Another vectorizer to merge
	 * @returns {TfIdfVectorizer} This vectorizer for chaining
	 */
	merge(other) {
		if (!(other instanceof TfIdfVectorizer)) {
			throw new Error("Can only merge with another TfIdfVectorizer instance");
		}

		// Merge document frequencies
		for (const [term, df] of other.state.df) {
			this.state.df.set(term, (this.state.df.get(term) || 0) + df);
		}

		// Merge document counts
		this.state.docCount += other.state.docCount;

		// Merge document lengths for BM25
		this._docLengths.push(...other._docLengths);
		if (this._docLengths.length > 0) {
			this._avgDocLength =
				this._docLengths.reduce((sum, len) => sum + len, 0) /
				this._docLengths.length;
		}

		return this;
	}

	/**
	 * Creates a new vectorizer from serializable state data.
	 *
	 * @param {Object} stateData - Serialized state
	 * @param {number} stateData.docCount - Document count
	 * @param {Array<[string, number]>} stateData.df - Document frequency entries
	 * @param {number[]} stateData.docLengths - Document lengths
	 * @param {Object} options - Vectorizer options
	 * @returns {TfIdfVectorizer} New vectorizer instance
	 */
	static fromState(stateData, options = {}) {
		const vectorizer = new TfIdfVectorizer(options);

		// Restore state
		vectorizer.state.docCount = stateData.docCount || 0;
		vectorizer.state.df = new Map(stateData.df || []);
		vectorizer._docLengths = stateData.docLengths || [];

		if (vectorizer._docLengths.length > 0) {
			vectorizer._avgDocLength =
				vectorizer._docLengths.reduce((sum, len) => sum + len, 0) /
				vectorizer._docLengths.length;
		}

		return vectorizer;
	}

	/**
	 * Exports the current state for serialization.
	 *
	 * @returns {Object} Serializable state data
	 */
	exportState() {
		return {
			docCount: this.state.docCount,
			df: Array.from(this.state.df.entries()),
			docLengths: this._docLengths,
		};
	}

	/**
	 * Gets vocabulary size (number of unique terms).
	 *
	 * @returns {number} Number of unique terms in vocabulary
	 */
	get vocabularySize() {
		return this.state.df.size;
	}

	/**
	 * Gets document count.
	 *
	 * @returns {number} Number of documents processed
	 */
	get documentCount() {
		return this.state.docCount;
	}
}
