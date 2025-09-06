/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shop product page - uses loadDynamicData pattern
 */

import { md } from "@raven-js/beak";
import { Context } from "@raven-js/wings";
import { findProduct } from "../../../../collections/shop-products.js";

/**
 * @typedef {import("../../../../collections/shop-products.js").Product} Product
 */

/**
 * @typedef {Object} ShopData
 * @property {Product|null} product - Product from collection
 * @property {string} category - Product category
 * @property {string} item - Product item ID
 */

/**
 * Load dynamic data for this page
 * @param {Context} ctx - Wings request context
 * @returns {Promise<ShopData>} Page data
 */
export async function loadDynamicData(ctx) {
	const { category, item } = ctx.pathParams;
	const product = findProduct(category, item);
	return { product, category, item };
}

/**
 * Product title - dynamic from collection
 * @param {ShopData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page title
 */
export const title = async (data) => {
	return data.product?.name || "Product Not Found";
};

/**
 * Product description - dynamic from collection
 * @param {ShopData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page description
 */
export const description = async (data) => {
	return (
		data.product?.description || "The requested product could not be found"
	);
};

/**
 * Product content - dynamic from collection
 * @param {ShopData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page body content
 */
export const body = async (data) => {
	if (!data.product) {
		return md`
# Product Not Found

The product **${data.category}/${data.item}** could not be found.

[← Back to Shop](/shop)
		`;
	}

	const { product } = data;

	return md`
# ${product.name}

${product.description}

## Details

- **Category**: ${product.category}
- **Price**: $${product.price}
- **In Stock**: ${product.inStock ? "✅ Yes" : "❌ No"}

## Features

${product.features?.map((feature) => `- ${feature}`).join("\n") || "No features listed"}

---

*Part of our ${product.category} collection*
	`;
};
