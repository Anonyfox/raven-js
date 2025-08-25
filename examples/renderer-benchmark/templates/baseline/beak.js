import { html } from "@raven-js/beak/html";

/**
 * Baseline static string template for Beak
 * Measures pure engine overhead without data complexity
 */
export const renderBaselineString = () => html`
	<div>
		<h1>Static Benchmark Test</h1>
		<p>This is a static string to measure template engine overhead.</p>
		<span>No dynamic data processing involved.</span>
	</div>
`;
