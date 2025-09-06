/**
 * Type stub for postject module
 * @see {@link https://github.com/nodejs/postject}
 */

declare module "postject" {
	export function inject(
		filename: string,
		resourceName: string,
		resourceData: Buffer,
		options?: {
			sentinelFuse?: string;
			machoSegmentName?: string;
		}
	): Promise<void>;
}
