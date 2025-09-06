/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shop products collection - Dataset container with composite keys
 */

import { Dataset } from "@raven-js/cortex/structures";

/**
 * @typedef {Object} Product
 * @property {string} category - Product category
 * @property {string} item - Product item ID
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {string} description - Product description
 * @property {string[]} [features] - Product features
 * @property {boolean} [inStock] - Stock status
 */

/**
 * Shop products data collection with O(1) composite key lookups
 * @type {Dataset<Product>}
 */
export const shopProducts = new Dataset(
	[
		{
			category: "electronics",
			item: "laptop",
			name: "RavenBook Pro",
			price: 1299,
			description: "High-performance laptop for developers",
			features: ["16GB RAM", "1TB SSD", "M2 Chip", "14-inch Retina Display"],
			inStock: true,
		},
		{
			category: "electronics",
			item: "smartphone",
			name: "RavenPhone X",
			price: 899,
			description: "Flagship smartphone with advanced features",
			features: [
				"6.7-inch OLED",
				"Triple Camera",
				"5G Ready",
				"All-day Battery",
			],
			inStock: true,
		},
		{
			category: "clothing",
			item: "t-shirt",
			name: "RavenJS Developer Tee",
			price: 29,
			description: "Comfortable cotton t-shirt for coding sessions",
			features: [
				"100% Cotton",
				"Preshrunk",
				"Tagless",
				"Available in 5 colors",
			],
			inStock: true,
		},
		{
			category: "books",
			item: "javascript-guide",
			name: "The Complete JavaScript Guide",
			price: 49,
			description: "Comprehensive guide to modern JavaScript",
			features: [
				"500+ Pages",
				"ES2024 Coverage",
				"Practical Examples",
				"Digital + Print",
			],
			inStock: true,
		},
	],
	{
		keyFn: (product) => `${product.category}/${product.item}`,
		urlFn: (product) => `/shop/${product.category}/${product.item}`,
	},
);

/**
 * Find product by category and item (O(1) lookup)
 * @param {string} category - Product category
 * @param {string} item - Product item ID
 * @returns {Product|undefined} Product or undefined if not found
 */
export const findProduct = (category, item) => {
	return shopProducts.get(`${category}/${item}`);
};

/**
 * Get products by category
 * @param {string} category - Product category
 * @returns {Product[]} Array of products in category
 */
export const getProductsByCategory = (category) => {
	return shopProducts.match({ category });
};

/**
 * Get all shop URLs for static generation
 * @returns {string[]} Array of shop product URLs
 */
export const getShopUrls = () => {
	return shopProducts.urls();
};

/**
 * Get all categories
 * @returns {string[]} Array of unique categories
 */
export const getCategories = () => {
	return shopProducts.pluck("category");
};
