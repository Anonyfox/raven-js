/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shop products collection - pure data export
 */

/**
 * Shop products data collection
 * @type {Array<{category: string, item: string, name: string, price: number, description: string, features?: string[], inStock?: boolean}>}
 */
export const shopProducts = [
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
		features: ["6.7-inch OLED", "Triple Camera", "5G Ready", "All-day Battery"],
		inStock: true,
	},
	{
		category: "clothing",
		item: "t-shirt",
		name: "RavenJS Developer Tee",
		price: 29,
		description: "Comfortable cotton t-shirt for coding sessions",
		features: ["100% Cotton", "Preshrunk", "Tagless", "Available in 5 colors"],
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
];

/**
 * Find product by category and item
 * @param {string} category - Product category
 * @param {string} item - Product item ID
 * @returns {Object|null} Product or null if not found
 */
export const findProduct = (category, item) => {
	return (
		shopProducts.find(
			(product) => product.category === category && product.item === item,
		) || null
	);
};

/**
 * Get products by category
 * @param {string} category - Product category
 * @returns {Object[]} Array of products in category
 */
export const getProductsByCategory = (category) => {
	return shopProducts.filter((product) => product.category === category);
};

/**
 * Get all shop URLs for static generation
 * @returns {string[]} Array of shop product URLs
 */
export const getShopUrls = () => {
	return shopProducts.map(
		(product) => `/shop/${product.category}/${product.item}`,
	);
};

/**
 * Get all categories
 * @returns {string[]} Array of unique categories
 */
export const getCategories = () => {
	return [...new Set(shopProducts.map((product) => product.category))];
};
