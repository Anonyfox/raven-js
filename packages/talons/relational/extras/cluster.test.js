/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for cluster utilities
 */

import { ok, rejects, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { ClusterClient, createCluster } from "./cluster.js";

describe("createCluster", () => {
	it("creates cluster client", () => {
		const config = {
			nodes: [{ id: "node1", config: { driver: "pg", host: "localhost" } }],
		};

		const cluster = createCluster(config);
		ok(cluster instanceof ClusterClient);
	});

	it("throws on invalid configuration", () => {
		throws(() => createCluster({}), /At least one node/);
		throws(() => createCluster({ nodes: [] }), /At least one node/);
	});
});

describe("ClusterClient", () => {
	it("initializes with configuration", () => {
		const config = {
			nodes: [
				{ id: "node1", config: { driver: "pg", host: "localhost" } },
				{ id: "node2", config: { driver: "pg", host: "replica" } },
			],
			strategy: "round-robin",
			maxFailures: 3,
		};

		const cluster = new ClusterClient(config);

		strictEqual(cluster.config.strategy, "round-robin");
		strictEqual(cluster.config.maxFailures, 3);
		strictEqual(cluster.nodes.size, 2);
	});

	it("provides health status", () => {
		const config = {
			nodes: [{ id: "node1", config: { driver: "pg", host: "localhost" } }],
		};

		const cluster = new ClusterClient(config);
		const health = cluster.getHealth();

		strictEqual(typeof health.totalNodes, "number");
		strictEqual(typeof health.healthyNodes, "number");
		ok(Array.isArray(health.nodes));
	});

	it("handles query routing errors gracefully", async () => {
		const config = {
			nodes: [{ id: "node1", config: { driver: "pg", host: "nonexistent" } }],
		};

		const cluster = new ClusterClient(config);

		await rejects(
			() => cluster.query("SELECT 1"),
			(error) => error.message.includes("healthy"),
		);

		await cluster.close();
	});

	it("closes all connections", async () => {
		const config = {
			nodes: [{ id: "node1", config: { driver: "pg", host: "localhost" } }],
		};

		const cluster = new ClusterClient(config);
		await cluster.close(); // Should not throw
	});
});
