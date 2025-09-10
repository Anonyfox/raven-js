/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Progressive Pinterest rich pins generator with comprehensive visual commerce optimization.
 *
 * Generates sophisticated Pinterest meta tags that scale from basic pins to enterprise-level
 * rich pins integration. Each tier unlocks increasingly powerful visual commerce and
 * content discovery capabilities unique to Pinterest's ecosystem.
 */

import { escapeHtml, html } from "./index.js";
import { normalizeUrl } from "./url.js";

/**
 * @typedef {Object} PinterestImage
 * @property {string} url - Image URL
 * @property {string} [alt] - Alt text for accessibility
 * @property {number} [width] - Image width in pixels
 * @property {number} [height] - Image height in pixels
 */

/**
 * @typedef {Object} PinterestVideo
 * @property {string} url - Video URL
 * @property {string} [type] - Video MIME type
 * @property {number} [duration] - Video duration in seconds
 * @property {string} [thumbnail] - Video thumbnail URL
 */

/**
 * @typedef {Object} PinterestProductVariant
 * @property {string} [size] - Product size variant
 * @property {string} [color] - Product color variant
 * @property {string} [material] - Product material variant
 * @property {string} [style] - Product style variant
 * @property {string} [price] - Variant-specific price
 */

/**
 * @typedef {Object} PinterestRecipeNutrition
 * @property {string} [calories] - Calories per serving
 * @property {string} [protein] - Protein content
 * @property {string} [carbs] - Carbohydrate content
 * @property {string} [fat] - Fat content
 * @property {string} [fiber] - Fiber content
 * @property {string} [sugar] - Sugar content
 */

/**
 * @typedef {Object} PinterestConfig
 * @property {string} title - Pin title
 * @property {string} description - Pin description
 * @property {string} [domain] - Domain for URL construction
 * @property {string} [url] - Canonical URL
 * @property {PinterestImage|PinterestImage[]|string} [image] - Primary image(s)
 * @property {PinterestVideo} [video] - Video content
 * @property {string} [type] - Rich pin type (article, product, recipe, app, movie, place, book)
 * @property {Object} [article] - Article-specific metadata
 * @property {string} [article.author] - Article author
 * @property {string} [article.datePublished] - Publication date (ISO 8601)
 * @property {string} [article.section] - Article section/category
 * @property {string[]} [article.tags] - Article tags
 * @property {Object} [product] - Product-specific metadata
 * @property {Object} [product.price] - Product price
 * @property {string} [product.price.amount] - Price amount
 * @property {string} [product.price.currency] - Price currency
 * @property {string} [product.availability] - Product availability
 * @property {string} [product.brand] - Product brand
 * @property {string} [product.condition] - Product condition
 * @property {PinterestProductVariant[]} [product.variants] - Product variants
 * @property {Object} [recipe] - Recipe-specific metadata
 * @property {string[]} [recipe.ingredients] - Recipe ingredients
 * @property {string[]} [recipe.instructions] - Recipe instructions
 * @property {string} [recipe.cookTime] - Cooking time
 * @property {string} [recipe.prepTime] - Preparation time
 * @property {number} [recipe.servings] - Number of servings
 * @property {PinterestRecipeNutrition} [recipe.nutrition] - Nutritional information
 * @property {Object} [app] - App-specific metadata
 * @property {string} [app.name] - App name
 * @property {string} [app.platform] - App platform (ios, android)
 * @property {string} [app.deeplink] - App deeplink URL
 * @property {string} [app.rating] - App rating
 * @property {Object} [movie] - Movie-specific metadata
 * @property {string} [movie.title] - Movie title
 * @property {string[]} [movie.director] - Movie directors
 * @property {string[]} [movie.actor] - Movie actors
 * @property {string[]} [movie.genre] - Movie genres
 * @property {string} [movie.releaseDate] - Movie release date
 * @property {Object} [place] - Place-specific metadata
 * @property {string} [place.name] - Place name
 * @property {string} [place.address] - Place address
 * @property {string} [place.phone] - Place phone number
 * @property {Object} [place.coordinates] - Place coordinates
 * @property {number} [place.coordinates.lat] - Latitude
 * @property {number} [place.coordinates.lng] - Longitude
 * @property {string} [place.hours] - Place hours
 * @property {Object} [book] - Book-specific metadata
 * @property {string} [book.title] - Book title
 * @property {string[]} [book.author] - Book authors
 * @property {string} [book.isbn] - Book ISBN
 * @property {string} [book.genre] - Book genre
 * @property {number} [book.pageCount] - Book page count
 * @property {Object} [board] - Pinterest board metadata
 * @property {string} [board.name] - Board name
 * @property {string} [board.url] - Board URL
 * @property {string} [board.description] - Board description
 * @property {Object} [commerce] - Commerce integration
 * @property {boolean} [commerce.buyable] - Enable buyable pin
 * @property {string} [commerce.purchaseUrl] - Purchase URL
 * @property {string} [commerce.currency] - Commerce currency
 * @property {Object} [commerce.shipping] - Shipping information
 * @property {string} [commerce.shipping.cost] - Shipping cost
 * @property {string} [commerce.shipping.freeThreshold] - Free shipping threshold
 * @property {Object} [analytics] - Pinterest analytics
 * @property {string} [analytics.tagId] - Pinterest Tag ID
 * @property {string[]} [analytics.conversionEvents] - Conversion events
 * @property {string[]} [analytics.audienceTargeting] - Audience targeting
 * @property {string} [verification] - Pinterest domain verification
 */

/**
 * Detects Pinterest rich pin content type from URL patterns and content.
 *
 * @param {string} url - URL to analyze
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} [explicitType] - Explicitly provided type
 * @returns {string} Detected Pinterest rich pin type
 */
const detectPinterestType = (url, title, description, explicitType) => {
  if (explicitType) return explicitType;

  const titleLower = title ? title.toLowerCase() : "";
  const descLower = description ? description.toLowerCase() : "";
  const urlLower = url ? url.toLowerCase() : "";

  // Product detection (highest priority for commerce)
  if (
    urlLower.includes("/products/") ||
    urlLower.includes("/product/") ||
    urlLower.includes("/shop/") ||
    urlLower.includes("/store/") ||
    urlLower.includes("/buy/") ||
    titleLower.includes("product") ||
    titleLower.includes("price") ||
    descLower.includes("price") ||
    descLower.includes("buy now") ||
    descLower.includes("purchase") ||
    descLower.includes("$") ||
    /\$\d+/.test(descLower)
  ) {
    return "product";
  }

  // Recipe detection
  if (
    urlLower.includes("/recipes/") ||
    urlLower.includes("/recipe/") ||
    titleLower.includes("recipe") ||
    titleLower.includes("how to make") ||
    titleLower.includes("cooking") ||
    descLower.includes("ingredients") ||
    descLower.includes("cook") ||
    descLower.includes("servings") ||
    descLower.includes("minutes") ||
    /\d+ minutes|\d+ hours/.test(descLower)
  ) {
    return "recipe";
  }

  // Article/blog detection
  if (
    urlLower.includes("/blog/") ||
    urlLower.includes("/article/") ||
    urlLower.includes("/news/") ||
    urlLower.includes("/post/") ||
    titleLower.includes("article") ||
    titleLower.includes("blog") ||
    descLower.includes("published") ||
    (descLower.includes("author") && descLower.includes("published"))
  ) {
    return "article";
  }

  // App detection
  if (
    urlLower.includes("/app") ||
    urlLower.includes("/apps/") ||
    titleLower.includes("app") ||
    titleLower.includes("download") ||
    descLower.includes("ios") ||
    descLower.includes("android") ||
    descLower.includes("mobile app")
  ) {
    return "app";
  }

  // Movie/TV detection
  if (
    urlLower.includes("/movies/") ||
    urlLower.includes("/movie/") ||
    urlLower.includes("/tv/") ||
    urlLower.includes("/series/") ||
    titleLower.includes("movie") ||
    titleLower.includes("film") ||
    titleLower.includes("tv show") ||
    descLower.includes("director") ||
    descLower.includes("actor") ||
    descLower.includes("starring")
  ) {
    return "movie";
  }

  // Place/location detection
  if (
    urlLower.includes("/places/") ||
    urlLower.includes("/location/") ||
    titleLower.includes("restaurant") ||
    titleLower.includes("hotel") ||
    titleLower.includes("business") ||
    descLower.includes("address") ||
    descLower.includes("phone") ||
    descLower.includes("located")
  ) {
    return "place";
  }

  // Book detection
  if (
    urlLower.includes("/books/") ||
    urlLower.includes("/book/") ||
    titleLower.includes("book") ||
    titleLower.includes("novel") ||
    titleLower.includes("ebook") ||
    descLower.includes("isbn") ||
    descLower.includes("author") ||
    descLower.includes("pages")
  ) {
    return "book";
  }

  return "article"; // Default fallback
};

/**
 * Generates progressive Pinterest rich pins with comprehensive visual commerce optimization.
 *
 * **Tier 1 (Basic Pinterest):** Fundamental pin metadata for all content
 * **Tier 2 (Rich Pins):** Type-specific structured data for articles, products, recipes, etc.
 * **Tier 3 (Advanced Pinterest):** Video pins, carousel pins, board integration, commerce
 * **Tier 4 (Enterprise Pinterest):** Analytics integration, domain verification, attribution
 *
 * Each configuration option unlocks additional Pinterest-specific markup without redundancy.
 * Missing options generate no corresponding markup, ensuring clean output.
 *
 * @param {PinterestConfig} config - Progressive Pinterest configuration
 * @returns {string} Generated Pinterest HTML markup
 *
 * @example
 * // Tier 1: Basic Pinterest pin
 * pinterest({
 *   domain: 'example.com',
 *   title: 'My Amazing Content',
 *   description: 'Check out this inspiring content',
 *   image: '/hero-image.jpg'
 * });
 * // → Basic Pinterest metadata for enhanced pin previews
 *
 * @example
 * // Tier 2: Product rich pin (maximum commerce value)
 * pinterest({
 *   domain: 'example.com',
 *   title: 'Beautiful Dress',
 *   description: 'Elegant evening dress',
 *   type: 'product',
 *   image: '/dress.jpg',
 *   product: {
 *     price: { amount: '89.99', currency: 'USD' },
 *     availability: 'in stock',
 *     brand: 'FashionBrand',
 *     variants: [
 *       { size: 'S', color: 'Red' },
 *       { size: 'M', color: 'Blue' }
 *     ]
 *   }
 * });
 * // → Product rich pin with commerce integration
 *
 * @example
 * // Tier 2: Recipe rich pin (maximum engagement value)
 * pinterest({
 *   domain: 'example.com',
 *   title: 'Chocolate Chip Cookies',
 *   description: 'Classic homemade cookies',
 *   type: 'recipe',
 *   image: '/cookies.jpg',
 *   recipe: {
 *     ingredients: ['2 cups flour', '1 cup butter', '3/4 cup sugar'],
 *     instructions: ['Cream butter and sugar', 'Add flour', 'Bake at 350F'],
 *     cookTime: '12 minutes',
 *     prepTime: '15 minutes',
 *     servings: 24
 *   }
 * });
 * // → Recipe rich pin with full cooking metadata
 *
 * @example
 * // Tier 3: Video pin with board integration
 * pinterest({
 *   domain: 'example.com',
 *   title: 'Product Tutorial',
 *   description: 'Learn how to use our product',
 *   video: {
 *     url: '/tutorial.mp4',
 *     type: 'video/mp4',
 *     duration: 180,
 *     thumbnail: '/tutorial-thumb.jpg'
 *   },
 *   board: {
 *     name: 'Product Tutorials',
 *     url: 'https://pinterest.com/mybrand/tutorials'
 *   }
 * });
 * // → Video pin optimized for Pinterest's board system
 *
 * @example
 * // Tier 4: Enterprise commerce with analytics
 * pinterest({
 *   domain: 'example.com',
 *   title: 'Premium Widget',
 *   description: 'Professional grade widget',
 *   type: 'product',
 *   product: {
 *     price: { amount: '299.99', currency: 'USD' },
 *     availability: 'in stock'
 *   },
 *   commerce: {
 *     buyable: true,
 *     purchaseUrl: 'https://example.com/buy/widget'
 *   },
 *   analytics: {
 *     tagId: '123456789',
 *     conversionEvents: ['Purchase', 'AddToCart']
 *   }
 * });
 * // → Enterprise Pinterest integration with commerce and analytics
 */
/**
 * @param {PinterestConfig} config - Progressive Pinterest configuration
 * @returns {string} Generated Pinterest markup
 */
export const pinterest = (/** @type {PinterestConfig} */ config) => {
  if (!config || typeof config !== "object") return "";
  const {
    domain,
    url,
    title,
    description,
    image,
    video,
    type,
    article,
    product,
    recipe,
    app,
    movie,
    place,
    book,
    board,
    commerce,
    analytics,
    verification,
  } = /** @type {any} */ (config);

  if (!title || !description) return "";

  // Escape HTML entities in title and description
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  // Determine canonical URL with Pinterest optimization
  let canonicalUrl;
  if (url) {
    canonicalUrl = normalizeUrl(url, domain || "example.com");
  } else if (/** @type {any} */ (config).path !== undefined) {
    // Support legacy path parameter for backward compatibility
    const path = /** @type {any} */ (config).path;
    if (path) {
      canonicalUrl = normalizeUrl(path, domain || "example.com");
    } else if (domain) {
      canonicalUrl = `https://${domain}`;
    }
  } else if (domain) {
    canonicalUrl = `https://${domain}`;
  }

  // Auto-detect content type if not provided
  const detectedType = detectPinterestType(canonicalUrl, title, description, type);

  // Tier 1: Basic Pinterest tags (always present)
  let markup = html`
		<meta name="pinterest:title" property="pinterest:title" content="${escapedTitle}" />
		<meta name="pinterest:description" property="pinterest:description" content="${escapedDescription}" />
		<meta name="pinterest:content-type" property="pinterest:content-type" content="${detectedType}" />
	`;

  // Add URL if available
  if (canonicalUrl) {
    markup += html`
			<meta name="pinterest:url" property="pinterest:url" content="${canonicalUrl}" />
		`;
  }

  // Handle primary image
  if (image) {
    if (typeof image === "string") {
      // Simple string image
      const imageUrl = domain ? normalizeUrl(image, domain) : image;
      markup += html`
				<meta name="pinterest:image" property="pinterest:image" content="${imageUrl}" />
			`;
    } else if (Array.isArray(image) && image.length > 0) {
      // Multiple images for carousel
      for (let i = 0; i < Math.min(image.length, 5); i++) {
        const img = image[i];
        const imageUrl = domain ? normalizeUrl(img.url, domain) : img.url;
        markup += html`
					<meta name="pinterest:image${i > 0 ? i : ""}" property="pinterest:image${i > 0 ? i : ""}" content="${imageUrl}" />
				`;
        if (img.alt) {
          markup += html`
						<meta name="pinterest:image${i > 0 ? i : ""}:alt" property="pinterest:image${i > 0 ? i : ""}:alt" content="${img.alt}" />
					`;
        }
      }
    } else if (typeof image === "object" && !Array.isArray(image) && /** @type {PinterestImage} */ (image).url) {
      // Single rich image object
      const imageUrl = domain
        ? normalizeUrl(/** @type {PinterestImage} */ (image).url, domain)
        : /** @type {PinterestImage} */ (image).url;
      markup += html`
				<meta name="pinterest:image" property="pinterest:image" content="${imageUrl}" />
			`;
      if (/** @type {PinterestImage} */ (image).alt) {
        markup += html`
					<meta name="pinterest:image:alt" property="pinterest:image:alt" content="${/** @type {PinterestImage} */ (image).alt}" />
				`;
      }
      if (
        /** @type {PinterestImage} */ (image).width !== undefined &&
        /** @type {PinterestImage} */ (image).width !== null
      ) {
        markup += html`
					<meta name="pinterest:image:width" property="pinterest:image:width" content="${/** @type {PinterestImage} */ (image).width}" />
				`;
      }
      if (
        /** @type {PinterestImage} */ (image).height !== undefined &&
        /** @type {PinterestImage} */ (image).height !== null
      ) {
        markup += html`
					<meta name="pinterest:image:height" property="pinterest:image:height" content="${/** @type {PinterestImage} */ (image).height}" />
				`;
      }
    }
  }

  // Handle video
  if (video?.url) {
    const videoUrl = domain ? normalizeUrl(video.url, domain) : video.url;
    markup += html`
			<meta name="pinterest:video" property="pinterest:video" content="${videoUrl}" />
		`;
    if (video.type) {
      markup += html`
				<meta name="pinterest:video:type" property="pinterest:video:type" content="${video.type}" />
			`;
    }
    if (video.duration !== undefined && video.duration !== null) {
      markup += html`
				<meta name="pinterest:video:duration" property="pinterest:video:duration" content="${video.duration}" />
			`;
    }
    if (video.thumbnail) {
      const thumbUrl = domain ? normalizeUrl(video.thumbnail, domain) : video.thumbnail;
      markup += html`
				<meta name="pinterest:video:thumbnail" property="pinterest:video:thumbnail" content="${thumbUrl}" />
			`;
    }
  }

  // Tier 2: Rich Pins content type specialization
  if (detectedType === "article" && article) {
    markup += html`
			<meta name="pinterest-rich-pin:title" property="pinterest-rich-pin:title" content="${escapedTitle}" />
			<meta name="pinterest-rich-pin:description" property="pinterest-rich-pin:description" content="${escapedDescription}" />
		`;

    if (canonicalUrl) {
      markup += html`
				<meta name="pinterest-rich-pin:url" property="pinterest-rich-pin:url" content="${canonicalUrl}" />
			`;
    }

    const { author, datePublished, section, tags } = article;

    if (author) {
      markup += html`
				<meta name="pinterest-rich-pin:author" property="pinterest-rich-pin:author" content="${author}" />
			`;
    }

    if (datePublished) {
      markup += html`
				<meta name="pinterest-rich-pin:date_published" property="pinterest-rich-pin:date_published" content="${datePublished}" />
			`;
    }

    if (section) {
      markup += html`
				<meta name="pinterest-rich-pin:section" property="pinterest-rich-pin:section" content="${section}" />
			`;
    }

    if (tags && tags.length > 0) {
      for (const tag of tags.slice(0, 5)) {
        // Limit to 5 tags
        markup += html`
					<meta name="pinterest-rich-pin:tag" property="pinterest-rich-pin:tag" content="${tag}" />
				`;
      }
    }
  }

  if (detectedType === "product" && product) {
    const { price, availability, brand, condition, variants } = product;

    if (price?.amount) {
      markup += html`
				<meta name="pinterest-rich-pin:price" property="pinterest-rich-pin:price" content="${price.amount}" />
			`;
      if (price.currency) {
        markup += html`
					<meta name="pinterest-rich-pin:currency" property="pinterest-rich-pin:currency" content="${price.currency}" />
				`;
      }
    }

    if (availability) {
      markup += html`
				<meta name="pinterest-rich-pin:availability" property="pinterest-rich-pin:availability" content="${availability}" />
			`;
    }

    if (brand) {
      markup += html`
				<meta name="pinterest-rich-pin:brand" property="pinterest-rich-pin:brand" content="${brand}" />
			`;
    }

    if (condition) {
      markup += html`
				<meta name="pinterest-rich-pin:condition" property="pinterest-rich-pin:condition" content="${condition}" />
			`;
    }

    if (variants && variants.length > 0) {
      for (const variant of variants.slice(0, 10)) {
        // Limit variants
        let variantStr = "";
        if (variant.size) variantStr += `Size: ${variant.size}`;
        if (variant.color) variantStr += `${variantStr ? ", " : ""}Color: ${variant.color}`;
        if (variant.material) variantStr += `${variantStr ? ", " : ""}Material: ${variant.material}`;
        if (variant.style) variantStr += `${variantStr ? ", " : ""}Style: ${variant.style}`;

        if (variantStr) {
          markup += html`
						<meta name="pinterest-rich-pin:variant" property="pinterest-rich-pin:variant" content="${variantStr}" />
					`;
        }
      }
    }
  }

  if (detectedType === "recipe" && recipe) {
    const { ingredients, instructions, cookTime, prepTime, servings, nutrition } = recipe;

    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients.slice(0, 20)) {
        // Limit ingredients
        markup += html`
					<meta name="pinterest-rich-pin:ingredients" property="pinterest-rich-pin:ingredients" content="${ingredient}" />
				`;
      }
    }

    if (instructions && instructions.length > 0) {
      for (const instruction of instructions.slice(0, 15)) {
        // Limit instructions
        markup += html`
					<meta name="pinterest-rich-pin:instructions" property="pinterest-rich-pin:instructions" content="${instruction}" />
				`;
      }
    }

    if (cookTime) {
      markup += html`
				<meta name="pinterest-rich-pin:cook_time" property="pinterest-rich-pin:cook_time" content="${cookTime}" />
			`;
    }

    if (prepTime) {
      markup += html`
				<meta name="pinterest-rich-pin:prep_time" property="pinterest-rich-pin:prep_time" content="${prepTime}" />
			`;
    }

    if (servings !== undefined) {
      markup += html`
				<meta name="pinterest-rich-pin:servings" property="pinterest-rich-pin:servings" content="${servings}" />
			`;
    }

    if (nutrition) {
      if (nutrition.calories) {
        markup += html`
					<meta name="pinterest-rich-pin:nutrition:calories" property="pinterest-rich-pin:nutrition:calories" content="${nutrition.calories}" />
				`;
      }
      if (nutrition.protein) {
        markup += html`
					<meta name="pinterest-rich-pin:nutrition:protein" property="pinterest-rich-pin:nutrition:protein" content="${nutrition.protein}" />
				`;
      }
      if (nutrition.carbs) {
        markup += html`
					<meta name="pinterest-rich-pin:nutrition:carbs" property="pinterest-rich-pin:nutrition:carbs" content="${nutrition.carbs}" />
				`;
      }
      if (nutrition.fat) {
        markup += html`
					<meta name="pinterest-rich-pin:nutrition:fat" property="pinterest-rich-pin:nutrition:fat" content="${nutrition.fat}" />
				`;
      }
    }
  }

  if (detectedType === "app" && app) {
    const { name, platform, deeplink, rating } = app;

    if (name) {
      markup += html`
				<meta name="pinterest-rich-pin:app:name" property="pinterest-rich-pin:app:name" content="${name}" />
			`;
    }

    if (platform) {
      markup += html`
				<meta name="pinterest-rich-pin:app:platform" property="pinterest-rich-pin:app:platform" content="${platform}" />
			`;
    }

    if (deeplink) {
      markup += html`
				<meta name="pinterest-rich-pin:app:deeplink" property="pinterest-rich-pin:app:deeplink" content="${deeplink}" />
			`;
    }

    if (rating) {
      markup += html`
				<meta name="pinterest-rich-pin:app:rating" property="pinterest-rich-pin:app:rating" content="${rating}" />
			`;
    }
  }

  if (detectedType === "movie" && movie) {
    const {
      title: movieTitle,
      director,
      directors,
      actor,
      actors,
      genre,
      genres,
      releaseDate,
    } = /** @type {any} */ (movie);
    const movieDirectors = director || directors;
    const movieActors = actor || actors;
    const movieGenres = genre || genres;

    if (movieTitle) {
      markup += html`
				<meta name="pinterest-rich-pin:movie:title" property="pinterest-rich-pin:movie:title" content="${movieTitle}" />
			`;
    }

    if (movieDirectors && movieDirectors.length > 0) {
      for (const dir of movieDirectors.slice(0, 3)) {
        markup += html`
					<meta name="pinterest-rich-pin:movie:director" property="pinterest-rich-pin:movie:director" content="${dir}" />
				`;
      }
    }

    if (movieActors && movieActors.length > 0) {
      for (const act of movieActors.slice(0, 5)) {
        markup += html`
					<meta name="pinterest-rich-pin:movie:actor" property="pinterest-rich-pin:movie:actor" content="${act}" />
				`;
      }
    }

    if (movieGenres && movieGenres.length > 0) {
      for (const gen of movieGenres.slice(0, 3)) {
        markup += html`
					<meta name="pinterest-rich-pin:movie:genre" property="pinterest-rich-pin:movie:genre" content="${gen}" />
				`;
      }
    }

    if (releaseDate) {
      markup += html`
				<meta name="pinterest-rich-pin:movie:release_date" property="pinterest-rich-pin:movie:release_date" content="${releaseDate}" />
			`;
    }
  }

  if (detectedType === "place" && place) {
    const { name, address, phone, coordinates, hours } = place;

    if (name) {
      markup += html`
				<meta name="pinterest-rich-pin:place:name" property="pinterest-rich-pin:place:name" content="${name}" />
			`;
    }

    if (address) {
      markup += html`
				<meta name="pinterest-rich-pin:place:address" property="pinterest-rich-pin:place:address" content="${address}" />
			`;
    }

    if (phone) {
      markup += html`
				<meta name="pinterest-rich-pin:place:phone" property="pinterest-rich-pin:place:phone" content="${phone}" />
			`;
    }

    if (coordinates && coordinates.lat !== undefined && coordinates.lng !== undefined) {
      markup += html`
				<meta name="pinterest-rich-pin:place:coordinates" property="pinterest-rich-pin:place:coordinates" content="${coordinates.lat},${coordinates.lng}" />
			`;
    }

    if (hours) {
      markup += html`
				<meta name="pinterest-rich-pin:place:hours" property="pinterest-rich-pin:place:hours" content="${hours}" />
			`;
    }
  }

  if (detectedType === "book" && book) {
    const { title: bookTitle, author, authors, isbn, genre, pageCount } = /** @type {any} */ (book);
    const bookAuthors = author || authors;

    if (bookTitle) {
      markup += html`
				<meta name="pinterest-rich-pin:book:title" property="pinterest-rich-pin:book:title" content="${bookTitle}" />
			`;
    }

    if (bookAuthors && bookAuthors.length > 0) {
      for (const auth of bookAuthors.slice(0, 3)) {
        markup += html`
					<meta name="pinterest-rich-pin:book:author" property="pinterest-rich-pin:book:author" content="${auth}" />
				`;
      }
    }

    if (isbn) {
      markup += html`
				<meta name="pinterest-rich-pin:book:isbn" property="pinterest-rich-pin:book:isbn" content="${isbn}" />
			`;
    }

    if (genre) {
      markup += html`
				<meta name="pinterest-rich-pin:book:genre" property="pinterest-rich-pin:book:genre" content="${genre}" />
			`;
    }

    if (pageCount !== undefined) {
      markup += html`
				<meta name="pinterest-rich-pin:book:page_count" property="pinterest-rich-pin:book:page_count" content="${pageCount}" />
			`;
    }
  }

  // Tier 3: Advanced Pinterest features
  if (board) {
    const { name, url, description } = board;

    if (name) {
      markup += html`
				<meta name="pinterest-rich-pin:board:name" property="pinterest-rich-pin:board:name" content="${name}" />
			`;
    }

    if (url) {
      markup += html`
				<meta name="pinterest-rich-pin:board:url" property="pinterest-rich-pin:board:url" content="${url}" />
			`;
    }

    if (description) {
      markup += html`
				<meta name="pinterest-rich-pin:board:description" property="pinterest-rich-pin:board:description" content="${description}" />
			`;
    }
  }

  if (commerce) {
    const { buyable, purchaseUrl, currency, shipping } = commerce;

    if (buyable) {
      markup += html`
				<meta name="pinterest-rich-pin:buyable" property="pinterest-rich-pin:buyable" content="true" />
			`;
    }

    if (purchaseUrl) {
      markup += html`
				<meta name="pinterest-rich-pin:purchase_url" property="pinterest-rich-pin:purchase_url" content="${purchaseUrl}" />
			`;
    }

    if (currency) {
      markup += html`
				<meta name="pinterest-rich-pin:currency" property="pinterest-rich-pin:currency" content="${currency}" />
			`;
    }

    if (shipping) {
      if (shipping.cost) {
        markup += html`
					<meta name="pinterest-rich-pin:shipping:cost" property="pinterest-rich-pin:shipping:cost" content="${shipping.cost}" />
				`;
      }
      if (shipping.freeThreshold) {
        markup += html`
					<meta name="pinterest-rich-pin:shipping:free_threshold" property="pinterest-rich-pin:shipping:free_threshold" content="${shipping.freeThreshold}" />
				`;
      }
    }
  }

  // Tier 4: Enterprise Pinterest integration
  if (analytics) {
    const { tagId, conversionEvents, audienceTargeting } = analytics;

    if (tagId) {
      markup += html`
				<meta name="pinterest:tag" property="pinterest:tag" content="${tagId}" />
			`;
    }

    if (conversionEvents && conversionEvents.length > 0) {
      for (const event of conversionEvents.slice(0, 5)) {
        markup += html`
					<meta name="pinterest:conversion" property="pinterest:conversion" content="${event}" />
				`;
      }
    }

    if (audienceTargeting && audienceTargeting.length > 0) {
      for (const audience of audienceTargeting.slice(0, 5)) {
        markup += html`
					<meta name="pinterest:audience" property="pinterest:audience" content="${audience}" />
				`;
      }
    }
  }

  if (verification) {
    markup += html`
			<meta name="pinterest-site-verification" property="pinterest-site-verification" content="${verification}" />
		`;
  }

  return markup;
};
