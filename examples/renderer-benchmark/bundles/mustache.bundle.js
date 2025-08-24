// node_modules/mustache/mustache.mjs
var objectToString = Object.prototype.toString;
var isArray = Array.isArray || function isArrayPolyfill(object) {
  return objectToString.call(object) === "[object Array]";
};
function isFunction(object) {
  return typeof object === "function";
}
function typeStr(obj) {
  return isArray(obj) ? "array" : typeof obj;
}
function escapeRegExp(string) {
  return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function hasProperty(obj, propName) {
  return obj != null && typeof obj === "object" && propName in obj;
}
function primitiveHasOwnProperty(primitive, propName) {
  return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName);
}
var regExpTest = RegExp.prototype.test;
function testRegExp(re, string) {
  return regExpTest.call(re, string);
}
var nonSpaceRe = /\S/;
function isWhitespace(string) {
  return !testRegExp(nonSpaceRe, string);
}
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};
function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
    return entityMap[s];
  });
}
var whiteRe = /\s*/;
var spaceRe = /\s+/;
var equalsRe = /\s*=/;
var curlyRe = /\s*\}/;
var tagRe = /#|\^|\/|>|\{|&|=|!/;
function parseTemplate(template2, tags2) {
  if (!template2)
    return [];
  var lineHasNonSpace = false;
  var sections = [];
  var tokens = [];
  var spaces = [];
  var hasTag = false;
  var nonSpace = false;
  var indentation = "";
  var tagIndex = 0;
  function stripSpace() {
    if (hasTag && !nonSpace) {
      while (spaces.length)
        delete tokens[spaces.pop()];
    } else {
      spaces = [];
    }
    hasTag = false;
    nonSpace = false;
  }
  var openingTagRe, closingTagRe, closingCurlyRe;
  function compileTags(tagsToCompile) {
    if (typeof tagsToCompile === "string")
      tagsToCompile = tagsToCompile.split(spaceRe, 2);
    if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
      throw new Error("Invalid tags: " + tagsToCompile);
    openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*");
    closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1]));
    closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1]));
  }
  compileTags(tags2 || mustache.tags);
  var scanner = new Scanner(template2);
  var start, type, value, chr, token, openSection;
  while (!scanner.eos()) {
    start = scanner.pos;
    value = scanner.scanUntil(openingTagRe);
    if (value) {
      for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
        chr = value.charAt(i);
        if (isWhitespace(chr)) {
          spaces.push(tokens.length);
          indentation += chr;
        } else {
          nonSpace = true;
          lineHasNonSpace = true;
          indentation += " ";
        }
        tokens.push(["text", chr, start, start + 1]);
        start += 1;
        if (chr === "\n") {
          stripSpace();
          indentation = "";
          tagIndex = 0;
          lineHasNonSpace = false;
        }
      }
    }
    if (!scanner.scan(openingTagRe))
      break;
    hasTag = true;
    type = scanner.scan(tagRe) || "name";
    scanner.scan(whiteRe);
    if (type === "=") {
      value = scanner.scanUntil(equalsRe);
      scanner.scan(equalsRe);
      scanner.scanUntil(closingTagRe);
    } else if (type === "{") {
      value = scanner.scanUntil(closingCurlyRe);
      scanner.scan(curlyRe);
      scanner.scanUntil(closingTagRe);
      type = "&";
    } else {
      value = scanner.scanUntil(closingTagRe);
    }
    if (!scanner.scan(closingTagRe))
      throw new Error("Unclosed tag at " + scanner.pos);
    if (type == ">") {
      token = [type, value, start, scanner.pos, indentation, tagIndex, lineHasNonSpace];
    } else {
      token = [type, value, start, scanner.pos];
    }
    tagIndex++;
    tokens.push(token);
    if (type === "#" || type === "^") {
      sections.push(token);
    } else if (type === "/") {
      openSection = sections.pop();
      if (!openSection)
        throw new Error('Unopened section "' + value + '" at ' + start);
      if (openSection[1] !== value)
        throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
    } else if (type === "name" || type === "{" || type === "&") {
      nonSpace = true;
    } else if (type === "=") {
      compileTags(value);
    }
  }
  stripSpace();
  openSection = sections.pop();
  if (openSection)
    throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
  return nestTokens(squashTokens(tokens));
}
function squashTokens(tokens) {
  var squashedTokens = [];
  var token, lastToken;
  for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i];
    if (token) {
      if (token[0] === "text" && lastToken && lastToken[0] === "text") {
        lastToken[1] += token[1];
        lastToken[3] = token[3];
      } else {
        squashedTokens.push(token);
        lastToken = token;
      }
    }
  }
  return squashedTokens;
}
function nestTokens(tokens) {
  var nestedTokens = [];
  var collector = nestedTokens;
  var sections = [];
  var token, section;
  for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    token = tokens[i];
    switch (token[0]) {
      case "#":
      case "^":
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case "/":
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
    }
  }
  return nestedTokens;
}
function Scanner(string) {
  this.string = string;
  this.tail = string;
  this.pos = 0;
}
Scanner.prototype.eos = function eos() {
  return this.tail === "";
};
Scanner.prototype.scan = function scan(re) {
  var match = this.tail.match(re);
  if (!match || match.index !== 0)
    return "";
  var string = match[0];
  this.tail = this.tail.substring(string.length);
  this.pos += string.length;
  return string;
};
Scanner.prototype.scanUntil = function scanUntil(re) {
  var index = this.tail.search(re), match;
  switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
  }
  this.pos += match.length;
  return match;
};
function Context(view, parentContext) {
  this.view = view;
  this.cache = { ".": this.view };
  this.parent = parentContext;
}
Context.prototype.push = function push(view) {
  return new Context(view, this);
};
Context.prototype.lookup = function lookup(name) {
  var cache = this.cache;
  var value;
  if (cache.hasOwnProperty(name)) {
    value = cache[name];
  } else {
    var context = this, intermediateValue, names, index, lookupHit = false;
    while (context) {
      if (name.indexOf(".") > 0) {
        intermediateValue = context.view;
        names = name.split(".");
        index = 0;
        while (intermediateValue != null && index < names.length) {
          if (index === names.length - 1)
            lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]);
          intermediateValue = intermediateValue[names[index++]];
        }
      } else {
        intermediateValue = context.view[name];
        lookupHit = hasProperty(context.view, name);
      }
      if (lookupHit) {
        value = intermediateValue;
        break;
      }
      context = context.parent;
    }
    cache[name] = value;
  }
  if (isFunction(value))
    value = value.call(this.view);
  return value;
};
function Writer() {
  this.templateCache = {
    _cache: {},
    set: function set(key, value) {
      this._cache[key] = value;
    },
    get: function get(key) {
      return this._cache[key];
    },
    clear: function clear() {
      this._cache = {};
    }
  };
}
Writer.prototype.clearCache = function clearCache() {
  if (typeof this.templateCache !== "undefined") {
    this.templateCache.clear();
  }
};
Writer.prototype.parse = function parse(template2, tags2) {
  var cache = this.templateCache;
  var cacheKey = template2 + ":" + (tags2 || mustache.tags).join(":");
  var isCacheEnabled = typeof cache !== "undefined";
  var tokens = isCacheEnabled ? cache.get(cacheKey) : void 0;
  if (tokens == void 0) {
    tokens = parseTemplate(template2, tags2);
    isCacheEnabled && cache.set(cacheKey, tokens);
  }
  return tokens;
};
Writer.prototype.render = function render(template2, view, partials, config) {
  var tags2 = this.getConfigTags(config);
  var tokens = this.parse(template2, tags2);
  var context = view instanceof Context ? view : new Context(view, void 0);
  return this.renderTokens(tokens, context, partials, template2, config);
};
Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, config) {
  var buffer = "";
  var token, symbol, value;
  for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
    value = void 0;
    token = tokens[i];
    symbol = token[0];
    if (symbol === "#") value = this.renderSection(token, context, partials, originalTemplate, config);
    else if (symbol === "^") value = this.renderInverted(token, context, partials, originalTemplate, config);
    else if (symbol === ">") value = this.renderPartial(token, context, partials, config);
    else if (symbol === "&") value = this.unescapedValue(token, context);
    else if (symbol === "name") value = this.escapedValue(token, context, config);
    else if (symbol === "text") value = this.rawValue(token);
    if (value !== void 0)
      buffer += value;
  }
  return buffer;
};
Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate, config) {
  var self = this;
  var buffer = "";
  var value = context.lookup(token[1]);
  function subRender(template2) {
    return self.render(template2, context, partials, config);
  }
  if (!value) return;
  if (isArray(value)) {
    for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
      buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate, config);
    }
  } else if (typeof value === "object" || typeof value === "string" || typeof value === "number") {
    buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate, config);
  } else if (isFunction(value)) {
    if (typeof originalTemplate !== "string")
      throw new Error("Cannot use higher-order sections without the original template");
    value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
    if (value != null)
      buffer += value;
  } else {
    buffer += this.renderTokens(token[4], context, partials, originalTemplate, config);
  }
  return buffer;
};
Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate, config) {
  var value = context.lookup(token[1]);
  if (!value || isArray(value) && value.length === 0)
    return this.renderTokens(token[4], context, partials, originalTemplate, config);
};
Writer.prototype.indentPartial = function indentPartial(partial, indentation, lineHasNonSpace) {
  var filteredIndentation = indentation.replace(/[^ \t]/g, "");
  var partialByNl = partial.split("\n");
  for (var i = 0; i < partialByNl.length; i++) {
    if (partialByNl[i].length && (i > 0 || !lineHasNonSpace)) {
      partialByNl[i] = filteredIndentation + partialByNl[i];
    }
  }
  return partialByNl.join("\n");
};
Writer.prototype.renderPartial = function renderPartial(token, context, partials, config) {
  if (!partials) return;
  var tags2 = this.getConfigTags(config);
  var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
  if (value != null) {
    var lineHasNonSpace = token[6];
    var tagIndex = token[5];
    var indentation = token[4];
    var indentedValue = value;
    if (tagIndex == 0 && indentation) {
      indentedValue = this.indentPartial(value, indentation, lineHasNonSpace);
    }
    var tokens = this.parse(indentedValue, tags2);
    return this.renderTokens(tokens, context, partials, indentedValue, config);
  }
};
Writer.prototype.unescapedValue = function unescapedValue(token, context) {
  var value = context.lookup(token[1]);
  if (value != null)
    return value;
};
Writer.prototype.escapedValue = function escapedValue(token, context, config) {
  var escape = this.getConfigEscape(config) || mustache.escape;
  var value = context.lookup(token[1]);
  if (value != null)
    return typeof value === "number" && escape === mustache.escape ? String(value) : escape(value);
};
Writer.prototype.rawValue = function rawValue(token) {
  return token[1];
};
Writer.prototype.getConfigTags = function getConfigTags(config) {
  if (isArray(config)) {
    return config;
  } else if (config && typeof config === "object") {
    return config.tags;
  } else {
    return void 0;
  }
};
Writer.prototype.getConfigEscape = function getConfigEscape(config) {
  if (config && typeof config === "object" && !isArray(config)) {
    return config.escape;
  } else {
    return void 0;
  }
};
var mustache = {
  name: "mustache.js",
  version: "4.2.0",
  tags: ["{{", "}}"],
  clearCache: void 0,
  escape: void 0,
  parse: void 0,
  render: void 0,
  Scanner: void 0,
  Context: void 0,
  Writer: void 0,
  /**
   * Allows a user to override the default caching strategy, by providing an
   * object with set, get and clear methods. This can also be used to disable
   * the cache by setting it to the literal `undefined`.
   */
  set templateCache(cache) {
    defaultWriter.templateCache = cache;
  },
  /**
   * Gets the default or overridden caching object from the default writer.
   */
  get templateCache() {
    return defaultWriter.templateCache;
  }
};
var defaultWriter = new Writer();
mustache.clearCache = function clearCache2() {
  return defaultWriter.clearCache();
};
mustache.parse = function parse2(template2, tags2) {
  return defaultWriter.parse(template2, tags2);
};
mustache.render = function render2(template2, view, partials, config) {
  if (typeof template2 !== "string") {
    throw new TypeError('Invalid template! Template should be a "string" but "' + typeStr(template2) + '" was given as the first argument for mustache#render(template, view, partials)');
  }
  return defaultWriter.render(template2, view, partials, config);
};
mustache.escape = escapeHtml;
mustache.Scanner = Scanner;
mustache.Context = Context;
mustache.Writer = Writer;
var mustache_default = mustache;

// data.js
function createSeededRandom(seed = 12345) {
  let s = seed;
  return () => {
    s = Math.sin(s) * 1e4;
    return s - Math.floor(s);
  };
}
var random = createSeededRandom();
var titles = [
  "Understanding Modern Web Development",
  "The Future of JavaScript Frameworks",
  "Building Scalable Applications",
  "Performance Optimization Techniques",
  "Security Best Practices for Developers",
  "Database Design Patterns",
  "Microservices Architecture Deep Dive",
  "Frontend Development Trends",
  "API Design and Implementation",
  "DevOps and Continuous Integration",
  "Machine Learning for Web Developers",
  "Mobile-First Development Strategies",
  "Cloud Computing Fundamentals",
  "Data Visualization Techniques",
  "User Experience Design Principles"
];
var authors = [
  {
    name: "Alex Johnson",
    email: "alex@example.com",
    bio: "Senior full-stack developer"
  },
  {
    name: "Sarah Chen",
    email: "sarah@example.com",
    bio: "Frontend specialist and UX advocate"
  },
  {
    name: "Marcus Rodriguez",
    email: "marcus@example.com",
    bio: "Backend architect and performance expert"
  },
  {
    name: "Emma Thompson",
    email: "emma@example.com",
    bio: "DevOps engineer and cloud specialist"
  },
  {
    name: "David Kim",
    email: "david@example.com",
    bio: "Data scientist and ML engineer"
  }
];
var categories = [
  "Web Development",
  "JavaScript",
  "Performance",
  "Security",
  "Architecture",
  "Frontend",
  "Backend",
  "DevOps",
  "Database",
  "Machine Learning"
];
var tags = [
  "javascript",
  "react",
  "nodejs",
  "performance",
  "security",
  "api",
  "database",
  "microservices",
  "cloud",
  "aws",
  "docker",
  "kubernetes",
  "mongodb",
  "postgresql",
  "redis",
  "graphql",
  "rest",
  "testing",
  "ci/cd",
  "monitoring"
];
var contentBlocks = [
  "In today's rapidly evolving digital landscape, developers face unprecedented challenges in building robust, scalable applications.",
  "The emergence of new technologies and frameworks has fundamentally changed how we approach software development.",
  "Performance optimization remains a critical concern for modern applications, especially as user expectations continue to rise.",
  "Security vulnerabilities can have devastating consequences, making defensive programming practices essential for any production system.",
  "Microservices architecture offers compelling benefits but also introduces new complexities in system design and operation.",
  "Database performance tuning requires a deep understanding of query optimization and indexing strategies.",
  "Cloud-native applications demand different architectural patterns compared to traditional on-premises deployments.",
  "Continuous integration and deployment pipelines have become indispensable tools for maintaining code quality and release velocity.",
  "User experience design significantly impacts application success, requiring close collaboration between developers and designers.",
  "Machine learning integration presents exciting opportunities but also requires careful consideration of data privacy and model bias."
];
function generateRandomContent() {
  const numParagraphs = Math.floor(random() * 4) + 2;
  const paragraphs = [];
  for (let i = 0; i < numParagraphs; i++) {
    const sentences = Math.floor(random() * 3) + 2;
    const paragraph = [];
    for (let j = 0; j < sentences; j++) {
      paragraph.push(
        contentBlocks[Math.floor(random() * contentBlocks.length)]
      );
    }
    paragraphs.push(paragraph.join(" "));
  }
  return paragraphs.join("\\n\\n");
}
function generateRandomTags() {
  const numTags = Math.floor(random() * 5) + 2;
  const shuffled = [...tags].sort(() => random() - 0.5);
  return shuffled.slice(0, numTags);
}
function generateRandomDate() {
  const start = new Date(2023, 0, 1);
  const end = new Date(2024, 11, 31);
  const randomTime = start.getTime() + random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}
function generateBlogPosts(count = 100) {
  const posts = [];
  for (let i = 0; i < count; i++) {
    const author = authors[Math.floor(random() * authors.length)];
    const category = categories[Math.floor(random() * categories.length)];
    const title = titles[Math.floor(random() * titles.length)];
    const readTime = Math.floor(random() * 10) + 3;
    const views = Math.floor(random() * 1e4) + 100;
    const likes = Math.floor(random() * views * 0.1);
    const comments = Math.floor(random() * likes * 0.2);
    posts.push({
      id: i + 1,
      title: `${title} ${i > 0 ? `(Part ${i + 1})` : ""}`,
      slug: title.toLowerCase().replace(/\s+/g, "-") + (i > 0 ? `-part-${i + 1}` : ""),
      content: generateRandomContent(),
      excerpt: contentBlocks[Math.floor(random() * contentBlocks.length)],
      author,
      category,
      tags: generateRandomTags(),
      publishedAt: generateRandomDate(),
      updatedAt: generateRandomDate(),
      readTime,
      views,
      likes,
      comments,
      featured: random() > 0.8,
      // 20% chance of being featured
      status: random() > 0.1 ? "published" : "draft",
      // 90% published
      seoTitle: `${title} - Complete Guide`,
      seoDescription: `Learn about ${title.toLowerCase()} with practical examples and best practices.`,
      ogImage: `https://example.com/images/blog/${i + 1}.jpg`
    });
  }
  return posts;
}
function generateSiteData() {
  return {
    name: "DevBlog",
    description: "A comprehensive blog about modern web development",
    url: "https://devblog.example.com",
    author: "DevBlog Team",
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    navigation: [
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
      { name: "About", url: "/about" },
      { name: "Contact", url: "/contact" }
    ],
    social: {
      twitter: "@devblog",
      github: "devblog/blog",
      linkedin: "company/devblog"
    }
  };
}
function generateTemplateData() {
  const posts = generateBlogPosts(100);
  const publishedPosts = posts.filter((post) => post.status === "published");
  const featuredPosts = publishedPosts.filter((post) => post.featured);
  return {
    site: generateSiteData(),
    posts: publishedPosts,
    featuredPosts: featuredPosts.slice(0, 3),
    totalPosts: publishedPosts.length,
    categories: [...new Set(publishedPosts.map((post) => post.category))],
    popularTags: getPopularTags(publishedPosts),
    currentPage: 1,
    totalPages: Math.ceil(publishedPosts.length / 10),
    hasNextPage: true,
    hasPrevPage: false,
    searchQuery: "",
    selectedCategory: "",
    sortBy: "publishedAt",
    userPreferences: {
      theme: "light",
      showExcerpts: true,
      postsPerPage: 10,
      compactView: false
    },
    analytics: {
      totalViews: publishedPosts.reduce((sum, post) => sum + post.views, 0),
      totalLikes: publishedPosts.reduce((sum, post) => sum + post.likes, 0),
      avgReadTime: Math.round(
        publishedPosts.reduce((sum, post) => sum + post.readTime, 0) / publishedPosts.length
      )
    },
    recentActivity: generateRecentActivity(publishedPosts.slice(0, 5))
  };
}
function getPopularTags(posts) {
  const tagCounts = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([tag, count]) => ({ name: tag, count }));
}
function generateRecentActivity(posts) {
  return posts.map((post) => ({
    type: "published",
    post,
    timestamp: post.publishedAt,
    description: `New post "${post.title}" published`
  }));
}

// bundles/mustache-entry.js
var template = `<!DOCTYPE html>
<html lang="en" data-theme="{{userPreferences.theme}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{site.name}} - Modern Web Development Blog</title>
  <meta name="description" content="{{site.description}}">
  <meta name="author" content="{{site.author}}">
  <meta property="og:title" content="{{site.name}}">
  <meta property="og:description" content="{{site.description}}">
  <meta property="og:type" content="website">
  <link rel="canonical" href="{{site.url}}">
  <link rel="stylesheet" href="/css/blog.css">
  <script defer src="/js/blog-interactions.js"></script>
</head>
<body>
  <header class="site-header">
    <div class="header-content">
      <div class="site-branding">
        <h1 class="site-title">
          <a href="/">{{site.name}}</a>
        </h1>
        <p class="site-tagline">{{site.description}}</p>
      </div>
      <nav class="main-nav" role="navigation" aria-label="Main navigation">
        <ul class="nav-list">
          {{#site.navigation}}
          <li class="nav-item">
            <a href="{{url}}" class="nav-link {{#isHomePage}}active{{/isHomePage}}">
              {{name}}
            </a>
          </li>
          {{/site.navigation}}
        </ul>
      </nav>
      <div class="header-actions">
        <button class="theme-toggle" title="Toggle dark/light theme">\u{1F313}</button>
        <button class="view-toggle" title="Toggle compact view">\u{1F4CB}</button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <div class="content-wrapper">
      <div class="main-column">
        <!-- Search and Filters -->
        <div class="search-filters">
          <form class="search-form" role="search">
            <div class="search-input-group">
              <label for="search" class="sr-only">Search posts</label>
              <input type="search" id="search" name="q" placeholder="Search posts..."
                     value="{{searchQuery}}" class="search-input">
              <button type="submit" class="search-btn">\u{1F50D} Search</button>
            </div>
          </form>
          <div class="filter-controls">
            <select name="category" class="filter-select" title="Filter by category">
              <option value="">All Categories</option>
              {{#categories}}
              <option value="{{.}}" {{#isSelectedCategory}}selected{{/isSelectedCategory}}>
                {{.}}
              </option>
              {{/categories}}
            </select>
            <select name="sort" class="filter-select" title="Sort posts">
              <option value="publishedAt" {{#isSortByDate}}selected{{/isSortByDate}}>Latest First</option>
              <option value="views" {{#isSortByViews}}selected{{/isSortByViews}}>Most Popular</option>
              <option value="likes" {{#isSortByLikes}}selected{{/isSortByLikes}}>Most Liked</option>
            </select>
          </div>
        </div>

        <!-- Featured Posts Section -->
        {{#hasFeaturedPosts}}
        <section class="featured-posts" aria-labelledby="featured-heading">
          <h2 id="featured-heading">Featured Posts</h2>
          <div class="featured-grid">
            {{#featuredPosts}}
            <article class="featured-post">
              <div class="featured-content">
                <div class="post-badge">Featured</div>
                <h3>
                  <a href="/blog/{{slug}}" class="featured-title">
                    {{title}}
                  </a>
                </h3>
                <p class="featured-excerpt">{{excerpt}}</p>
                <div class="featured-meta">
                  <span class="author">by {{author.name}}</span>
                  <span class="read-time">{{readTime}} min read</span>
                  <span class="views">{{viewsFormatted}} views</span>
                </div>
              </div>
            </article>
            {{/featuredPosts}}
          </div>
        </section>
        {{/hasFeaturedPosts}}

        <!-- Posts Section -->
        <section class="posts-section" aria-labelledby="posts-heading">
          <div class="section-header">
            <h2 id="posts-heading">
              {{#selectedCategory}}Posts in {{selectedCategory}}{{/selectedCategory}}
              {{^selectedCategory}}All Posts{{/selectedCategory}}
            </h2>
            <div class="posts-count">{{postsCount}} posts found</div>
          </div>

          {{#hasPosts}}
          <div class="posts-grid {{#userPreferences.compactView}}compact{{/userPreferences.compactView}}">
            {{#posts}}
            <article class="post-card {{#featured}}featured{{/featured}} {{#isCompactView}}compact{{/isCompactView}}"
                     data-category="{{category}}"
                     data-read-time="{{readTimeCategory}}">
              <header class="post-header">
                <div class="post-badges">
                  {{#featured}}
                  <span class="badge featured">Featured</span>
                  {{/featured}}
                  {{#isRecentPost}}
                  <span class="badge new">New</span>
                  {{/isRecentPost}}
                  <span class="badge category">{{category}}</span>
                </div>
                <h3 class="post-title">
                  <a href="/blog/{{slug}}" class="post-link">
                    {{title}}
                  </a>
                </h3>
                <div class="post-meta">
                  <div class="author-info">
                    <img src="{{authorAvatarUrl}}" alt="{{author.name}}"
                         class="author-avatar" width="32" height="32">
                    <div class="author-details">
                      <span class="author-name">{{author.name}}</span>
                      <span class="author-bio">{{author.bio}}</span>
                    </div>
                  </div>
                  <div class="post-timing">
                    <time datetime="{{isoPublishedAt}}" class="publish-date"
                          title="Published on {{publishedAtFormatted}}">
                      {{publishedAtFormatted}}
                    </time>
                    <span class="read-time" title="Estimated reading time">
                      \u{1F4D6} {{readTime}} min read
                    </span>
                  </div>
                </div>
              </header>

              {{#showFullContent}}
              <div class="post-content">
                <p class="post-excerpt">{{excerpt}}</p>
                {{#hasLongContent}}
                <details class="content-preview">
                  <summary>Read more...</summary>
                  <div class="full-content">
                    {{#contentParagraphs}}
                    <p>{{.}}</p>
                    {{/contentParagraphs}}
                  </div>
                </details>
                {{/hasLongContent}}
              </div>
              {{/showFullContent}}

              <div class="post-tags">
                {{#tags}}
                <a href="/blog/tag/{{encodedTag}}" class="tag">
                  #{{.}}
                </a>
                {{/tags}}
              </div>

              <footer class="post-stats">
                <div class="engagement-stats">
                  <span class="stat views" title="{{viewsFormatted}} views">
                    \u{1F441}\uFE0F {{viewsShort}}
                  </span>
                  <span class="stat likes" title="{{likesFormatted}} likes">
                    \u2764\uFE0F {{likesShort}}
                  </span>
                  <span class="stat comments" title="{{commentsFormatted}} comments">
                    \u{1F4AC} {{comments}}
                  </span>
                </div>
                <div class="post-actions">
                  <button class="action-btn bookmark" title="Bookmark this post">
                    \u{1F516} Save
                  </button>
                  <button class="action-btn share" title="Share this post">
                    \u{1F517} Share
                  </button>
                </div>
              </footer>
            </article>
            {{/posts}}
          </div>
          {{/hasPosts}}
          {{^hasPosts}}
          <div class="no-posts">
            <h3>No posts found</h3>
            <p>Try adjusting your search or filter criteria to find more posts.</p>
            <a href="/blog" class="reset-filters">Reset filters</a>
          </div>
          {{/hasPosts}}
        </section>

        <!-- Pagination -->
        {{#hasPosts}}
        <nav class="pagination" role="navigation" aria-label="Pagination">
          <div class="pagination-info">
            <span>Page {{currentPage}} of {{totalPages}} ({{totalPostsDisplay}} total posts)</span>
          </div>
          <div class="pagination-controls">
            {{#hasPrevPage}}
            <a href="/blog?page=1" class="page-link first" aria-label="Go to first page">\xAB First</a>
            <a href="/blog?page={{prevPage}}" class="page-link prev" aria-label="Go to previous page">\u2039 Previous</a>
            {{/hasPrevPage}}
            {{^hasPrevPage}}
            <span class="page-link disabled">\xAB First</span>
            <span class="page-link disabled">\u2039 Previous</span>
            {{/hasPrevPage}}

            {{#paginationPages}}
            <a href="/blog?page={{pageNumber}}"
               class="page-link {{#isCurrentPage}}current{{/isCurrentPage}}"
               {{#isCurrentPage}}aria-current="page"{{/isCurrentPage}}>
              {{pageNumber}}
            </a>
            {{/paginationPages}}

            {{#hasNextPage}}
            <a href="/blog?page={{nextPage}}" class="page-link next" aria-label="Go to next page">Next \u203A</a>
            <a href="/blog?page={{totalPages}}" class="page-link last" aria-label="Go to last page">Last \xBB</a>
            {{/hasNextPage}}
            {{^hasNextPage}}
            <span class="page-link disabled">Next \u203A</span>
            <span class="page-link disabled">Last \xBB</span>
            {{/hasNextPage}}
          </div>
        </nav>
        {{/hasPosts}}
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Analytics Dashboard -->
        <div class="analytics-dashboard">
          <h3>Blog Statistics</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">{{totalPostsFormatted}}</span>
              <span class="stat-label">Total Posts</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{analytics.totalViewsFormatted}}</span>
              <span class="stat-label">Total Views</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{analytics.totalLikesFormatted}}</span>
              <span class="stat-label">Total Likes</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{analytics.avgReadTime}} min</span>
              <span class="stat-label">Avg Read Time</span>
            </div>
          </div>
        </div>

        <!-- Category Filter -->
        <div class="category-filter">
          <h3>Filter by Category</h3>
          <ul class="category-list">
            <li>
              <a href="/blog" class="category-link {{#noSelectedCategory}}active{{/noSelectedCategory}}">
                All Posts
              </a>
            </li>
            {{#categories}}
            <li>
              <a href="/blog?category={{encodedCategory}}"
                 class="category-link {{#isSelectedCategory}}active{{/isSelectedCategory}}">
                {{.}}
              </a>
            </li>
            {{/categories}}
          </ul>
        </div>

        <!-- Popular Tags -->
        <div class="popular-tags">
          <h3>Popular Tags</h3>
          <div class="tag-cloud">
            {{#popularTags}}
            <a href="/blog/tag/{{encodedName}}"
               class="tag-link"
               style="font-size: {{fontSize}}rem"
               title="{{count}} posts">
              #{{name}}
              <span class="tag-count">({{count}})</span>
            </a>
            {{/popularTags}}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-activity">
          <h3>Recent Activity</h3>
          <ul class="activity-list">
            {{#recentActivity}}
            <li class="activity-item">
              <div class="activity-content">
                <span class="activity-type">{{type}}</span>
                <a href="/blog/{{post.slug}}" class="activity-link">
                  {{post.title}}
                </a>
                <time class="activity-time">
                  {{timestampFormatted}}
                </time>
              </div>
            </li>
            {{/recentActivity}}
          </ul>
        </div>

        <!-- Newsletter Signup -->
        <div class="newsletter-signup">
          <h3>Stay Updated</h3>
          <p>Get notified about new posts and updates.</p>
          <form class="newsletter-form">
            <input type="email" placeholder="your@email.com" required class="newsletter-input">
            <button type="submit" class="newsletter-btn">Subscribe</button>
          </form>
        </div>
      </aside>
    </div>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-info">
        <p>&copy; {{site.year}} {{site.name}}. All rights reserved.</p>
        <p>Built with modern web technologies for optimal performance and accessibility.</p>
      </div>
      <div class="social-links">
        <a href="https://twitter.com/{{site.social.twitter}}" class="social-link twitter" aria-label="Follow us on Twitter">
          \u{1F426} Twitter
        </a>
        <a href="https://github.com/{{site.social.github}}" class="social-link github" aria-label="View our GitHub repository">
          \u{1F419} GitHub
        </a>
        <a href="https://linkedin.com/{{site.social.linkedin}}" class="social-link linkedin" aria-label="Connect with us on LinkedIn">
          \u{1F4BC} LinkedIn
        </a>
      </div>
      <div class="footer-nav">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/contact">Contact</a>
        <a href="/rss.xml">RSS Feed</a>
      </div>
    </div>
  </footer>

  <script>
    // Progressive enhancement for interactivity
    document.addEventListener('DOMContentLoaded', function() {
      // Theme toggle functionality
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const html = document.documentElement;
          const currentTheme = html.getAttribute('data-theme');
          html.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
        });
      }
    });
  </script>
</body>
</html>`;
var data = generateTemplateData();
function render3() {
  return mustache_default.render(template, data);
}
render3();
export {
  render3 as render
};
/*! Bundled license information:

mustache/mustache.mjs:
  (*!
   * mustache.js - Logic-less {{mustache}} templates with JavaScript
   * http://github.com/janl/mustache.js
   *)
*/
