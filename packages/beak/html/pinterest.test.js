/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { pinterest } from "./pinterest.js";

/**
 * @file Comprehensive test suite for progressive Pinterest rich pins generator.
 *
 * Tests all enhancement tiers, content type detection, and ensures 100% code coverage
 * through systematic testing of configuration combinations.
 */

describe("pinterest()", () => {
  describe("Input Validation", () => {
    it("should return empty string for undefined config", () => {
      assert.strictEqual(pinterest(undefined), "");
    });

    it("should return empty string for null config", () => {
      assert.strictEqual(pinterest(null), "");
    });

    it("should return empty string for non-object config", () => {
      assert.strictEqual(pinterest("string"), "");
      assert.strictEqual(pinterest(123), "");
      assert.strictEqual(pinterest([]), "");
    });

    it("should return empty string when title is missing", () => {
      assert.strictEqual(pinterest({ description: "test" }), "");
    });

    it("should return empty string when description is missing", () => {
      assert.strictEqual(pinterest({ title: "test" }), "");
    });

    it("should return empty string when both title and description are missing", () => {
      assert.strictEqual(pinterest({ domain: "example.com" }), "");
    });
  });

  describe("Content Type Detection", () => {
    it("should auto-detect product content from URL pattern", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/products/widget",
        title: "Amazing Widget",
        description: "Buy now for $29.99",
      });

      assert(result.includes('content="product"'));
    });

    it("should auto-detect product content from price in description", () => {
      const result = pinterest({
        title: "Premium Product",
        description: "Only $99.99 - limited time offer",
      });

      assert(result.includes('content="product"'));
    });

    it("should auto-detect recipe content from URL pattern", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/recipes/chocolate-cookies",
        title: "Chocolate Cookies",
        description: "Delicious homemade cookies",
      });

      assert(result.includes('content="recipe"'));
    });

    it("should auto-detect recipe content from cooking keywords", () => {
      const result = pinterest({
        title: "How to Make Pizza",
        description: "Mix ingredients and bake for 20 minutes",
      });

      assert(result.includes('content="recipe"'));
    });

    it("should auto-detect article content from URL pattern", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/blog/web-development",
        title: "Web Development Tips",
        description: "Learn from the experts",
      });

      assert(result.includes('content="article"'));
    });

    it("should auto-detect app content from keywords", () => {
      const result = pinterest({
        title: "Download Our iOS App",
        description: "Available on App Store and Google Play",
      });

      assert(result.includes('content="app"'));
    });

    it("should auto-detect movie content from keywords", () => {
      const result = pinterest({
        title: "Action Movie Review",
        description: "Starring top actors and directed by renowned filmmaker",
      });

      assert(result.includes('content="movie"'));
    });

    it("should auto-detect place content from keywords", () => {
      const result = pinterest({
        title: "Visit Our Restaurant",
        description: "Located at 123 Main Street, open daily",
      });

      assert(result.includes('content="place"'));
    });

    it("should auto-detect book content from ISBN", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/books/javascript-guide",
        title: "Programming Book",
        description: "ISBN: 978-0123456789 by expert author",
      });

      assert(result.includes('content="book"'));
    });

    it("should default to article content type", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/page",
        title: "Regular Page",
        description: "Regular content",
      });

      assert(result.includes('content="article"'));
    });

    it("should use explicit type over auto-detection", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/products/item",
        title: "Product Title",
        description: "Product description",
        type: "article",
      });

      assert(result.includes('content="article"'));
    });
  });

  describe("URL Normalization", () => {
    it("should construct basic absolute URL from domain and path", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should add leading slash to path if missing", () => {
      const result = pinterest({
        domain: "example.com",
        path: "article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });

    it("should use pre-constructed URL when provided", () => {
      const result = pinterest({
        domain: "example.com",
        url: "https://custom.com/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://custom.com/article"'));
    });

    it("should force HTTPS for pre-constructed URLs", () => {
      const result = pinterest({
        domain: "example.com",
        url: "http://example.com/article",
        title: "Test",
        description: "Test description",
      });
      assert(result.includes('content="https://example.com/article"'));
    });
  });

  describe("Tier 1: Basic Pinterest Tags", () => {
    it("should generate basic Pinterest meta tags", () => {
      const result = pinterest({
        title: "Test Title",
        description: "Test description for Pinterest",
      });

      assert(result.includes('<meta name="pinterest:title"'));
      assert(result.includes('content="Test Title"'));
      assert(result.includes('<meta name="pinterest:description"'));
      assert(result.includes('content="Test description for Pinterest"'));
    });

    it("should include URL when domain provided", () => {
      const result = pinterest({
        domain: "example.com",
        title: "Test",
        description: "Test description",
      });

      assert(result.includes('<meta name="pinterest:url"'));
      assert(result.includes('content="https://example.com"'));
    });

    it("should include simple string image", () => {
      const result = pinterest({
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('content="/banner.jpg"'));
    });

    it("should normalize image URL when domain provided", () => {
      const result = pinterest({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "/banner.jpg",
      });

      assert(result.includes('content="https://example.com/banner.jpg"'));
    });
  });

  describe("Image Handling", () => {
    it("should handle rich image object with all properties", () => {
      const result = pinterest({
        title: "Test",
        description: "Test description",
        image: {
          url: "/banner.jpg",
          alt: "Banner image",
          width: 1200,
          height: 630,
        },
      });

      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('content="/banner.jpg"'));
      assert(result.includes('<meta name="pinterest:image:alt"'));
      assert(result.includes('<meta name="pinterest:image:width"'));
      assert(result.includes('<meta name="pinterest:image:height"'));
    });

    it("should handle multiple images for carousel", () => {
      const result = pinterest({
        title: "Test",
        description: "Test description",
        image: [
          { url: "/img1.jpg", alt: "First image" },
          { url: "/img2.jpg", alt: "Second image" },
          { url: "/img3.jpg", alt: "Third image" },
        ],
      });

      assert(result.includes('content="/img1.jpg"'));
      assert(result.includes('content="/img2.jpg"'));
      assert(result.includes('content="/img3.jpg"'));
      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('<meta name="pinterest:image1"'));
      assert(result.includes('<meta name="pinterest:image2"'));
    });

    it("should limit carousel images to 5", () => {
      const images = Array.from({ length: 8 }, (_, i) => ({ url: `/img${i}.jpg` }));
      const result = pinterest({
        title: "Test",
        description: "Test description",
        image: images,
      });

      // Should have image, image1, image2, image3, image4 but not image5+
      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('<meta name="pinterest:image4"'));
      assert(!result.includes('<meta name="pinterest:image5"'));
    });
  });

  describe("Video Handling", () => {
    it("should generate video tags with all properties", () => {
      const result = pinterest({
        title: "Video Content",
        description: "Watch this video",
        video: {
          url: "/video.mp4",
          type: "video/mp4",
          duration: 180,
          thumbnail: "/thumb.jpg",
        },
      });

      assert(result.includes('<meta name="pinterest:video"'));
      assert(result.includes('content="/video.mp4"'));
      assert(result.includes('<meta name="pinterest:video:type"'));
      assert(result.includes('<meta name="pinterest:video:duration"'));
      assert(result.includes('<meta name="pinterest:video:thumbnail"'));
    });

    it("should handle zero duration", () => {
      const result = pinterest({
        title: "Video",
        description: "Description",
        video: { url: "/video.mp4", duration: 0 },
      });

      assert(result.includes('<meta name="pinterest:video:duration"'));
      assert(result.includes('content="0"'));
    });
  });

  describe("Tier 2: Rich Pins Content Types", () => {
    it("should generate article rich pins", () => {
      const result = pinterest({
        title: "Blog Post",
        description: "Article content",
        type: "article",
        article: {
          author: "John Doe",
          datePublished: "2024-01-15T10:00:00Z",
          section: "Technology",
          tags: ["javascript", "web-development", "tutorial"],
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:title"'));
      assert(result.includes('<meta name="pinterest-rich-pin:description"'));
      assert(result.includes('<meta name="pinterest-rich-pin:author"'));
      assert(result.includes('<meta name="pinterest-rich-pin:date_published"'));
      assert(result.includes('<meta name="pinterest-rich-pin:section"'));
      assert(result.includes('<meta name="pinterest-rich-pin:tag"'));
    });

    it("should limit article tags to 5", () => {
      const tags = Array.from({ length: 8 }, (_, i) => `tag${i}`);
      const result = pinterest({
        title: "Article",
        description: "Description",
        type: "article",
        article: { tags },
      });

      let tagCount = 0;
      const matches = result.match(/name="pinterest-rich-pin:tag"/g) || [];
      tagCount = matches.length;

      assert.strictEqual(tagCount, 5);
    });

    it("should generate product rich pins", () => {
      const result = pinterest({
        title: "Amazing Widget",
        description: "Buy now",
        type: "product",
        product: {
          price: { amount: "29.99", currency: "USD" },
          availability: "in stock",
          brand: "TechCorp",
          condition: "new",
          variants: [
            { size: "S", color: "Red" },
            { size: "M", color: "Blue" },
          ],
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:price"'));
      assert(result.includes('<meta name="pinterest-rich-pin:currency"'));
      assert(result.includes('<meta name="pinterest-rich-pin:availability"'));
      assert(result.includes('<meta name="pinterest-rich-pin:brand"'));
      assert(result.includes('<meta name="pinterest-rich-pin:condition"'));
      assert(result.includes('<meta name="pinterest-rich-pin:variant"'));
    });

    it("should limit product variants to 10", () => {
      const variants = Array.from({ length: 12 }, (_, i) => ({ size: `S${i}` }));
      const result = pinterest({
        title: "Product",
        description: "Description",
        type: "product",
        product: { variants },
      });

      let variantCount = 0;
      const matches = result.match(/name="pinterest-rich-pin:variant"/g) || [];
      variantCount = matches.length;

      assert.strictEqual(variantCount, 10);
    });

    it("should generate recipe rich pins", () => {
      const result = pinterest({
        title: "Chocolate Cookies",
        description: "Delicious cookies",
        type: "recipe",
        recipe: {
          ingredients: ["2 cups flour", "1 cup sugar", "1/2 cup butter"],
          instructions: ["Mix ingredients", "Bake at 350F", "Cool and serve"],
          cookTime: "15 minutes",
          prepTime: "10 minutes",
          servings: 24,
          nutrition: {
            calories: "120 kcal",
            protein: "2g",
            carbs: "18g",
            fat: "5g",
          },
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:ingredients"'));
      assert(result.includes('<meta name="pinterest-rich-pin:instructions"'));
      assert(result.includes('<meta name="pinterest-rich-pin:cook_time"'));
      assert(result.includes('<meta name="pinterest-rich-pin:prep_time"'));
      assert(result.includes('<meta name="pinterest-rich-pin:servings"'));
      assert(result.includes('<meta name="pinterest-rich-pin:nutrition:calories"'));
      assert(result.includes('<meta name="pinterest-rich-pin:nutrition:protein"'));
    });

    it("should limit recipe ingredients and instructions", () => {
      const ingredients = Array.from({ length: 25 }, (_, i) => `Ingredient ${i}`);
      const instructions = Array.from({ length: 20 }, (_, i) => `Step ${i}`);
      const result = pinterest({
        title: "Recipe",
        description: "Description",
        type: "recipe",
        recipe: { ingredients, instructions },
      });

      let ingredientCount = 0;
      let instructionCount = 0;
      const ingredientMatches = result.match(/name="pinterest-rich-pin:ingredients"/g) || [];
      const instructionMatches = result.match(/name="pinterest-rich-pin:instructions"/g) || [];
      ingredientCount = ingredientMatches.length;
      instructionCount = instructionMatches.length;

      assert.strictEqual(ingredientCount, 20);
      assert.strictEqual(instructionCount, 15);
    });

    it("should generate app rich pins", () => {
      const result = pinterest({
        title: "Mobile App",
        description: "Download our app",
        type: "app",
        app: {
          name: "MyApp",
          platform: "ios",
          deeplink: "myapp://home",
          rating: "4.5",
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:app:name"'));
      assert(result.includes('<meta name="pinterest-rich-pin:app:platform"'));
      assert(result.includes('<meta name="pinterest-rich-pin:app:deeplink"'));
      assert(result.includes('<meta name="pinterest-rich-pin:app:rating"'));
    });

    it("should generate movie rich pins", () => {
      const result = pinterest({
        title: "Action Movie",
        description: "Exciting film",
        type: "movie",
        movie: {
          title: "The Action Movie",
          director: ["John Director", "Jane Director"],
          actor: ["Actor One", "Actor Two", "Actor Three"],
          genre: ["Action", "Adventure"],
          releaseDate: "2024-01-01",
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:movie:title"'));
      assert(result.includes('<meta name="pinterest-rich-pin:movie:director"'));
      assert(result.includes('<meta name="pinterest-rich-pin:movie:actor"'));
      assert(result.includes('<meta name="pinterest-rich-pin:movie:genre"'));
      assert(result.includes('<meta name="pinterest-rich-pin:movie:release_date"'));
    });

    it("should limit movie metadata", () => {
      const directors = Array.from({ length: 5 }, (_, i) => `Director ${i}`);
      const actors = Array.from({ length: 8 }, (_, i) => `Actor ${i}`);
      const genres = Array.from({ length: 5 }, (_, i) => `Genre ${i}`);
      const result = pinterest({
        title: "Movie",
        description: "Description",
        type: "movie",
        movie: { directors, actors, genres },
      });

      let directorCount = 0;
      let actorCount = 0;
      let genreCount = 0;
      const directorMatches = result.match(/name="pinterest-rich-pin:movie:director"/g) || [];
      const actorMatches = result.match(/name="pinterest-rich-pin:movie:actor"/g) || [];
      const genreMatches = result.match(/name="pinterest-rich-pin:movie:genre"/g) || [];
      directorCount = directorMatches.length;
      actorCount = actorMatches.length;
      genreCount = genreMatches.length;

      assert.strictEqual(directorCount, 3);
      assert.strictEqual(actorCount, 5);
      assert.strictEqual(genreCount, 3);
    });

    it("should generate place rich pins", () => {
      const result = pinterest({
        title: "Restaurant",
        description: "Great food",
        type: "place",
        place: {
          name: "My Restaurant",
          address: "123 Main St, Anytown, USA",
          phone: "+1-555-123-4567",
          coordinates: { lat: 40.7128, lng: -74.006 },
          hours: "Mon-Fri 9AM-9PM",
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:place:name"'));
      assert(result.includes('<meta name="pinterest-rich-pin:place:address"'));
      assert(result.includes('<meta name="pinterest-rich-pin:place:phone"'));
      assert(result.includes('<meta name="pinterest-rich-pin:place:coordinates"'));
      assert(result.includes('<meta name="pinterest-rich-pin:place:hours"'));
    });

    it("should generate book rich pins", () => {
      const result = pinterest({
        title: "Programming Book",
        description: "Learn to code",
        type: "book",
        book: {
          title: "JavaScript Guide",
          author: ["John Doe", "Jane Smith"],
          isbn: "978-0123456789",
          genre: "Technology",
          pageCount: 300,
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:book:title"'));
      assert(result.includes('<meta name="pinterest-rich-pin:book:author"'));
      assert(result.includes('<meta name="pinterest-rich-pin:book:isbn"'));
      assert(result.includes('<meta name="pinterest-rich-pin:book:genre"'));
      assert(result.includes('<meta name="pinterest-rich-pin:book:page_count"'));
    });

    it("should limit book authors to 3", () => {
      const authors = Array.from({ length: 5 }, (_, i) => `Author ${i}`);
      const result = pinterest({
        title: "Book",
        description: "Description",
        type: "book",
        book: { authors },
      });

      let authorCount = 0;
      const matches = result.match(/name="pinterest-rich-pin:book:author"/g) || [];
      authorCount = matches.length;

      assert.strictEqual(authorCount, 3);
    });
  });

  describe("Tier 3: Advanced Pinterest Features", () => {
    it("should generate board metadata", () => {
      const result = pinterest({
        title: "Content",
        description: "Description",
        board: {
          name: "Fashion Inspiration",
          url: "https://pinterest.com/mybrand/fashion",
          description: "Latest fashion trends",
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:board:name"'));
      assert(result.includes('<meta name="pinterest-rich-pin:board:url"'));
      assert(result.includes('<meta name="pinterest-rich-pin:board:description"'));
    });

    it("should generate commerce metadata", () => {
      const result = pinterest({
        title: "Product",
        description: "Buy now",
        type: "product",
        commerce: {
          buyable: true,
          purchaseUrl: "https://example.com/buy",
          currency: "USD",
          shipping: {
            cost: "5.99",
            freeThreshold: "50.00",
          },
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:buyable"'));
      assert(result.includes('<meta name="pinterest-rich-pin:purchase_url"'));
      assert(result.includes('<meta name="pinterest-rich-pin:currency"'));
      assert(result.includes('<meta name="pinterest-rich-pin:shipping:cost"'));
      assert(result.includes('<meta name="pinterest-rich-pin:shipping:free_threshold"'));
    });
  });

  describe("Tier 4: Enterprise Pinterest Integration", () => {
    it("should generate analytics metadata", () => {
      const result = pinterest({
        title: "Content",
        description: "Description",
        analytics: {
          tagId: "123456789",
          conversionEvents: ["Purchase", "SignUp", "Lead"],
          audienceTargeting: ["Fashion Lovers", "Designers"],
        },
      });

      assert(result.includes('<meta name="pinterest:tag"'));
      assert(result.includes('<meta name="pinterest:conversion"'));
      assert(result.includes('<meta name="pinterest:audience"'));
    });

    it("should limit analytics metadata", () => {
      const events = Array.from({ length: 8 }, (_, i) => `Event ${i}`);
      const audiences = Array.from({ length: 8 }, (_, i) => `Audience ${i}`);
      const result = pinterest({
        title: "Content",
        description: "Description",
        analytics: { conversionEvents: events, audienceTargeting: audiences },
      });

      let eventCount = 0;
      let audienceCount = 0;
      const eventMatches = result.match(/name="pinterest:conversion"/g) || [];
      const audienceMatches = result.match(/name="pinterest:audience"/g) || [];
      eventCount = eventMatches.length;
      audienceCount = audienceMatches.length;

      assert.strictEqual(eventCount, 5);
      assert.strictEqual(audienceCount, 5);
    });

    it("should generate verification metadata", () => {
      const result = pinterest({
        title: "Content",
        description: "Description",
        verification: "pinterest-site-verification=abc123",
      });

      assert(result.includes('<meta name="pinterest-site-verification"'));
      assert(result.includes('content="pinterest-site-verification=abc123"'));
    });
  });

  describe("Progressive Enhancement Combinations", () => {
    it("should handle Tier 1 + Tier 2 (basic + product rich pin)", () => {
      const result = pinterest({
        domain: "example.com",
        title: "Amazing Widget",
        description: "Buy our premium widget",
        image: "/widget.jpg",
        type: "product",
        product: {
          price: { amount: "99.99", currency: "USD" },
          availability: "in stock",
          brand: "TechCorp",
        },
      });

      assert(result.includes('<meta name="pinterest:title"'));
      assert(result.includes('<meta name="pinterest:description"'));
      assert(result.includes('<meta name="pinterest:url"'));
      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('<meta name="pinterest-rich-pin:price"'));
      assert(result.includes('<meta name="pinterest-rich-pin:currency"'));
      assert(result.includes('<meta name="pinterest-rich-pin:availability"'));
      assert(result.includes('<meta name="pinterest-rich-pin:brand"'));
    });

    it("should handle Tier 1 + Tier 3 (basic + video + board)", () => {
      const result = pinterest({
        domain: "example.com",
        title: "Tutorial Video",
        description: "Learn something new",
        video: {
          url: "/tutorial.mp4",
          type: "video/mp4",
          duration: 300,
        },
        board: {
          name: "Tutorials",
          url: "https://pinterest.com/mybrand/tutorials",
        },
      });

      assert(result.includes('<meta name="pinterest:title"'));
      assert(result.includes('<meta name="pinterest:description"'));
      assert(result.includes('<meta name="pinterest:video"'));
      assert(result.includes('<meta name="pinterest:video:type"'));
      assert(result.includes('<meta name="pinterest:video:duration"'));
      assert(result.includes('<meta name="pinterest-rich-pin:board:name"'));
      assert(result.includes('<meta name="pinterest-rich-pin:board:url"'));
    });

    it("should handle Tier 2 + Tier 3 (recipe + commerce)", () => {
      const result = pinterest({
        title: "Premium Recipe",
        description: "Exclusive recipe content",
        type: "recipe",
        recipe: {
          ingredients: ["Premium ingredient 1", "Premium ingredient 2"],
          instructions: ["Mix premium ingredients", "Cook to perfection"],
          cookTime: "25 minutes",
          servings: 4,
        },
        commerce: {
          buyable: true,
          purchaseUrl: "https://example.com/recipe-kit",
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:ingredients"'));
      assert(result.includes('<meta name="pinterest-rich-pin:instructions"'));
      assert(result.includes('<meta name="pinterest-rich-pin:cook_time"'));
      assert(result.includes('<meta name="pinterest-rich-pin:servings"'));
      assert(result.includes('<meta name="pinterest-rich-pin:buyable"'));
      assert(result.includes('<meta name="pinterest-rich-pin:purchase_url"'));
    });

    it("should handle all tiers combined", () => {
      const result = pinterest({
        domain: "example.com",
        url: "https://example.com/premium-recipe",
        title: "Ultimate Chocolate Cake Recipe",
        description: "Professional baking recipe with premium ingredients",
        image: [
          { url: "/cake-main.jpg", alt: "Finished chocolate cake" },
          { url: "/ingredients.jpg", alt: "Premium ingredients" },
        ],
        video: {
          url: "/baking-tutorial.mp4",
          type: "video/mp4",
          duration: 600,
          thumbnail: "/tutorial-thumb.jpg",
        },
        type: "recipe",
        recipe: {
          ingredients: ["8oz dark chocolate", "2 cups flour", "1 cup butter"],
          instructions: ["Melt chocolate", "Mix dry ingredients", "Bake at 350F"],
          cookTime: "45 minutes",
          prepTime: "20 minutes",
          servings: 12,
          nutrition: { calories: "350 kcal", fat: "18g" },
        },
        board: {
          name: "Premium Baking",
          url: "https://pinterest.com/mybrand/baking",
          description: "Professional baking recipes and techniques",
        },
        commerce: {
          buyable: true,
          purchaseUrl: "https://example.com/baking-kit",
          shipping: { cost: "9.99", freeThreshold: "75.00" },
        },
        analytics: {
          tagId: "987654321",
          conversionEvents: ["Recipe_Purchase"],
          audienceTargeting: ["Home_Bakers", "Foodies"],
        },
        verification: "pinterest-site-verification=xyz789",
      });

      // Tier 1 - Basic
      assert(result.includes('<meta name="pinterest:title"'));
      assert(result.includes('<meta name="pinterest:description"'));
      assert(result.includes('<meta name="pinterest:url"'));

      // Images (carousel)
      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('<meta name="pinterest:image1"'));

      // Video
      assert(result.includes('<meta name="pinterest:video"'));
      assert(result.includes('<meta name="pinterest:video:type"'));
      assert(result.includes('<meta name="pinterest:video:duration"'));
      assert(result.includes('<meta name="pinterest:video:thumbnail"'));

      // Tier 2 - Recipe rich pin
      assert(result.includes('<meta name="pinterest-rich-pin:ingredients"'));
      assert(result.includes('<meta name="pinterest-rich-pin:instructions"'));
      assert(result.includes('<meta name="pinterest-rich-pin:cook_time"'));
      assert(result.includes('<meta name="pinterest-rich-pin:prep_time"'));
      assert(result.includes('<meta name="pinterest-rich-pin:servings"'));
      assert(result.includes('<meta name="pinterest-rich-pin:nutrition:calories"'));

      // Tier 3 - Board and commerce
      assert(result.includes('<meta name="pinterest-rich-pin:board:name"'));
      assert(result.includes('<meta name="pinterest-rich-pin:board:url"'));
      assert(result.includes('<meta name="pinterest-rich-pin:buyable"'));
      assert(result.includes('<meta name="pinterest-rich-pin:purchase_url"'));
      assert(result.includes('<meta name="pinterest-rich-pin:shipping:cost"'));

      // Tier 4 - Analytics and verification
      assert(result.includes('<meta name="pinterest:tag"'));
      assert(result.includes('<meta name="pinterest:conversion"'));
      assert(result.includes('<meta name="pinterest:audience"'));
      assert(result.includes('<meta name="pinterest-site-verification"'));
    });
  });

  describe("Edge Cases", () => {
    it("should handle complex query parameters", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/product?id=123&utm_source=pinterest&ref=homepage",
        title: "Product",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/product?id=123&utm_source=pinterest&ref=homepage"'));
    });

    it("should handle URL-encoded characters", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/recipe?name=Chocolate%20Chip%20Cookies",
        title: "Recipe",
        description: "Description",
      });

      assert(result.includes('content="https://example.com/recipe?name=Chocolate%20Chip%20Cookies"'));
    });

    it("should handle subdomain domains", () => {
      const result = pinterest({
        domain: "blog.example.com",
        path: "/post",
        title: "Post",
        description: "Description",
      });

      assert(result.includes('content="https://blog.example.com/post"'));
    });

    it("should handle port numbers in domain", () => {
      const result = pinterest({
        domain: "localhost:3000",
        path: "/test",
        title: "Test",
        description: "Description",
      });

      assert(result.includes('content="https://localhost:3000/test"'));
    });

    it("should handle very long paths", () => {
      const longPath = "/blog/categories/baking/recipes/chocolate/cake/ultimate-chocolate-layer-cake-with-ganache";
      const result = pinterest({
        domain: "example.com",
        path: longPath,
        title: "Recipe",
        description: "Description",
      });

      assert(result.includes(`content="https://example.com${longPath}"`));
    });

    it("should handle Unicode characters in text fields", () => {
      const result = pinterest({
        title: "Délicieux Gâteau 🍰",
        description: "Recette française avec ingrédients premium",
        type: "recipe",
        recipe: {
          ingredients: ["200g chocolat noir", "100g beurre", "3 œufs"],
          instructions: ["Faire fondre le chocolat", "Battre les œufs", "Cuire 25 minutes"],
        },
      });

      assert(result.includes('content="Délicieux Gâteau 🍰"'));
      assert(result.includes('content="Recette française avec ingrédients premium"'));
      assert(result.includes('content="200g chocolat noir"'));
    });

    it("should handle very long text content", () => {
      const longTitle = "A".repeat(300);
      const longDescription = "B".repeat(600);
      const result = pinterest({
        title: longTitle,
        description: longDescription,
      });

      assert(result.includes(longTitle));
      assert(result.includes(longDescription));
    });

    it("should handle mixed absolute and relative URLs", () => {
      const result = pinterest({
        domain: "example.com",
        title: "Mixed URLs",
        description: "Description",
        image: "https://cdn.example.com/image.jpg",
        video: { url: "/video.mp4" },
      });

      assert(result.includes('content="https://cdn.example.com/image.jpg"'));
      assert(result.includes('content="https://example.com/video.mp4"'));
    });

    it("should handle empty arrays in all contexts", () => {
      const result = pinterest({
        title: "Test",
        description: "Test",
        image: [],
        article: { tags: [] },
        product: { variants: [] },
        recipe: { ingredients: [], instructions: [] },
        movie: { director: [], actor: [], genre: [] },
        book: { author: [] },
        analytics: { conversionEvents: [], audienceTargeting: [] },
      });

      assert(result.includes('<meta name="pinterest:title"'));
      assert(!result.includes('<meta name="pinterest:image"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:tag"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:variant"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:ingredients"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:movie:director"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:book:author"'));
      assert(!result.includes('<meta name="pinterest:conversion"'));
    });

    it("should handle zero and negative values gracefully", () => {
      const result = pinterest({
        title: "Test",
        description: "Test",
        image: { url: "/test.jpg", width: 0, height: -100 },
        video: { url: "/test.mp4", duration: 0 },
      });

      assert(result.includes('<meta name="pinterest:image:width"'));
      assert(result.includes('content="0"'));
      assert(result.includes('<meta name="pinterest:image:height"'));
      assert(result.includes('content="-100"'));
      assert(result.includes('<meta name="pinterest:video:duration"'));
    });

    it("should handle malformed objects gracefully", () => {
      const result = pinterest({
        title: "Product",
        description: "Test product",
        type: "product",
        product: {
          price: { amount: "invalid price", currency: "" },
          variants: [{ size: "", color: "" }],
        },
      });

      assert(result.includes('<meta name="pinterest-rich-pin:price"'));
      assert(result.includes('content="invalid price"'));
      // Empty currency should not generate a tag
      assert(!result.includes('<meta name="pinterest-rich-pin:currency"'));
      // Empty variant should not generate a tag
      assert(!result.includes('<meta name="pinterest-rich-pin:variant"'));
    });

    it("should handle missing optional properties gracefully", () => {
      const result = pinterest({
        title: "Minimal",
        description: "Minimal description",
      });

      assert(result.includes('<meta name="pinterest:title"'));
      assert(result.includes('<meta name="pinterest:description"'));
      assert(!result.includes('<meta name="pinterest:url"'));
      assert(!result.includes('<meta name="pinterest:image"'));
    });

    it("should handle extreme edge cases", () => {
      // Test with all possible empty/falsy values
      const result = pinterest({
        title: "Edge Case",
        description: "Testing edge cases",
        image: { url: "/test.jpg", width: null, height: undefined },
        video: { url: "/test.mp4", duration: null },
        recipe: {
          ingredients: [""],
          instructions: [null],
          servings: null,
          nutrition: { calories: "" },
        },
      });

      assert(result.includes('<meta name="pinterest:title"'));
      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('<meta name="pinterest:video"'));
      // Should not include empty/null values
      assert(!result.includes('<meta name="pinterest:image:width"'));
      assert(!result.includes('<meta name="pinterest:video:duration"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:ingredients"'));
      assert(!result.includes('<meta name="pinterest-rich-pin:nutrition:calories"'));
    });
  });

  describe("Schema and Output Validation", () => {
    it("should generate valid HTML markup structure", () => {
      const result = pinterest({
        title: "Test",
        description: "Test description",
      });

      assert(result.trim().startsWith("<meta"));
      const metaTagCount = (result.match(/<meta/g) || []).length;
      const closingTagCount = (result.match(/\/>/g) || []).length;
      assert.strictEqual(metaTagCount, closingTagCount);
    });

    it("should generate properly formatted Pinterest meta tags", () => {
      const result = pinterest({
        title: "Test Title",
        description: "Test Description",
      });

      assert(result.includes('name="pinterest:title"'));
      assert(result.includes('property="pinterest:title"'));
      assert(result.includes('name="pinterest:description"'));
      assert(result.includes('property="pinterest:description"'));
    });

    it("should ensure all generated URLs are HTTPS", () => {
      const result = pinterest({
        domain: "example.com",
        path: "/test",
        title: "Test",
        description: "Test description",
        image: "http://example.com/image.jpg",
        video: { url: "http://example.com/video.mp4" },
      });

      assert(!result.includes("http://"));
      assert(result.includes("https://"));
    });

    it("should handle malformed URLs gracefully", () => {
      const result = pinterest({
        domain: "example.com",
        title: "Test",
        description: "Test description",
        image: "not-a-url",
        video: { url: "invalid-url" },
      });

      assert(result.includes('<meta name="pinterest:image"'));
      assert(result.includes('content="https://example.com/not-a-url"'));
      assert(result.includes('<meta name="pinterest:video"'));
      assert(result.includes('content="https://example.com/invalid-url"'));
    });

    it("should properly escape HTML in content", () => {
      const result = pinterest({
        title: 'Test "Quote" & <Tag>',
        description: "Test description",
      });

      assert(!result.includes('Test "Quote" & <Tag>'));
      assert(result.includes("Test &quot;Quote&quot; &amp; &lt;Tag&gt;"));
    });

    it("should generate consistent property/name attributes", () => {
      const result = pinterest({
        title: "Test",
        description: "Test description",
        article: { author: "Test Author" },
      });

      const metaTags = result.match(/<meta[^>]*>/g) || [];
      for (const tag of metaTags) {
        if (tag.includes("pinterest:")) {
          assert(tag.includes('name="') || tag.includes('property="'));
        }
      }
    });

    it("should validate content type detection accuracy", () => {
      // Test various edge cases for content type detection
      const testCases = [
        { path: "/shop/item", title: "Buy this item", expected: "product" },
        { path: "/blog/article", title: "Read this post", expected: "article" },
        { path: "/recipes/dinner", title: "Easy dinner recipe", expected: "recipe" },
        { path: "/apps/mobile", title: "Download our app", expected: "app" },
        { path: "/movies/action", title: "Watch this movie", expected: "movie" },
        { path: "/places/restaurant", title: "Visit us here", expected: "place" },
        { path: "/books/tech", title: "Programming book", expected: "book" },
      ];

      for (const testCase of testCases) {
        const result = pinterest({
          domain: "example.com",
          path: testCase.path,
          title: testCase.title,
          description: "Test description",
        });

        assert(result.includes(`content="${testCase.expected}"`), `Failed for ${testCase.path}`);
      }
    });

    it("should handle Pinterest-specific character limits", () => {
      // Pinterest has character limits for descriptions
      const longDescription = "A".repeat(500); // Beyond typical limits
      const result = pinterest({
        title: "Test",
        description: longDescription,
      });

      assert(result.includes(longDescription));
    });

    it("should validate rich pin structure integrity", () => {
      const result = pinterest({
        title: "Rich Pin Test",
        description: "Testing rich pin structure",
        type: "product",
        product: {
          price: { amount: "29.99", currency: "USD" },
        },
      });

      // Ensure rich pin tags have proper structure
      const richPinTags =
        result.match(/name="pinterest-rich-pin:[^"]*"[^"]*property="pinterest-rich-pin:[^"]*"/g) || [];
      assert(richPinTags.length > 0, "No properly structured rich pin tags found");
    });
  });
});
