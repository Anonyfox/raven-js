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
import { Context } from "@raven-js/wings";
import { findBlogPost } from "../../../collections/blog-posts.js";

/**
 * @typedef {import("../../../collections/blog-posts.js").BlogPost} BlogPost
 */

/**
 * @typedef {Object} BlogPostData
 * @property {BlogPost|null} post - Blog post from collection
 * @property {string} slug - Blog post slug
 */

/**
 * Load dynamic data for this page
 * @param {Context} ctx - Wings request context
 * @returns {Promise<BlogPostData>} Page data
 */
export async function loadDynamicData(ctx) {
	const { slug } = ctx.pathParams;
	const post = findBlogPost(slug);
	return { post, slug };
}

/**
 * Blog post title - dynamic from collection
 * @param {BlogPostData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page title
 */
export const title = async (data) => {
	return data.post?.title || "Blog Post Not Found";
};

/**
 * Blog post description - dynamic from collection
 * @param {BlogPostData} data - Data from loadDynamicData
 * @returns {Promise<string>} Page description
 */
export const description = async (data) => {
	return data.post?.description || "The requested blog post could not be found";
};

/**
 * Blog post content - dynamic from collection
 * @param {BlogPostData} data - Data from loadDynamicData
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
