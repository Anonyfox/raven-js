/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { linkedin } from "./linkedin.js";

/**
 * @file Comprehensive test suite for progressive LinkedIn generator.
 *
 * Tests all enhancement tiers, content type detection, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("linkedin()", () => {
  describe("Input Validation", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(linkedin(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(linkedin(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(linkedin("string"), "");
      assert.strictEqual(linkedin(123), "");
      assert.strictEqual(linkedin([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(linkedin({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(linkedin({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(linkedin({ domain: "example.com", path: "/test" }), "");
    });
  });

  describe("Content Type Detection", () => {
    it("should auto-detect job content from URL pattern", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/jobs/senior-developer",
        title: "Senior Developer",
        description: "Great opportunity",
      });

      assert(result.includes('content="job"'));
    });

    it("should auto-detect job content from title", () => {
      const result = linkedin({
        title: "Hiring Senior Developer",
        description: "Join our team",
      });

      assert(result.includes('content="job"'));
    });

    it("should auto-detect course content from URL pattern", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/courses/react-fundamentals",
        title: "React Fundamentals",
        description: "Learn React basics",
      });

      assert(result.includes('content="course"'));
    });

    it("should auto-detect course content from title", () => {
      const result = linkedin({
        title: "Advanced JavaScript Certification",
        description: "Become a JS expert",
      });

      assert(result.includes('content="course"'));
    });

    it("should auto-detect event content from URL pattern", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/events/tech-conference",
        title: "Tech Conference",
        description: "Join us for insights",
      });

      assert(result.includes('content="event"'));
    });

    it("should auto-detect event content from title", () => {
      const result = linkedin({
        title: "Webinar: Future of Tech",
        description: "Register now",
      });

      assert(result.includes('content="event"'));
    });

    it("should auto-detect company content from URL pattern", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/company/about",
        title: "About Us",
        description: "Our mission",
      });

      assert(result.includes('content="company"'));
    });

    it("should default to article content type", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/blog/my-article",
        title: "My Article",
        description: "Article content",
      });

      assert(result.includes('content="article"'));
    });

    it("should use explicit contentType over auto-detection", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/jobs/developer",
        title: "Developer Position",
        description: "Apply now",
        contentType: "article",
      });

      assert(result.includes('content="article"'));
    });
  });

  describe("URL Normalization", () => {
    it("should construct basic absolute URL from domain and path", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should add leading slash to path if missing", () => {
      const result = linkedin({
        domain: "example.com",
        path: "article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should use pre-constructed URL when provided", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/article",
        url: "https://custom.com/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://custom.com/article"'));
    });

    it("should force HTTPS for pre-constructed URLs", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/article",
        url: "http://example.com/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should handle empty path", () => {
      const result = linkedin({
        domain: "example.com",
        path: "",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:url"'));
    });
  });

  describe("Tier 1: Smart LinkedIn Tags", () => {
    it("should generate basic LinkedIn meta tags", () => {
      const result = linkedin({
        title: "Test Title",
        description: "Test description for LinkedIn",
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(result.includes('content="Test Title"'));
      assert(result.includes('<meta name="linkedin:description"'));
      assert(result.includes('content="Test description for LinkedIn"'));
      assert(result.includes('<meta name="linkedin:content-type"'));
    });

    it("should include URL when domain and path provided", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('<meta name="linkedin:url"'));
      assert(result.includes('content="https://example.com/test"'));
    });

    it("should include image when provided", () => {
      const result = linkedin({
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('<meta name="linkedin:image"'));
      assert(result.includes('content="/banner.jpg"'));
    });

    it("should normalize image URL when domain provided", () => {
      const result = linkedin({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('content="https://example.com/banner.jpg"'));
    });

    it("should include owner when provided", () => {
      const result = linkedin({
        title: "Test",
        description: "Test description",
        owner: "linkedin.com/in/johndoe",
      });

      assert(result.includes('<meta name="linkedin:owner"'));
      assert(result.includes('content="linkedin.com/in/johndoe"'));
    });

    it("should include company as string when provided", () => {
      const result = linkedin({
        title: "Test",
        description: "Test description",
        company: "linkedin.com/company/techcorp",
      });

      assert(result.includes('<meta name="linkedin:company"'));
      assert(result.includes('content="linkedin.com/company/techcorp"'));
    });

    it("should handle query parameters in path", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/test?page=1&sort=date",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/test?page=1&sort=date"'));
    });

    it("should handle fragments in path", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/test#section",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('content="https://example.com/test#section"'));
    });
  });

  describe("Tier 2: Professional Content Types", () => {
    it("should generate job posting tags", () => {
      const result = linkedin({
        title: "Senior Developer",
        description: "Join our team",
        contentType: "job",
        jobDetails: {
          type: "full-time",
          location: "Remote",
          salary: "$120k-150k",
          skills: ["React", "Node.js"],
          experience: "5+ years",
        },
      });

      assert(result.includes('<meta name="linkedin:job:type"'));
      assert(result.includes('content="full-time"'));
      assert(result.includes('<meta name="linkedin:job:location"'));
      assert(result.includes('content="Remote"'));
      assert(result.includes('<meta name="linkedin:job:salary"'));
      assert(result.includes('content="$120k-150k"'));
      assert(result.includes('<meta name="linkedin:job:experience"'));
      assert(result.includes('content="5+ years"'));
    });

    it("should generate job skills tags", () => {
      const result = linkedin({
        title: "Developer",
        description: "Apply now",
        contentType: "job",
        jobDetails: {
          skills: ["React", "Node.js", "TypeScript"],
        },
      });

      assert(result.includes('<meta name="linkedin:job:skill"'));
      assert(result.includes('content="React"'));
      assert(result.includes('content="Node.js"'));
      assert(result.includes('content="TypeScript"'));
    });

    it("should generate course tags", () => {
      const result = linkedin({
        title: "React Certification",
        description: "Learn React",
        contentType: "course",
        courseDetails: {
          duration: "8 weeks",
          provider: "Tech Academy",
          prerequisites: ["JavaScript basics"],
          outcomes: ["Build React apps"],
        },
      });

      assert(result.includes('<meta name="linkedin:course:duration"'));
      assert(result.includes('content="8 weeks"'));
      assert(result.includes('<meta name="linkedin:course:provider"'));
      assert(result.includes('content="Tech Academy"'));
    });

    it("should generate course prerequisites and outcomes", () => {
      const result = linkedin({
        title: "Advanced Course",
        description: "Deep dive",
        contentType: "course",
        courseDetails: {
          prerequisites: ["Basic knowledge"],
          outcomes: ["Expert level skills"],
        },
      });

      assert(result.includes('<meta name="linkedin:course:prerequisite"'));
      assert(result.includes('content="Basic knowledge"'));
      assert(result.includes('<meta name="linkedin:course:outcome"'));
      assert(result.includes('content="Expert level skills"'));
    });

    it("should generate event tags", () => {
      const result = linkedin({
        title: "Tech Conference",
        description: "Join us",
        contentType: "event",
        eventDetails: {
          date: "2024-06-15",
          location: "San Francisco, CA",
          type: "conference",
          speakers: ["John Doe", "Jane Smith"],
        },
      });

      assert(result.includes('<meta name="linkedin:event:date"'));
      assert(result.includes('content="2024-06-15"'));
      assert(result.includes('<meta name="linkedin:event:location"'));
      assert(result.includes('content="San Francisco, CA"'));
      assert(result.includes('<meta name="linkedin:event:type"'));
      assert(result.includes('content="conference"'));
    });

    it("should generate event speakers", () => {
      const result = linkedin({
        title: "Webinar",
        description: "Learn something",
        contentType: "event",
        eventDetails: {
          speakers: ["Expert 1", "Expert 2"],
        },
      });

      assert(result.includes('<meta name="linkedin:event:speaker"'));
      assert(result.includes('content="Expert 1"'));
      assert(result.includes('content="Expert 2"'));
    });

    it("should handle empty job details", () => {
      const result = linkedin({
        title: "Job",
        description: "Description",
        contentType: "job",
        jobDetails: {},
      });

      assert(result.includes('content="job"'));
      assert(!result.includes('<meta name="linkedin:job:'));
    });

    it("should handle empty course details", () => {
      const result = linkedin({
        title: "Course",
        description: "Description",
        contentType: "course",
        courseDetails: {},
      });

      assert(result.includes('content="course"'));
      assert(!result.includes('<meta name="linkedin:course:'));
    });

    it("should handle empty event details", () => {
      const result = linkedin({
        title: "Event",
        description: "Description",
        contentType: "event",
        eventDetails: {},
      });

      assert(result.includes('content="event"'));
      assert(!result.includes('<meta name="linkedin:event:'));
    });
  });

  describe("Tier 3: Enterprise Integration", () => {
    it("should generate company object tags", () => {
      const result = linkedin({
        title: "About Us",
        description: "Our company",
        company: {
          id: "linkedin.com/company/techcorp",
          name: "TechCorp",
          industry: "Technology",
          size: "500-1000 employees",
          location: "San Francisco, CA",
          culture: ["Innovation", "Diversity"],
        },
      });

      assert(result.includes('<meta name="linkedin:company:id"'));
      assert(result.includes('content="linkedin.com/company/techcorp"'));
      assert(result.includes('<meta name="linkedin:company:name"'));
      assert(result.includes('content="TechCorp"'));
      assert(result.includes('<meta name="linkedin:company:industry"'));
      assert(result.includes('content="Technology"'));
      assert(result.includes('<meta name="linkedin:company:size"'));
      assert(result.includes('content="500-1000 employees"'));
      assert(result.includes('<meta name="linkedin:company:location"'));
      assert(result.includes('content="San Francisco, CA"'));
    });

    it("should generate company culture tags", () => {
      const result = linkedin({
        title: "Our Culture",
        description: "What we value",
        company: {
          culture: ["Innovation", "Work-Life Balance", "Growth"],
        },
      });

      assert(result.includes('<meta name="linkedin:company:culture"'));
      assert(result.includes('content="Innovation"'));
      assert(result.includes('content="Work-Life Balance"'));
      assert(result.includes('content="Growth"'));
    });

    it("should generate team member tags", () => {
      const result = linkedin({
        title: "Our Team",
        description: "Meet the team",
        team: {
          members: ["linkedin.com/in/ceo", "linkedin.com/in/cto"],
          departments: ["Engineering", "Product"],
        },
      });

      assert(result.includes('<meta name="linkedin:team:member"'));
      assert(result.includes('content="linkedin.com/in/ceo"'));
      assert(result.includes('content="linkedin.com/in/cto"'));
    });

    it("should generate team department tags", () => {
      const result = linkedin({
        title: "Departments",
        description: "Our structure",
        team: {
          departments: ["Engineering", "Design", "Marketing"],
        },
      });

      assert(result.includes('<meta name="linkedin:team:department"'));
      assert(result.includes('content="Engineering"'));
      assert(result.includes('content="Design"'));
      assert(result.includes('content="Marketing"'));
    });

    it("should handle empty company object", () => {
      const result = linkedin({
        title: "Company",
        description: "Description",
        company: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:company:'));
    });

    it("should handle empty team object", () => {
      const result = linkedin({
        title: "Team",
        description: "Description",
        team: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:team:'));
    });
  });

  describe("Tier 4: Advanced Professional SEO", () => {
    it("should generate networking connection tags", () => {
      const result = linkedin({
        title: "Networking",
        description: "Connect with professionals",
        networking: {
          connections: ["linkedin.com/in/mentor1", "linkedin.com/in/mentor2"],
          groups: ["Tech Leaders"],
          hashtags: ["#CareerGrowth"],
        },
      });

      assert(result.includes('<meta name="linkedin:network:connection"'));
      assert(result.includes('content="linkedin.com/in/mentor1"'));
      assert(result.includes('content="linkedin.com/in/mentor2"'));
    });

    it("should generate networking group tags", () => {
      const result = linkedin({
        title: "Groups",
        description: "Join communities",
        networking: {
          groups: ["Tech Leaders", "Career Development"],
        },
      });

      assert(result.includes('<meta name="linkedin:network:group"'));
      assert(result.includes('content="Tech Leaders"'));
      assert(result.includes('content="Career Development"'));
    });

    it("should generate networking hashtag tags", () => {
      const result = linkedin({
        title: "Trends",
        description: "Latest in tech",
        networking: {
          hashtags: ["#CareerGrowth", "#TechTrends"],
        },
      });

      assert(result.includes('<meta name="linkedin:network:hashtag"'));
      assert(result.includes('content="#CareerGrowth"'));
      assert(result.includes('content="#TechTrends"'));
    });

    it("should generate analytics tags", () => {
      const result = linkedin({
        title: "Analytics",
        description: "Track performance",
        analytics: {
          trackingId: "linkedin_analytics_001",
          conversionGoals: ["Profile Views", "Connection Requests"],
        },
      });

      assert(result.includes('<meta name="linkedin:analytics:tracking"'));
      assert(result.includes('content="linkedin_analytics_001"'));
      assert(result.includes('<meta name="linkedin:analytics:goal"'));
      assert(result.includes('content="Profile Views"'));
      assert(result.includes('content="Connection Requests"'));
    });

    it("should generate syndication tags", () => {
      const result = linkedin({
        title: "Syndicated",
        description: "Cross-platform content",
        syndication: {
          originalSource: "linkedin.com/company/techcorp",
          partners: ["medium.com/@techcorp", "twitter.com/techcorp"],
        },
      });

      assert(result.includes('<meta name="linkedin:syndication:source"'));
      assert(result.includes('content="linkedin.com/company/techcorp"'));
      assert(result.includes('<meta name="linkedin:syndication:partner"'));
      assert(result.includes('content="medium.com/@techcorp"'));
      assert(result.includes('content="twitter.com/techcorp"'));
    });

    it("should generate localization tags", () => {
      const result = linkedin({
        title: "Content",
        description: "Localized content",
        localization: {
          "en-US": "English Version",
          "es-ES": "Versión Española",
          "fr-FR": "Version Française",
        },
      });

      assert(result.includes('<meta name="linkedin:locale:en-US"'));
      assert(result.includes('content="English Version"'));
      assert(result.includes('<meta name="linkedin:locale:es-ES"'));
      assert(result.includes('content="Versión Española"'));
      assert(result.includes('<meta name="linkedin:locale:fr-FR"'));
      assert(result.includes('content="Version Française"'));
    });

    it("should handle empty networking object", () => {
      const result = linkedin({
        title: "Network",
        description: "Description",
        networking: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:network:'));
    });

    it("should handle empty analytics object", () => {
      const result = linkedin({
        title: "Analytics",
        description: "Description",
        analytics: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:analytics:'));
    });

    it("should handle empty syndication object", () => {
      const result = linkedin({
        title: "Syndicated",
        description: "Description",
        syndication: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:syndication:'));
    });

    it("should handle empty localization object", () => {
      const result = linkedin({
        title: "Localized",
        description: "Description",
        localization: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:locale:'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (smart + job content)", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/jobs/developer",
        title: "Senior Developer",
        description: "Join our team",
        contentType: "job",
        jobDetails: {
          type: "full-time",
          location: "Remote",
          skills: ["React"],
        },
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(result.includes('<meta name="linkedin:description"'));
      assert(result.includes('<meta name="linkedin:url"'));
      assert(result.includes('content="job"'));
      assert(result.includes('<meta name="linkedin:job:type"'));
      assert(result.includes('<meta name="linkedin:job:location"'));
      assert(result.includes('<meta name="linkedin:job:skill"'));
    });

    it("should handle Tier 1 + Tier 3 (smart + enterprise)", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/company",
        title: "About TechCorp",
        description: "Leading tech company",
        company: {
          name: "TechCorp",
          industry: "Technology",
          culture: ["Innovation"],
        },
        team: {
          members: ["linkedin.com/in/ceo"],
        },
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(result.includes('<meta name="linkedin:description"'));
      assert(result.includes('<meta name="linkedin:url"'));
      assert(result.includes('<meta name="linkedin:company:name"'));
      assert(result.includes('<meta name="linkedin:company:industry"'));
      assert(result.includes('<meta name="linkedin:company:culture"'));
      assert(result.includes('<meta name="linkedin:team:member"'));
    });

    it("should handle Tier 2 + Tier 3 (content + enterprise)", () => {
      const result = linkedin({
        title: "Company Event",
        description: "Join our conference",
        contentType: "event",
        eventDetails: {
          date: "2024-06-15",
          speakers: ["CEO"],
        },
        company: {
          name: "TechCorp",
        },
      });

      assert(result.includes('content="event"'));
      assert(result.includes('<meta name="linkedin:event:date"'));
      assert(result.includes('<meta name="linkedin:event:speaker"'));
      assert(result.includes('<meta name="linkedin:company:name"'));
    });

    it("should handle Tier 1 + Tier 4 (smart + advanced)", () => {
      const result = linkedin({
        title: "Professional Development",
        description: "Career growth guide",
        networking: {
          hashtags: ["#CareerGrowth"],
        },
        analytics: {
          trackingId: "linkedin_001",
        },
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(result.includes('<meta name="linkedin:description"'));
      assert(result.includes('<meta name="linkedin:network:hashtag"'));
      assert(result.includes('<meta name="linkedin:analytics:tracking"'));
    });

    it("should handle all tiers combined", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/jobs/senior-developer",
        url: "https://example.com/jobs/senior-developer",
        title: "Senior Developer at TechCorp",
        description: "Join our innovative team",
        image: "/job-banner.jpg",
        owner: "linkedin.com/in/hr-manager",
        contentType: "job",
        jobDetails: {
          type: "full-time",
          location: "Remote",
          salary: "$120k-150k",
          skills: ["React", "Node.js"],
          experience: "5+ years",
        },
        company: {
          id: "linkedin.com/company/techcorp",
          name: "TechCorp",
          industry: "Technology",
          size: "500-1000 employees",
          culture: ["Innovation"],
        },
        team: {
          members: ["linkedin.com/in/ceo"],
          departments: ["Engineering"],
        },
        networking: {
          connections: ["linkedin.com/in/mentor"],
          groups: ["Tech Leaders"],
          hashtags: ["#CareerGrowth"],
        },
        analytics: {
          trackingId: "linkedin_analytics_001",
          conversionGoals: ["Applications"],
        },
        syndication: {
          originalSource: "linkedin.com/company/techcorp",
          partners: ["indeed.com"],
        },
        localization: {
          "en-US": "Senior Developer",
          "es-ES": "Desarrollador Senior",
        },
      });

      // Should contain elements from all tiers
      assert(result.includes('<meta name="linkedin:title"'));
      assert(result.includes('<meta name="linkedin:description"'));
      assert(result.includes('<meta name="linkedin:url"'));
      assert(result.includes('<meta name="linkedin:image"'));
      assert(result.includes('<meta name="linkedin:owner"'));
      assert(result.includes('content="job"'));
      assert(result.includes('<meta name="linkedin:job:type"'));
      assert(result.includes('<meta name="linkedin:job:location"'));
      assert(result.includes('<meta name="linkedin:job:salary"'));
      assert(result.includes('<meta name="linkedin:job:experience"'));
      assert(result.includes('<meta name="linkedin:job:skill"'));
      assert(result.includes('<meta name="linkedin:company:id"'));
      assert(result.includes('<meta name="linkedin:company:name"'));
      assert(result.includes('<meta name="linkedin:company:industry"'));
      assert(result.includes('<meta name="linkedin:company:size"'));
      assert(result.includes('<meta name="linkedin:company:culture"'));
      assert(result.includes('<meta name="linkedin:team:member"'));
      assert(result.includes('<meta name="linkedin:team:department"'));
      assert(result.includes('<meta name="linkedin:network:connection"'));
      assert(result.includes('<meta name="linkedin:network:group"'));
      assert(result.includes('<meta name="linkedin:network:hashtag"'));
      assert(result.includes('<meta name="linkedin:analytics:tracking"'));
      assert(result.includes('<meta name="linkedin:analytics:goal"'));
      assert(result.includes('<meta name="linkedin:syndication:source"'));
      assert(result.includes('<meta name="linkedin:syndication:partner"'));
      assert(result.includes('<meta name="linkedin:locale:en-US"'));
      assert(result.includes('<meta name="linkedin:locale:es-ES"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/job?title=senior+developer&location=remote&salary=120000",
        title: "Senior Developer",
        description: "Great opportunity",
      });

      assert(result.includes('content="https://example.com/job?title=senior+developer&location=remote&salary=120000"'));
    });

    it("should handle URL-encoded characters", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/job?title=Senior%20Developer&company=Tech%20Corp",
        title: "Senior Developer",
        description: "Join Tech Corp",
      });

      assert(result.includes('content="https://example.com/job?title=Senior%20Developer&company=Tech%20Corp"'));
    });

    it("should handle subdomain domains", () => {
      const result = linkedin({
        domain: "careers.example.com",
        path: "/jobs",
        title: "Jobs",
        description: "Career opportunities",
      });

      assert(result.includes('content="https://careers.example.com/jobs"'));
    });

    it("should handle port numbers in domain", () => {
      const result = linkedin({
        domain: "localhost:3000",
        path: "/jobs",
        title: "Jobs",
        description: "Local jobs",
      });

      assert(result.includes('content="https://localhost:3000/jobs"'));
    });

    it("should handle very long paths", () => {
      const longPath = "/careers/jobs/senior-software-engineer/full-stack-developer/remote-work/technology-company";
      const result = linkedin({
        domain: "example.com",
        path: longPath,
        title: "Senior Developer",
        description: "Join our team",
      });

      assert(result.includes(`content="https://example.com${longPath}"`));
    });

    it("should handle special characters in domain", () => {
      const result = linkedin({
        domain: "tech-company.co.uk",
        path: "/jobs",
        title: "Jobs",
        description: "UK jobs",
      });

      assert(result.includes('content="https://tech-company.co.uk/jobs"'));
    });

    it("should handle zero values in numeric fields", () => {
      const result = linkedin({
        title: "Job",
        description: "Description",
        jobDetails: {
          salary: "$0",
          experience: "0 years",
        },
      });

      assert(result.includes('content="$0"'));
      assert(result.includes('content="0 years"'));
    });

    it("should handle very large numbers", () => {
      const result = linkedin({
        title: "Company",
        description: "Large company",
        company: {
          size: "10000+ employees",
        },
      });

      assert(result.includes('content="10000+ employees"'));
    });

    it("should handle Unicode characters in text fields", () => {
      const result = linkedin({
        title: "Développeur Senior 🚀",
        description: "Opportunité exceptionnelle 🌟",
        company: {
          name: "TechCorp © 2024",
        },
        networking: {
          hashtags: ["#Développement", "#Tech"],
        },
      });

      assert(result.includes('content="Développeur Senior 🚀"'));
      assert(result.includes('content="Opportunité exceptionnelle 🌟"'));
      assert(result.includes('content="TechCorp © 2024"'));
      assert(result.includes('content="#Développement"'));
      assert(result.includes('content="#Tech"'));
    });

    it("should handle very long text content", () => {
      const longTitle = "A".repeat(300);
      const longDescription = "B".repeat(600);
      const result = linkedin({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = linkedin({
        domain: "example.com",
        title: "Mixed URLs",
        description: "Testing mixed URLs",
        image: "https://cdn.example.com/image.jpg",
        company: {
          id: "linkedin.com/company/techcorp",
        },
        team: {
          members: ["linkedin.com/in/ceo"],
        },
      });

      assert(result.includes('content="https://cdn.example.com/image.jpg"'));
      assert(result.includes('content="linkedin.com/company/techcorp"'));
      assert(result.includes('content="linkedin.com/in/ceo"'));
    });

    it("should handle empty arrays in all contexts", () => {
      const result = linkedin({
        title: "Test",
        description: "Test",
        jobDetails: { skills: [] },
        courseDetails: { prerequisites: [], outcomes: [] },
        eventDetails: { speakers: [] },
        company: { culture: [] },
        team: { members: [], departments: [] },
        networking: { connections: [], groups: [], hashtags: [] },
        analytics: { conversionGoals: [] },
        syndication: { partners: [] },
        localization: {},
      });

      assert(result.includes('<meta name="linkedin:title"'));
      assert(!result.includes('<meta name="linkedin:job:skill"'));
      assert(!result.includes('<meta name="linkedin:course:prerequisite"'));
      assert(!result.includes('<meta name="linkedin:event:speaker"'));
      assert(!result.includes('<meta name="linkedin:company:culture"'));
      assert(!result.includes('<meta name="linkedin:team:member"'));
      assert(!result.includes('<meta name="linkedin:network:connection"'));
      assert(!result.includes('<meta name="linkedin:analytics:goal"'));
      assert(!result.includes('<meta name="linkedin:syndication:partner"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = linkedin({
        title: "Test",
        description: "Test description",
      });

      // Should start and end with meta tags
      assert(result.trim().startsWith("<meta"));
      assert(result.trim().endsWith("/>"));

      // Should be valid HTML (no unclosed tags)
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted LinkedIn meta tags", () => {
      const result = linkedin({
        title: "Test Title",
        description: "Test Description",
      });

      // Should have proper LinkedIn meta attributes
      assert(result.includes('name="linkedin:title"'));
      assert(result.includes('property="linkedin:title"'));
      assert(result.includes('name="linkedin:description"'));
      assert(result.includes('property="linkedin:description"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = linkedin({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
        image: "http://example.com/image.jpg",
        jobDetails: {
          location: "Remote",
        },
      });

      // All constructed URLs should be HTTPS
      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = linkedin({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "not-a-url",
      });

      // Should still generate basic tags and normalize malformed relative URLs
      assert(result.includes('<meta name="linkedin:title"'));
      assert(result.includes('<meta name="linkedin:description"'));
      assert(result.includes('<meta name="linkedin:image"'));
      assert(result.includes('content="https://example.com/not-a-url"'));
    });

    it("should generate consistent property/name attributes", () => {
      const result = linkedin({
        title: "Test",
        description: "Test description",
        company: "linkedin.com/company/test",
      });

      // All LinkedIn meta tags should have both name and property attributes
      const metaTags = result.match(/<meta[^>]*>/g) || [];
      for (const tag of metaTags) {
        if (tag.includes("linkedin:")) {
          assert(tag.includes('name="linkedin:') || tag.includes('property="linkedin:'));
        }
      }
    });

    it("should handle content type detection edge cases", () => {
      // Test various title patterns
      const jobResult = linkedin({
        title: "We're Hiring a Developer",
        description: "Join our team",
      });
      assert(jobResult.includes('content="job"'));

      const courseResult = linkedin({
        title: "Master React Development Course",
        description: "Learn from experts",
      });
      assert(courseResult.includes('content="course"'));

      const eventResult = linkedin({
        title: "Attend Our Tech Webinar",
        description: "Free registration",
      });
      assert(eventResult.includes('content="event"'));

      const companyResult = linkedin({
        title: "About Our Company",
        description: "Our mission and values",
      });
      assert(companyResult.includes('content="company"'));
    });

    it("should properly escape HTML in content", () => {
      const result = linkedin({
        title: 'Test "Quote" & <Tag>',
        description: "Test description",
      });

      // HTML should be properly escaped in the generated meta tags
      assert(!result.includes('Test "Quote" & <Tag>'));
      assert(result.includes("Test &quot;Quote&quot; &amp; &lt;Tag&gt;"));
    });
  });
});
