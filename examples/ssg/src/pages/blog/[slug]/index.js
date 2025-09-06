/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Dynamic blog post page - uses loadDynamicData pattern
 */

import { md } from "@raven-js/beak";
import { findBlogPost } from "../../../collections/blog-posts.js";

/**
 * Load dynamic data for this page
 * @param {Object} ctx - Request context with pathParams
 * @returns {Promise<Object>} Page data
 */
export async function loadDynamicData(ctx) {
	const { slug } = ctx.pathParams;
	const post = findBlogPost(slug);
	return { post, slug };
}

/**
 * Blog post title - dynamic from collection
 * @param {Object} data - Data from loadDynamicData
 * @returns {Promise<string>} Page title
 */
export const title = async (data) => {
	return data.post?.title || "Blog Post Not Found";
};

/**
 * Blog post description - dynamic from collection
 * @param {Object} data - Data from loadDynamicData
 * @returns {Promise<string>} Page description
 */
export const description = async (data) => {
	return data.post?.description || "The requested blog post could not be found";
};

/**
 * Blog post content - dynamic from collection
 * @param {Object} data - Data from loadDynamicData
 * @returns {Promise<string>} Page body content
 */
export const body = async (data) => {
	if (!data.post) {
		return md`
# Blog Post Not Found

The blog post with slug **${data.slug}** could not be found.

[← Back to Blog](/blog)
		`;
	}

	return md`${data.post.content}`;
};
