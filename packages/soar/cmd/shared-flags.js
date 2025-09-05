/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Shared flag definitions for Soar CLI commands.
 *
 * Provides consistent flag definitions across deploy, plan, and future commands.
 * Follows the provider-product naming convention (e.g., cf-workers, aws-lambda).
 */

export const COMMON_FLAGS = [
	{
		name: "verbose",
		type: "boolean",
		alias: "v",
		description: "Show detailed output",
	},
	{
		name: "auto-approve",
		type: "boolean",
		description: "Skip confirmation prompts",
	},
	{
		name: "export",
		type: "string",
		description: "Use named export from config file",
	},
];

export const ARTIFACT_FLAGS = [
	{
		name: "static",
		type: "string",
		description: "Deploy static files from path",
	},
	{
		name: "script",
		type: "string",
		description: "Deploy script bundle from path",
	},
	{ name: "binary", type: "string", description: "Deploy binary from path" },
];

export const CLOUDFLARE_FLAGS = [
	{
		name: "cf-workers",
		type: "string",
		description: "Deploy to Cloudflare Workers with script name",
	},
	{
		name: "cloudflare-workers",
		type: "string",
		description: "Deploy to Cloudflare Workers (alias for cf-workers)",
	},
	{ name: "cf-token", type: "string", description: "Cloudflare API token" },
	{ name: "cf-account", type: "string", description: "Cloudflare account ID" },
	{
		name: "cf-compatibility",
		type: "string",
		description: "Cloudflare compatibility date",
	},
];

export const AWS_FLAGS = [
	{
		name: "aws-lambda",
		type: "string",
		description: "Deploy to AWS Lambda function",
	},
	{ name: "aws-s3", type: "string", description: "Deploy to AWS S3 bucket" },
	{ name: "aws-region", type: "string", description: "AWS region" },
];

export const DIGITALOCEAN_FLAGS = [
	{
		name: "do-droplets",
		type: "string",
		description: "Deploy to DigitalOcean Droplet",
	},
	{
		name: "do-spaces",
		type: "string",
		description: "Deploy to DigitalOcean Spaces",
	},
	{ name: "do-token", type: "string", description: "DigitalOcean API token" },
];

export const ALL_DEPLOYMENT_FLAGS = [
	...COMMON_FLAGS,
	...ARTIFACT_FLAGS,
	...CLOUDFLARE_FLAGS,
	...AWS_FLAGS,
	...DIGITALOCEAN_FLAGS,
];
