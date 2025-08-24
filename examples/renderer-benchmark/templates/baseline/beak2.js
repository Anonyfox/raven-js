import { html2 as html } from "@raven-js/beak/core/html2";

/**
 * Baseline static string template for Beak2 (HTML2)
 * Measures pure engine overhead without data complexity
 */
export const renderBaselineString = () => html`
	<div>
		<h1>Static Benchmark Test</h1>
		<p>This is a static string to measure template engine overhead.</p>
		<span>No dynamic data processing involved.</span>
	</div>
`;
