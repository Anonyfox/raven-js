/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for @raven-js/eye main module
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { apis, assets, dns, http, intel, security, tech } from "./index.js";

describe("@raven-js/eye", () => {
  it("exports dns module with all functions", () => {
    strictEqual(typeof dns, "object");
    strictEqual(typeof dns.getAllRecords, "function");
    strictEqual(typeof dns.findSubdomains, "function");
    strictEqual(typeof dns.getHostingInfo, "function");
    strictEqual(typeof dns.getEmailConfig, "function");
  });

  it("exports http module with all functions", () => {
    strictEqual(typeof http, "object");
    strictEqual(typeof http.getServerHeaders, "function");
    strictEqual(typeof http.getSecurityHeaders, "function");
    strictEqual(typeof http.analyzeCookies, "function");
    strictEqual(typeof http.detectInfrastructure, "function");
    strictEqual(typeof http.measureTiming, "function");
    strictEqual(typeof http.getTLSInfo, "function");
  });

  it("exports security module with all functions", () => {
    strictEqual(typeof security, "object");
    strictEqual(typeof security.findExposedFiles, "function");
    strictEqual(typeof security.findDebugArtifacts, "function");
    strictEqual(typeof security.mapAttackSurface, "function");
    strictEqual(typeof security.analyzeAuthentication, "function");
    strictEqual(typeof security.findSecurityIssues, "function");
  });

  it("exports tech module with all functions", () => {
    strictEqual(typeof tech, "object");
    strictEqual(typeof tech.detectStack, "function");
    strictEqual(typeof tech.detectPlatforms, "function");
    strictEqual(typeof tech.analyzeFrontend, "function");
    strictEqual(typeof tech.detectInfrastructure, "function");
    strictEqual(typeof tech.getAllTechnologies, "function");
  });

  it("exports assets module with all functions", () => {
    strictEqual(typeof assets, "object");
    strictEqual(typeof assets.getAllAssets, "function");
    strictEqual(typeof assets.calculateSizes, "function");
    strictEqual(typeof assets.findDependencies, "function");
    strictEqual(typeof assets.getDiscoveryFiles, "function");
  });

  it("exports apis module with all functions", () => {
    strictEqual(typeof apis, "object");
    strictEqual(typeof apis.findEndpoints, "function");
    strictEqual(typeof apis.detectAPIType, "function");
    strictEqual(typeof apis.analyzeGraphQL, "function");
    strictEqual(typeof apis.findWebSockets, "function");
    strictEqual(typeof apis.detectAuthentication, "function");
  });

  it("exports intel module with all functions", () => {
    strictEqual(typeof intel, "object");
    strictEqual(typeof intel.fullRecon, "function");
    strictEqual(typeof intel.securityAudit, "function");
    strictEqual(typeof intel.techAnalysis, "function");
    strictEqual(typeof intel.competitiveIntel, "function");
    strictEqual(typeof intel.quickScan, "function");
  });
});
