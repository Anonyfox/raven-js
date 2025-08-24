var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dot/doT.js
var require_doT = __commonJS({
  "node_modules/dot/doT.js"(exports, module) {
    "use strict";
    var doT2 = {
      templateSettings: {
        argName: "it",
        encoders: {},
        selfContained: false,
        strip: true,
        internalPrefix: "_val",
        encodersPrefix: "_enc",
        delimiters: {
          start: "{{",
          end: "}}"
        }
      },
      template: template2,
      compile,
      setDelimiters
    };
    module.exports = doT2;
    var encoderType = {
      false: "function",
      true: "string"
    };
    var defaultSyntax = {
      evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
      interpolate: /\{\{=([\s\S]+?)\}\}/g,
      typeInterpolate: /\{\{%([nsb])=([\s\S]+?)\}\}/g,
      encode: /\{\{([a-z_$]+[\w$]*)?!([\s\S]+?)\}\}/g,
      use: /\{\{#([\s\S]+?)\}\}/g,
      useParams: /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$]+(?:\.[\w$]+|\[[^\]]+\])*|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
      define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
      defineParams: /^\s*([\w$]+):([\s\S]+)/,
      conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
      iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g
    };
    var currentSyntax = { ...defaultSyntax };
    var TYPES = {
      n: "number",
      s: "string",
      b: "boolean"
    };
    function resolveDefs(c, syn, block, def) {
      return (typeof block === "string" ? block : block.toString()).replace(syn.define, (_, code, assign, value) => {
        if (code.indexOf("def.") === 0) {
          code = code.substring(4);
        }
        if (!(code in def)) {
          if (assign === ":") {
            value.replace(syn.defineParams, (_2, param, v) => {
              def[code] = { arg: param, text: v };
            });
            if (!(code in def)) def[code] = value;
          } else {
            new Function("def", `def['${code}']=${value}`)(def);
          }
        }
        return "";
      }).replace(syn.use, (_, code) => {
        code = code.replace(syn.useParams, (_2, s, d, param) => {
          if (def[d] && def[d].arg && param) {
            const rw = unescape((d + ":" + param).replace(/'|\\/g, "_"));
            def.__exp = def.__exp || {};
            def.__exp[rw] = def[d].text.replace(
              new RegExp(`(^|[^\\w$])${def[d].arg}([^\\w$])`, "g"),
              `$1${param}$2`
            );
            return s + `def.__exp['${rw}']`;
          }
        });
        const v = new Function("def", "return " + code)(def);
        return v ? resolveDefs(c, syn, v, def) : v;
      });
    }
    function unescape(code) {
      return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
    }
    function template2(tmpl, c, def) {
      const ds = c && c.delimiters;
      const syn = ds && !sameDelimiters(ds) ? getSyntax(ds) : currentSyntax;
      c = c ? { ...doT2.templateSettings, ...c } : doT2.templateSettings;
      let sid = 0;
      let str = resolveDefs(c, syn, tmpl, def || {});
      const needEncoders = {};
      str = ("let out='" + (c.strip ? str.trim().replace(/[\t ]+(\r|\n)/g, "\n").replace(/(\r|\n)[\t ]+/g, " ").replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, "") : str).replace(/'|\\/g, "\\$&").replace(syn.interpolate, (_, code) => `'+(${unescape(code)})+'`).replace(syn.typeInterpolate, (_, typ, code) => {
        sid++;
        const val = c.internalPrefix + sid;
        const error = `throw new Error("expected ${TYPES[typ]}, got "+ (typeof ${val}))`;
        return `';const ${val}=(${unescape(code)});if(typeof ${val}!=="${TYPES[typ]}") ${error};out+=${val}+'`;
      }).replace(syn.encode, (_, enc = "", code) => {
        needEncoders[enc] = true;
        code = unescape(code);
        const e = c.selfContained ? enc : enc ? "." + enc : '[""]';
        return `'+${c.encodersPrefix}${e}(${code})+'`;
      }).replace(syn.conditional, (_, elseCase, code) => {
        if (code) {
          code = unescape(code);
          return elseCase ? `';}else if(${code}){out+='` : `';if(${code}){out+='`;
        }
        return elseCase ? "';}else{out+='" : "';}out+='";
      }).replace(syn.iterate, (_, arr, vName, iName) => {
        if (!arr) return "';} } out+='";
        sid++;
        const defI = iName ? `let ${iName}=-1;` : "";
        const incI = iName ? `${iName}++;` : "";
        const val = c.internalPrefix + sid;
        return `';const ${val}=${unescape(
          arr
        )};if(${val}){${defI}for (const ${vName} of ${val}){${incI}out+='`;
      }).replace(syn.evaluate, (_, code) => `';${unescape(code)}out+='`) + "';return out;").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r").replace(/(\s|;|\}|^|\{)out\+='';/g, "$1").replace(/\+''/g, "");
      const args = Array.isArray(c.argName) ? properties(c.argName) : c.argName;
      if (Object.keys(needEncoders).length === 0) {
        return try_(() => new Function(args, str));
      }
      checkEncoders(c, needEncoders);
      str = `return function(${args}){${str}};`;
      return try_(
        () => c.selfContained ? new Function(str = addEncoders(c, needEncoders) + str)() : new Function(c.encodersPrefix, str)(c.encoders)
      );
      function try_(f) {
        try {
          return f();
        } catch (e) {
          console.log("Could not create a template function: " + str);
          throw e;
        }
      }
    }
    function compile(tmpl, def) {
      return template2(tmpl, null, def);
    }
    function sameDelimiters({ start, end }) {
      const d = doT2.templateSettings.delimiters;
      return d.start === start && d.end === end;
    }
    function setDelimiters(delimiters) {
      if (sameDelimiters(delimiters)) {
        console.log("delimiters did not change");
        return;
      }
      currentSyntax = getSyntax(delimiters);
      doT2.templateSettings.delimiters = delimiters;
    }
    function getSyntax({ start, end }) {
      start = escape(start);
      end = escape(end);
      const syntax = {};
      for (const syn in defaultSyntax) {
        const s = defaultSyntax[syn].toString().replace(/\\\{\\\{/g, start).replace(/\\\}\\\}/g, end);
        syntax[syn] = strToRegExp(s);
      }
      return syntax;
    }
    var escapeCharacters = /([{}[\]()<>\\\/^$\-.+*?!=|&:])/g;
    function escape(str) {
      return str.replace(escapeCharacters, "\\$1");
    }
    var regexpPattern = /^\/(.*)\/([\w]*)$/;
    function strToRegExp(str) {
      const [, rx, flags] = str.match(regexpPattern);
      return new RegExp(rx, flags);
    }
    function properties(args) {
      return args.reduce((s, a, i) => s + (i ? "," : "") + a, "{") + "}";
    }
    function checkEncoders(c, encoders) {
      const typ = encoderType[c.selfContained];
      for (const enc in encoders) {
        const e = c.encoders[enc];
        if (!e) throw new Error(`unknown encoder "${enc}"`);
        if (typeof e !== typ)
          throw new Error(`selfContained ${c.selfContained}: encoder type must be "${typ}"`);
      }
    }
    function addEncoders(c, encoders) {
      let s = "";
      for (const enc in encoders) s += `const ${c.encodersPrefix}${enc}=${c.encoders[enc]};`;
      return s;
    }
  }
});

// bundles/dot-entry.js
var import_dot = __toESM(require_doT(), 1);

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

// bundles/dot-entry.js
var template = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>{{=it.site.name}} - Modern Web Development Blog</title>\n  <meta name="description" content="{{=it.site.description}}">\n</head>\n<body>\n  <header>\n    <h1>{{=it.site.name}}</h1>\n    <nav>\n      <ul>\n        {{~it.site.navigation :item}}\n          <li><a href="{{=item.url}}">{{=item.name}}</a></li>\n        {{~}}\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class="hero">\n      <h2>Latest Blog Posts</h2>\n      <p>{{=it.site.description}}</p>\n    </section>\n\n    <section class="posts">\n      {{~it.posts :post}}\n        <article class="post {{?post.featured}}featured{{?}}">\n          <header>\n            <h3><a href="/blog/{{=post.slug}}">{{=post.title}}</a></h3>\n            <div class="meta">\n              <span class="author">By {{=post.author.name}}</span>\n              <span class="date">{{=post.publishedAt.toLocaleDateString()}}</span>\n              <span class="category">{{=post.category}}</span>\n              <span class="read-time">{{=post.readTime}} min read</span>\n            </div>\n          </header>\n\n          <div class="excerpt">\n            <p>{{=post.excerpt}}</p>\n          </div>\n\n          <div class="tags">\n            {{~post.tags :tag}}\n              <span class="tag">#{{=tag}}</span>\n            {{~}}\n          </div>\n\n          <footer class="stats">\n            <span class="views">{{=post.views.toLocaleString()}} views</span>\n            <span class="likes">{{=post.likes.toLocaleString()}} likes</span>\n            <span class="comments">{{=post.comments.toLocaleString()}} comments</span>\n          </footer>\n        </article>\n      {{~}}\n    </section>\n\n    <nav class="pagination">\n      {{?it.hasPrevPage}}\n        <a href="/blog?page={{=it.currentPage - 1}}">Previous</a>\n      {{?}}\n      <span>Page {{=it.currentPage}} of {{=it.totalPages}}</span>\n      {{?it.hasNextPage}}\n        <a href="/blog?page={{=it.currentPage + 1}}">Next</a>\n      {{?}}\n    </nav>\n  </main>\n\n  <footer>\n    <p>&copy; {{=it.site.year}} {{=it.site.name}}. All rights reserved.</p>\n    <div class="social">\n      <a href="https://twitter.com/{{=it.site.social.twitter}}">Twitter</a>\n      <a href="https://github.com/{{=it.site.social.github}}">GitHub</a>\n      <a href="https://linkedin.com/{{=it.site.social.linkedin}}">LinkedIn</a>\n    </div>\n  </footer>\n</body>\n</html>\n';
var compiled = import_dot.default.template(template);
var data = generateTemplateData();
function render() {
  return compiled(data);
}
render();
export {
  render
};
