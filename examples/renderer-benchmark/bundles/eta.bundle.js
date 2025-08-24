// node_modules/eta/dist/eta.module.mjs
import * as path from "node:path";
import * as fs from "node:fs";
var Cacher = class {
  constructor(cache) {
    this.cache = void 0;
    this.cache = cache;
  }
  define(key, val) {
    this.cache[key] = val;
  }
  get(key) {
    return this.cache[key];
  }
  remove(key) {
    delete this.cache[key];
  }
  reset() {
    this.cache = {};
  }
  load(cacheObj) {
    this.cache = {
      ...this.cache,
      ...cacheObj
    };
  }
};
var EtaError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "Eta Error";
  }
};
var EtaParseError = class extends EtaError {
  constructor(message) {
    super(message);
    this.name = "EtaParser Error";
  }
};
var EtaRuntimeError = class extends EtaError {
  constructor(message) {
    super(message);
    this.name = "EtaRuntime Error";
  }
};
var EtaFileResolutionError = class extends EtaError {
  constructor(message) {
    super(message);
    this.name = "EtaFileResolution Error";
  }
};
var EtaNameResolutionError = class extends EtaError {
  constructor(message) {
    super(message);
    this.name = "EtaNameResolution Error";
  }
};
function ParseErr(message, str, indx) {
  const whitespace = str.slice(0, indx).split(/\n/);
  const lineNo = whitespace.length;
  const colNo = whitespace[lineNo - 1].length + 1;
  message += " at line " + lineNo + " col " + colNo + ":\n\n  " + str.split(/\n/)[lineNo - 1] + "\n  " + Array(colNo).join(" ") + "^";
  throw new EtaParseError(message);
}
function RuntimeErr(originalError, str, lineNo, path2) {
  const lines = str.split("\n");
  const start = Math.max(lineNo - 3, 0);
  const end = Math.min(lines.length, lineNo + 3);
  const filename = path2;
  const context = lines.slice(start, end).map(function(line, i) {
    const curr = i + start + 1;
    return (curr == lineNo ? " >> " : "    ") + curr + "| " + line;
  }).join("\n");
  const header = filename ? filename + ":" + lineNo + "\n" : "line " + lineNo + "\n";
  const err = new EtaRuntimeError(header + context + "\n\n" + originalError.message);
  err.name = originalError.name;
  throw err;
}
var AsyncFunction = async function() {
}.constructor;
function compile(str, options) {
  const config = this.config;
  const ctor = options && options.async ? AsyncFunction : Function;
  try {
    return new ctor(config.varName, "options", this.compileToString.call(this, str, options));
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new EtaParseError("Bad template syntax\n\n" + e.message + "\n" + Array(e.message.length + 1).join("=") + "\n" + this.compileToString.call(this, str, options) + "\n");
    } else {
      throw e;
    }
  }
}
function compileToString(str, options) {
  const config = this.config;
  const isAsync = options && options.async;
  const compileBody2 = this.compileBody;
  const buffer = this.parse.call(this, str);
  let res = `${config.functionHeader}
let include = (template, data) => this.render(template, data, options);
let includeAsync = (template, data) => this.renderAsync(template, data, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction${config.debug ? ', line: 1, templateStr: "' + str.replace(/\\|"/g, "\\$&").replace(/\r\n|\n|\r/g, "\\n") + '"' : ""}};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}${config.debug ? "try {" : ""}${config.useWith ? "with(" + config.varName + "||{}){" : ""}

${compileBody2.call(this, buffer)}
if (__eta.layout) {
  __eta.res = ${isAsync ? "await includeAsync" : "include"} (__eta.layout, {...${config.varName}, body: __eta.res, ...__eta.layoutData});
}
${config.useWith ? "}" : ""}${config.debug ? "} catch (e) { this.RuntimeErr(e, __eta.templateStr, __eta.line, options.filepath) }" : ""}
return __eta.res;
`;
  if (config.plugins) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (plugin.processFnString) {
        res = plugin.processFnString(res, config);
      }
    }
  }
  return res;
}
function compileBody(buff) {
  const config = this.config;
  let i = 0;
  const buffLength = buff.length;
  let returnStr = "";
  for (i; i < buffLength; i++) {
    const currentBlock = buff[i];
    if (typeof currentBlock === "string") {
      const str = currentBlock;
      returnStr += "__eta.res+='" + str + "'\n";
    } else {
      const type = currentBlock.t;
      let content = currentBlock.val || "";
      if (config.debug) returnStr += "__eta.line=" + currentBlock.lineNo + "\n";
      if (type === "r") {
        if (config.autoFilter) {
          content = "__eta.f(" + content + ")";
        }
        returnStr += "__eta.res+=" + content + "\n";
      } else if (type === "i") {
        if (config.autoFilter) {
          content = "__eta.f(" + content + ")";
        }
        if (config.autoEscape) {
          content = "__eta.e(" + content + ")";
        }
        returnStr += "__eta.res+=" + content + "\n";
      } else if (type === "e") {
        returnStr += content + "\n";
      }
    }
  }
  return returnStr;
}
function trimWS(str, config, wsLeft, wsRight) {
  let leftTrim;
  let rightTrim;
  if (Array.isArray(config.autoTrim)) {
    leftTrim = config.autoTrim[1];
    rightTrim = config.autoTrim[0];
  } else {
    leftTrim = rightTrim = config.autoTrim;
  }
  if (wsLeft || wsLeft === false) {
    leftTrim = wsLeft;
  }
  if (wsRight || wsRight === false) {
    rightTrim = wsRight;
  }
  if (!rightTrim && !leftTrim) {
    return str;
  }
  if (leftTrim === "slurp" && rightTrim === "slurp") {
    return str.trim();
  }
  if (leftTrim === "_" || leftTrim === "slurp") {
    str = str.trimStart();
  } else if (leftTrim === "-" || leftTrim === "nl") {
    str = str.replace(/^(?:\r\n|\n|\r)/, "");
  }
  if (rightTrim === "_" || rightTrim === "slurp") {
    str = str.trimEnd();
  } else if (rightTrim === "-" || rightTrim === "nl") {
    str = str.replace(/(?:\r\n|\n|\r)$/, "");
  }
  return str;
}
var escMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function replaceChar(s) {
  return escMap[s];
}
function XMLEscape(str) {
  const newStr = String(str);
  if (/[&<>"']/.test(newStr)) {
    return newStr.replace(/[&<>"']/g, replaceChar);
  } else {
    return newStr;
  }
}
var defaultConfig = {
  autoEscape: true,
  autoFilter: false,
  autoTrim: [false, "nl"],
  cache: false,
  cacheFilepaths: true,
  debug: false,
  escapeFunction: XMLEscape,
  // default filter function (not used unless enables) just stringifies the input
  filterFunction: (val) => String(val),
  functionHeader: "",
  parse: {
    exec: "",
    interpolate: "=",
    raw: "~"
  },
  plugins: [],
  rmWhitespace: false,
  tags: ["<%", "%>"],
  useWith: false,
  varName: "it",
  defaultExtension: ".eta"
};
var templateLitReg = /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g;
var singleQuoteReg = /'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g;
var doubleQuoteReg = /"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g;
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}
function getLineNo(str, index) {
  return str.slice(0, index).split("\n").length;
}
function parse(str) {
  const config = this.config;
  let buffer = [];
  let trimLeftOfNextStr = false;
  let lastIndex = 0;
  const parseOptions = config.parse;
  if (config.plugins) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (plugin.processTemplate) {
        str = plugin.processTemplate(str, config);
      }
    }
  }
  if (config.rmWhitespace) {
    str = str.replace(/[\r\n]+/g, "\n").replace(/^\s+|\s+$/gm, "");
  }
  templateLitReg.lastIndex = 0;
  singleQuoteReg.lastIndex = 0;
  doubleQuoteReg.lastIndex = 0;
  function pushString(strng, shouldTrimRightOfString) {
    if (strng) {
      strng = trimWS(
        strng,
        config,
        trimLeftOfNextStr,
        // this will only be false on the first str, the next ones will be null or undefined
        shouldTrimRightOfString
      );
      if (strng) {
        strng = strng.replace(/\\|'/g, "\\$&").replace(/\r\n|\n|\r/g, "\\n");
        buffer.push(strng);
      }
    }
  }
  const prefixes = [parseOptions.exec, parseOptions.interpolate, parseOptions.raw].reduce(function(accumulator, prefix) {
    if (accumulator && prefix) {
      return accumulator + "|" + escapeRegExp(prefix);
    } else if (prefix) {
      return escapeRegExp(prefix);
    } else {
      return accumulator;
    }
  }, "");
  const parseOpenReg = new RegExp(escapeRegExp(config.tags[0]) + "(-|_)?\\s*(" + prefixes + ")?\\s*", "g");
  const parseCloseReg = new RegExp("'|\"|`|\\/\\*|(\\s*(-|_)?" + escapeRegExp(config.tags[1]) + ")", "g");
  let m;
  while (m = parseOpenReg.exec(str)) {
    const precedingString = str.slice(lastIndex, m.index);
    lastIndex = m[0].length + m.index;
    const wsLeft = m[1];
    const prefix = m[2] || "";
    pushString(precedingString, wsLeft);
    parseCloseReg.lastIndex = lastIndex;
    let closeTag;
    let currentObj = false;
    while (closeTag = parseCloseReg.exec(str)) {
      if (closeTag[1]) {
        const content = str.slice(lastIndex, closeTag.index);
        parseOpenReg.lastIndex = lastIndex = parseCloseReg.lastIndex;
        trimLeftOfNextStr = closeTag[2];
        const currentType = prefix === parseOptions.exec ? "e" : prefix === parseOptions.raw ? "r" : prefix === parseOptions.interpolate ? "i" : "";
        currentObj = {
          t: currentType,
          val: content
        };
        break;
      } else {
        const char = closeTag[0];
        if (char === "/*") {
          const commentCloseInd = str.indexOf("*/", parseCloseReg.lastIndex);
          if (commentCloseInd === -1) {
            ParseErr("unclosed comment", str, closeTag.index);
          }
          parseCloseReg.lastIndex = commentCloseInd;
        } else if (char === "'") {
          singleQuoteReg.lastIndex = closeTag.index;
          const singleQuoteMatch = singleQuoteReg.exec(str);
          if (singleQuoteMatch) {
            parseCloseReg.lastIndex = singleQuoteReg.lastIndex;
          } else {
            ParseErr("unclosed string", str, closeTag.index);
          }
        } else if (char === '"') {
          doubleQuoteReg.lastIndex = closeTag.index;
          const doubleQuoteMatch = doubleQuoteReg.exec(str);
          if (doubleQuoteMatch) {
            parseCloseReg.lastIndex = doubleQuoteReg.lastIndex;
          } else {
            ParseErr("unclosed string", str, closeTag.index);
          }
        } else if (char === "`") {
          templateLitReg.lastIndex = closeTag.index;
          const templateLitMatch = templateLitReg.exec(str);
          if (templateLitMatch) {
            parseCloseReg.lastIndex = templateLitReg.lastIndex;
          } else {
            ParseErr("unclosed string", str, closeTag.index);
          }
        }
      }
    }
    if (currentObj) {
      if (config.debug) {
        currentObj.lineNo = getLineNo(str, m.index);
      }
      buffer.push(currentObj);
    } else {
      ParseErr("unclosed tag", str, m.index);
    }
  }
  pushString(str.slice(lastIndex, str.length), false);
  if (config.plugins) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (plugin.processAST) {
        buffer = plugin.processAST(buffer, config);
      }
    }
  }
  return buffer;
}
function handleCache(template2, options) {
  const templateStore = options && options.async ? this.templatesAsync : this.templatesSync;
  if (this.resolvePath && this.readFile && !template2.startsWith("@")) {
    const templatePath = options.filepath;
    const cachedTemplate = templateStore.get(templatePath);
    if (this.config.cache && cachedTemplate) {
      return cachedTemplate;
    } else {
      const templateString = this.readFile(templatePath);
      const templateFn = this.compile(templateString, options);
      if (this.config.cache) templateStore.define(templatePath, templateFn);
      return templateFn;
    }
  } else {
    const cachedTemplate = templateStore.get(template2);
    if (cachedTemplate) {
      return cachedTemplate;
    } else {
      throw new EtaNameResolutionError("Failed to get template '" + template2 + "'");
    }
  }
}
function render(template2, data2, meta) {
  let templateFn;
  const options = {
    ...meta,
    async: false
  };
  if (typeof template2 === "string") {
    if (this.resolvePath && this.readFile && !template2.startsWith("@")) {
      options.filepath = this.resolvePath(template2, options);
    }
    templateFn = handleCache.call(this, template2, options);
  } else {
    templateFn = template2;
  }
  const res = templateFn.call(this, data2, options);
  return res;
}
function renderAsync(template2, data2, meta) {
  let templateFn;
  const options = {
    ...meta,
    async: true
  };
  if (typeof template2 === "string") {
    if (this.resolvePath && this.readFile && !template2.startsWith("@")) {
      options.filepath = this.resolvePath(template2, options);
    }
    templateFn = handleCache.call(this, template2, options);
  } else {
    templateFn = template2;
  }
  const res = templateFn.call(this, data2, options);
  return Promise.resolve(res);
}
function renderString(template2, data2) {
  const templateFn = this.compile(template2, {
    async: false
  });
  return render.call(this, templateFn, data2);
}
function renderStringAsync(template2, data2) {
  const templateFn = this.compile(template2, {
    async: true
  });
  return renderAsync.call(this, templateFn, data2);
}
var Eta$1 = class {
  constructor(customConfig) {
    this.config = void 0;
    this.RuntimeErr = RuntimeErr;
    this.compile = compile;
    this.compileToString = compileToString;
    this.compileBody = compileBody;
    this.parse = parse;
    this.render = render;
    this.renderAsync = renderAsync;
    this.renderString = renderString;
    this.renderStringAsync = renderStringAsync;
    this.filepathCache = {};
    this.templatesSync = new Cacher({});
    this.templatesAsync = new Cacher({});
    this.resolvePath = null;
    this.readFile = null;
    if (customConfig) {
      this.config = {
        ...defaultConfig,
        ...customConfig
      };
    } else {
      this.config = {
        ...defaultConfig
      };
    }
  }
  // METHODS
  configure(customConfig) {
    this.config = {
      ...this.config,
      ...customConfig
    };
  }
  withConfig(customConfig) {
    return {
      ...this,
      config: {
        ...this.config,
        ...customConfig
      }
    };
  }
  loadTemplate(name, template2, options) {
    if (typeof template2 === "string") {
      const templates = options && options.async ? this.templatesAsync : this.templatesSync;
      templates.define(name, this.compile(template2, options));
    } else {
      let templates = this.templatesSync;
      if (template2.constructor.name === "AsyncFunction" || options && options.async) {
        templates = this.templatesAsync;
      }
      templates.define(name, template2);
    }
  }
};
function readFile(path2) {
  let res = "";
  try {
    res = fs.readFileSync(path2, "utf8");
  } catch (err) {
    if ((err == null ? void 0 : err.code) === "ENOENT") {
      throw new EtaFileResolutionError(`Could not find template: ${path2}`);
    } else {
      throw err;
    }
  }
  return res;
}
function resolvePath(templatePath, options) {
  let resolvedFilePath = "";
  const views = this.config.views;
  if (!views) {
    throw new EtaFileResolutionError("Views directory is not defined");
  }
  const baseFilePath = options && options.filepath;
  const defaultExtension = this.config.defaultExtension === void 0 ? ".eta" : this.config.defaultExtension;
  const cacheIndex = JSON.stringify({
    filename: baseFilePath,
    path: templatePath,
    views: this.config.views
  });
  templatePath += path.extname(templatePath) ? "" : defaultExtension;
  if (baseFilePath) {
    if (this.config.cacheFilepaths && this.filepathCache[cacheIndex]) {
      return this.filepathCache[cacheIndex];
    }
    const absolutePathTest = absolutePathRegExp.exec(templatePath);
    if (absolutePathTest && absolutePathTest.length) {
      const formattedPath = templatePath.replace(/^\/*|^\\*/, "");
      resolvedFilePath = path.join(views, formattedPath);
    } else {
      resolvedFilePath = path.join(path.dirname(baseFilePath), templatePath);
    }
  } else {
    resolvedFilePath = path.join(views, templatePath);
  }
  if (dirIsChild(views, resolvedFilePath)) {
    if (baseFilePath && this.config.cacheFilepaths) {
      this.filepathCache[cacheIndex] = resolvedFilePath;
    }
    return resolvedFilePath;
  } else {
    throw new EtaFileResolutionError(`Template '${templatePath}' is not in the views directory`);
  }
}
function dirIsChild(parent, dir) {
  const relative2 = path.relative(parent, dir);
  return relative2 && !relative2.startsWith("..") && !path.isAbsolute(relative2);
}
var absolutePathRegExp = /^\\|^\//;
var Eta = class extends Eta$1 {
  constructor(...args) {
    super(...args);
    this.readFile = readFile;
    this.resolvePath = resolvePath;
  }
};

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

// bundles/eta-entry.js
var eta = new Eta();
var template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= it.site.name %> - Modern Web Development Blog</title>
  <meta name="description" content="<%= it.site.description %>">
</head>
<body>
  <header>
    <h1><%= it.site.name %></h1>
    <nav>
      <ul>
        <% it.site.navigation.forEach(function(item) { %>
          <li><a href="<%= item.url %>"><%= item.name %></a></li>
        <% }); %>
      </ul>
    </nav>
  </header>

  <main>
    <section class="hero">
      <h2>Latest Blog Posts</h2>
      <p><%= it.site.description %></p>
    </section>

    <section class="posts">
      <% it.posts.forEach(function(post) { %>
        <article class="post <%= post.featured ? 'featured' : '' %>">
          <header>
            <h3><a href="/blog/<%= post.slug %>"><%= post.title %></a></h3>
            <div class="meta">
              <span class="author">By <%= post.author.name %></span>
              <span class="date"><%= post.publishedAt.toLocaleDateString() %></span>
              <span class="category"><%= post.category %></span>
              <span class="read-time"><%= post.readTime %> min read</span>
            </div>
          </header>

          <div class="excerpt">
            <p><%= post.excerpt %></p>
          </div>

          <div class="tags">
            <% post.tags.forEach(function(tag) { %>
              <span class="tag">#<%= tag %></span>
            <% }); %>
          </div>

          <footer class="stats">
            <span class="views"><%= post.views.toLocaleString() %> views</span>
            <span class="likes"><%= post.likes.toLocaleString() %> likes</span>
            <span class="comments"><%= post.comments.toLocaleString() %> comments</span>
          </footer>
        </article>
      <% }); %>
    </section>

    <nav class="pagination">
      <% if (it.hasPrevPage) { %>
        <a href="/blog?page=<%= it.currentPage - 1 %>">Previous</a>
      <% } %>
      <span>Page <%= it.currentPage %> of <%= it.totalPages %></span>
      <% if (it.hasNextPage) { %>
        <a href="/blog?page=<%= it.currentPage + 1 %>">Next</a>
      <% } %>
    </nav>
  </main>

  <footer>
    <p>&copy; <%= it.site.year %> <%= it.site.name %>. All rights reserved.</p>
    <div class="social">
      <a href="https://twitter.com/<%= it.site.social.twitter %>">Twitter</a>
      <a href="https://github.com/<%= it.site.social.github %>">GitHub</a>
      <a href="https://linkedin.com/<%= it.site.social.linkedin %>">LinkedIn</a>
    </div>
  </footer>
</body>
</html>
`;
var compiled = eta.compile(template);
var data = generateTemplateData();
function render2() {
  return compiled(data, eta);
}
render2();
export {
  render2 as render
};
