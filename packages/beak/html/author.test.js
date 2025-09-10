/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { author } from "./author.js";

/**
 * @file Comprehensive test suite for progressive author markup generator.
 *
 * Tests all enhancement tiers, edge cases, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("author()", () => {
  describe("Tier 1: Basic Attribution", () => {
    it("should generate basic author meta tag", () => {
      const result = author({ name: "Anonyfox" });
      assert(result.includes('<meta name="author" content="Anonyfox" />'));
    });

    it("should add reply-to meta tag when email provided", () => {
      const result = author({ name: "Anonyfox", email: "test@example.com" });
      assert(result.includes('<meta name="reply-to" content="test@example.com" />'));
    });

    it("should return empty string when name is missing", () => {
      assert.strictEqual(author({}), "");
      assert.strictEqual(author({ email: "test@example.com" }), "");
    });

    it("should handle empty name string", () => {
      assert.strictEqual(author({ name: "" }), "");
    });
  });

  describe("Tier 2: Professional Identity", () => {
    it("should generate Person schema with jobTitle", () => {
      const result = author({
        name: "Anonyfox",
        jobTitle: "Senior Developer",
      });

      assert(result.includes('"jobTitle": "Senior Developer"'));
      assert(result.includes('"name": "Anonyfox"'));
      assert(result.includes('"Person"'));
    });

    it("should generate Person schema with organization", () => {
      const result = author({
        name: "Anonyfox",
        organization: "RavenJS",
      });

      assert(result.includes('"worksFor":'));
      assert(result.includes('"Organization"'));
      assert(result.includes('"name": "RavenJS"'));
    });

    it("should include email in Person schema when provided", () => {
      const result = author({
        name: "Anonyfox",
        email: "test@example.com",
        jobTitle: "Developer",
      });

      assert(result.includes('"email": "test@example.com"'));
    });

    it("should generate complete professional schema", () => {
      const result = author({
        name: "Anonyfox",
        email: "test@example.com",
        jobTitle: "Senior Developer",
        organization: "RavenJS",
        website: "https://anonyfox.com",
      });

      assert(result.includes('"jobTitle": "Senior Developer"'));
      assert(result.includes('"worksFor"'));
      assert(result.includes('"email": "test@example.com"'));
      assert(result.includes('"url": "https://anonyfox.com"'));
    });
  });

  describe("Tier 3: Social Platform Verification", () => {
    it("should generate GitHub verification link", () => {
      const result = author({
        name: "Anonyfox",
        profiles: { github: "https://github.com/Anonyfox" },
      });

      assert(result.includes('<link rel="me" href="https://github.com/Anonyfox" />'));
    });

    it("should generate Twitter verification link", () => {
      const result = author({
        name: "Anonyfox",
        profiles: { twitter: "https://twitter.com/anonyfox" },
      });

      assert(result.includes('<link rel="me" href="https://twitter.com/anonyfox" />'));
    });

    it("should generate LinkedIn verification link", () => {
      const result = author({
        name: "Anonyfox",
        profiles: { linkedin: "https://linkedin.com/in/anonyfox" },
      });

      assert(result.includes('<link rel="me" href="https://linkedin.com/in/anonyfox" />'));
    });

    it("should generate website author link", () => {
      const result = author({
        name: "Anonyfox",
        profiles: { website: "https://anonyfox.com" },
      });

      assert(result.includes('<link rel="author" href="https://anonyfox.com" />'));
    });

    it("should handle multiple social profiles", () => {
      const result = author({
        name: "Anonyfox",
        profiles: {
          github: "https://github.com/Anonyfox",
          twitter: "https://twitter.com/anonyfox",
          website: "https://anonyfox.com",
        },
      });

      assert(result.includes('rel="me" href="https://github.com/Anonyfox"'));
      assert(result.includes('rel="me" href="https://twitter.com/anonyfox"'));
      assert(result.includes('rel="author" href="https://anonyfox.com"'));
    });

    it("should handle empty profiles object", () => {
      const result = author({
        name: "Anonyfox",
        profiles: {},
      });

      assert(result.includes('<meta name="author" content="Anonyfox" />'));
      assert(!result.includes('rel="me"'));
    });
  });

  describe("Tier 4: Rich Profile", () => {
    it("should include bio in rich Person schema", () => {
      const result = author({
        name: "Anonyfox",
        bio: "Creator of RavenJS toolkit",
      });

      assert(result.includes('"description": "Creator of RavenJS toolkit"'));
      assert(result.includes("Person"));
    });

    it("should include photo in rich Person schema", () => {
      const result = author({
        name: "Anonyfox",
        photo: "/images/authors/anonyfox.jpg",
      });

      assert(result.includes('"image": "/images/authors/anonyfox.jpg"'));
    });

    it("should include bio in rich Person schema", () => {
      const result = author({
        name: "Anonyfox",
        bio: "Creator of RavenJS toolkit",
      });

      assert(result.includes('"description": "Creator of RavenJS toolkit"'));
    });

    it("should include location in rich Person schema", () => {
      const result = author({
        name: "Anonyfox",
        location: "Berlin, Germany",
      });

      assert(result.includes('"address"'));
      assert(result.includes('"PostalAddress"'));
      assert(result.includes('"addressLocality": "Berlin, Germany"'));
    });

    it("should include language in rich Person schema", () => {
      const result = author({
        name: "Anonyfox",
        language: "en",
      });

      assert(result.includes('"knowsLanguage": "en"'));
    });

    it("should include credentials as educational credentials", () => {
      const result = author({
        name: "Anonyfox",
        credentials: ["Google Developer Expert", "Node.js Contributor"],
      });

      assert(result.includes('"hasCredential"'));
      assert(result.includes('"EducationalOccupationalCredential"'));
      assert(result.includes('"Google Developer Expert"'));
      assert(result.includes('"Node.js Contributor"'));
    });

    it("should generate complete rich profile schema", () => {
      const result = author({
        name: "Anonyfox",
        email: "test@example.com",
        jobTitle: "Senior Developer",
        organization: "RavenJS",
        photo: "/images/authors/anonyfox.jpg",
        bio: "Creator of RavenJS toolkit",
        location: "Berlin, Germany",
        language: "en",
        credentials: ["Google Developer Expert"],
      });

      // Should contain all rich profile elements
      assert(result.includes('"image": "/images/authors/anonyfox.jpg"'));
      assert(result.includes('"description": "Creator of RavenJS toolkit"'));
      assert(result.includes('"addressLocality": "Berlin, Germany"'));
      assert(result.includes('"knowsLanguage": "en"'));
      assert(result.includes('"EducationalOccupationalCredential"'));
      assert(result.includes('"Google Developer Expert"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (basic + professional)", () => {
      const result = author({
        name: "Anonyfox",
        email: "test@example.com",
        jobTitle: "Developer",
      });

      assert(result.includes('<meta name="author" content="Anonyfox" />'));
      assert(result.includes('<meta name="reply-to" content="test@example.com" />'));
      assert(result.includes('"jobTitle": "Developer"'));
    });

    it("should handle Tier 1 + Tier 3 (basic + social)", () => {
      const result = author({
        name: "Anonyfox",
        profiles: { github: "https://github.com/Anonyfox" },
      });

      assert(result.includes('<meta name="author" content="Anonyfox" />'));
      assert(result.includes('rel="me" href="https://github.com/Anonyfox"'));
    });

    it("should handle Tier 2 + Tier 3 (professional + social)", () => {
      const result = author({
        name: "Anonyfox",
        jobTitle: "Developer",
        organization: "RavenJS",
        profiles: { twitter: "https://twitter.com/anonyfox" },
      });

      assert(result.includes('"jobTitle": "Developer"'));
      assert(result.includes('"worksFor"'));
      assert(result.includes('rel="me" href="https://twitter.com/anonyfox"'));
    });

    it("should handle all tiers combined", () => {
      const result = author({
        name: "Anonyfox",
        email: "test@example.com",
        jobTitle: "Senior Developer",
        organization: "RavenJS",
        profiles: {
          github: "https://github.com/Anonyfox",
          twitter: "https://twitter.com/anonyfox",
        },
        photo: "/images/authors/anonyfox.jpg",
        bio: "Creator of RavenJS toolkit",
        location: "Berlin, Germany",
        credentials: ["Google Developer Expert"],
      });

      // Should contain elements from all tiers
      assert(result.includes('<meta name="author" content="Anonyfox" />'));
      assert(result.includes('<meta name="reply-to" content="test@example.com" />'));
      assert(result.includes('"jobTitle": "Senior Developer"'));
      assert(result.includes('rel="me" href="https://github.com/Anonyfox"'));
      assert(result.includes('"image": "/images/authors/anonyfox.jpg"'));
      assert(result.includes('"addressLocality": "Berlin, Germany"'));
      assert(result.includes('"EducationalOccupationalCredential"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined config", () => {
      assert.strictEqual(author(undefined), "");
    });

    it("should handle null config", () => {
      assert.strictEqual(author(null), "");
    });

    it("should handle malformed profiles object", () => {
      const result = author({
        name: "Anonyfox",
        profiles: null,
      });

      assert(result.includes('<meta name="author" content="Anonyfox" />'));
    });

    it("should handle invalid profile URLs gracefully", () => {
      const result = author({
        name: "Anonyfox",
        profiles: { github: "invalid-url" },
      });

      assert(result.includes('<link rel="me" href="invalid-url" />'));
    });

    it("should handle empty credentials array", () => {
      const result = author({
        name: "Anonyfox",
        credentials: [],
      });

      assert(result.includes('<meta name="author" content="Anonyfox" />'));
      assert(!result.includes('"hasCredential"'));
    });

    it("should handle special characters in name", () => {
      const result = author({ name: "José María O'Connor" });
      assert(result.includes('content="José María O\'Connor"'));
    });

    it("should handle very long bio gracefully", () => {
      const longBio = "A".repeat(500);
      const result = author({
        name: "Anonyfox",
        bio: longBio,
      });

      assert(result.includes(longBio));
    });
  });

  describe("Schema Validation", () => {
    it("should generate valid JSON-LD structure", () => {
      const result = author({
        name: "Anonyfox",
        jobTitle: "Developer",
      });

      // Extract JSON-LD from script tags
      const jsonLdMatch = result.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      assert(jsonLdMatch);

      const jsonContent = jsonLdMatch[1].trim();
      const schema = JSON.parse(jsonContent);

      assert.strictEqual(schema["@context"], "https://schema.org");
      assert.strictEqual(schema["@type"], "Person");
      assert.strictEqual(schema.name, "Anonyfox");
      assert.strictEqual(schema.jobTitle, "Developer");
    });

    it("should generate valid rich profile schema", () => {
      const result = author({
        name: "Anonyfox",
        photo: "/image.jpg",
        location: "Berlin",
        credentials: ["Expert"],
      });

      const jsonLdMatch = result.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      assert(jsonLdMatch);

      const jsonContent = jsonLdMatch[1].trim();
      const schema = JSON.parse(jsonContent);

      assert(schema.image);
      assert(schema.address);
      assert(schema.hasCredential);
      assert(Array.isArray(schema.hasCredential));
    });
  });
});
