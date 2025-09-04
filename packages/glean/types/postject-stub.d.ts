/**
 * Clean TypeScript stub for postject to bypass broken package definitions
 * This overrides the problematic postject types with clean, working definitions
 */

declare module "postject" {
	/**
	 * Inject a resource into a binary executable
	 * @param filename - Path to the executable file
	 * @param resourceName - Name of the resource to inject
	 * @param resourceData - Binary data to inject
	 * @param options - Injection options
	 */
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
