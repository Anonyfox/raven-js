var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
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

// node_modules/ejs/lib/utils.js
var require_utils = __commonJS({
  "node_modules/ejs/lib/utils.js"(exports) {
    "use strict";
    var regExpChars = /[|\\{}()[\]^$+*?.]/g;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var hasOwn = function(obj, key) {
      return hasOwnProperty.apply(obj, [key]);
    };
    exports.escapeRegExpChars = function(string) {
      if (!string) {
        return "";
      }
      return String(string).replace(regExpChars, "\\$&");
    };
    var _ENCODE_HTML_RULES = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&#34;",
      "'": "&#39;"
    };
    var _MATCH_HTML = /[&<>'"]/g;
    function encode_char(c) {
      return _ENCODE_HTML_RULES[c] || c;
    }
    var escapeFuncStr = `var _ENCODE_HTML_RULES = {
      "&": "&amp;"
    , "<": "&lt;"
    , ">": "&gt;"
    , '"': "&#34;"
    , "'": "&#39;"
    }
  , _MATCH_HTML = /[&<>'"]/g;
function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};
`;
    exports.escapeXML = function(markup) {
      return markup == void 0 ? "" : String(markup).replace(_MATCH_HTML, encode_char);
    };
    function escapeXMLToString() {
      return Function.prototype.toString.call(this) + ";\n" + escapeFuncStr;
    }
    try {
      if (typeof Object.defineProperty === "function") {
        Object.defineProperty(exports.escapeXML, "toString", { value: escapeXMLToString });
      } else {
        exports.escapeXML.toString = escapeXMLToString;
      }
    } catch (err) {
      console.warn("Unable to set escapeXML.toString (is the Function prototype frozen?)");
    }
    exports.shallowCopy = function(to, from) {
      from = from || {};
      if (to !== null && to !== void 0) {
        for (var p in from) {
          if (!hasOwn(from, p)) {
            continue;
          }
          if (p === "__proto__" || p === "constructor") {
            continue;
          }
          to[p] = from[p];
        }
      }
      return to;
    };
    exports.shallowCopyFromList = function(to, from, list) {
      list = list || [];
      from = from || {};
      if (to !== null && to !== void 0) {
        for (var i = 0; i < list.length; i++) {
          var p = list[i];
          if (typeof from[p] != "undefined") {
            if (!hasOwn(from, p)) {
              continue;
            }
            if (p === "__proto__" || p === "constructor") {
              continue;
            }
            to[p] = from[p];
          }
        }
      }
      return to;
    };
    exports.cache = {
      _data: {},
      set: function(key, val) {
        this._data[key] = val;
      },
      get: function(key) {
        return this._data[key];
      },
      remove: function(key) {
        delete this._data[key];
      },
      reset: function() {
        this._data = {};
      }
    };
    exports.hyphenToCamel = function(str) {
      return str.replace(/-[a-z]/g, function(match) {
        return match[1].toUpperCase();
      });
    };
    exports.createNullProtoObjWherePossible = (function() {
      if (typeof Object.create == "function") {
        return function() {
          return /* @__PURE__ */ Object.create(null);
        };
      }
      if (!({ __proto__: null } instanceof Object)) {
        return function() {
          return { __proto__: null };
        };
      }
      return function() {
        return {};
      };
    })();
    exports.hasOwnOnlyObject = function(obj) {
      var o = exports.createNullProtoObjWherePossible();
      for (var p in obj) {
        if (hasOwn(obj, p)) {
          o[p] = obj[p];
        }
      }
      return o;
    };
  }
});

// node_modules/ejs/package.json
var require_package = __commonJS({
  "node_modules/ejs/package.json"(exports, module) {
    module.exports = {
      name: "ejs",
      description: "Embedded JavaScript templates",
      keywords: [
        "template",
        "engine",
        "ejs"
      ],
      version: "3.1.10",
      author: "Matthew Eernisse <mde@fleegix.org> (http://fleegix.org)",
      license: "Apache-2.0",
      bin: {
        ejs: "./bin/cli.js"
      },
      main: "./lib/ejs.js",
      jsdelivr: "ejs.min.js",
      unpkg: "ejs.min.js",
      repository: {
        type: "git",
        url: "git://github.com/mde/ejs.git"
      },
      bugs: "https://github.com/mde/ejs/issues",
      homepage: "https://github.com/mde/ejs",
      dependencies: {
        jake: "^10.8.5"
      },
      devDependencies: {
        browserify: "^16.5.1",
        eslint: "^6.8.0",
        "git-directory-deploy": "^1.5.1",
        jsdoc: "^4.0.2",
        "lru-cache": "^4.0.1",
        mocha: "^10.2.0",
        "uglify-js": "^3.3.16"
      },
      engines: {
        node: ">=0.10.0"
      },
      scripts: {
        test: "npx jake test"
      }
    };
  }
});

// node_modules/ejs/lib/ejs.js
var require_ejs = __commonJS({
  "node_modules/ejs/lib/ejs.js"(exports) {
    "use strict";
    var fs = __require("fs");
    var path = __require("path");
    var utils = require_utils();
    var scopeOptionWarned = false;
    var _VERSION_STRING = require_package().version;
    var _DEFAULT_OPEN_DELIMITER = "<";
    var _DEFAULT_CLOSE_DELIMITER = ">";
    var _DEFAULT_DELIMITER = "%";
    var _DEFAULT_LOCALS_NAME = "locals";
    var _NAME = "ejs";
    var _REGEX_STRING = "(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)";
    var _OPTS_PASSABLE_WITH_DATA = [
      "delimiter",
      "scope",
      "context",
      "debug",
      "compileDebug",
      "client",
      "_with",
      "rmWhitespace",
      "strict",
      "filename",
      "async"
    ];
    var _OPTS_PASSABLE_WITH_DATA_EXPRESS = _OPTS_PASSABLE_WITH_DATA.concat("cache");
    var _BOM = /^\uFEFF/;
    var _JS_IDENTIFIER = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
    exports.cache = utils.cache;
    exports.fileLoader = fs.readFileSync;
    exports.localsName = _DEFAULT_LOCALS_NAME;
    exports.promiseImpl = new Function("return this;")().Promise;
    exports.resolveInclude = function(name, filename, isDir) {
      var dirname = path.dirname;
      var extname = path.extname;
      var resolve = path.resolve;
      var includePath = resolve(isDir ? filename : dirname(filename), name);
      var ext = extname(name);
      if (!ext) {
        includePath += ".ejs";
      }
      return includePath;
    };
    function resolvePaths(name, paths) {
      var filePath;
      if (paths.some(function(v) {
        filePath = exports.resolveInclude(name, v, true);
        return fs.existsSync(filePath);
      })) {
        return filePath;
      }
    }
    function getIncludePath(path2, options) {
      var includePath;
      var filePath;
      var views = options.views;
      var match = /^[A-Za-z]+:\\|^\//.exec(path2);
      if (match && match.length) {
        path2 = path2.replace(/^\/*/, "");
        if (Array.isArray(options.root)) {
          includePath = resolvePaths(path2, options.root);
        } else {
          includePath = exports.resolveInclude(path2, options.root || "/", true);
        }
      } else {
        if (options.filename) {
          filePath = exports.resolveInclude(path2, options.filename);
          if (fs.existsSync(filePath)) {
            includePath = filePath;
          }
        }
        if (!includePath && Array.isArray(views)) {
          includePath = resolvePaths(path2, views);
        }
        if (!includePath && typeof options.includer !== "function") {
          throw new Error('Could not find the include file "' + options.escapeFunction(path2) + '"');
        }
      }
      return includePath;
    }
    function handleCache(options, template2) {
      var func;
      var filename = options.filename;
      var hasTemplate = arguments.length > 1;
      if (options.cache) {
        if (!filename) {
          throw new Error("cache option requires a filename");
        }
        func = exports.cache.get(filename);
        if (func) {
          return func;
        }
        if (!hasTemplate) {
          template2 = fileLoader(filename).toString().replace(_BOM, "");
        }
      } else if (!hasTemplate) {
        if (!filename) {
          throw new Error("Internal EJS error: no file name or template provided");
        }
        template2 = fileLoader(filename).toString().replace(_BOM, "");
      }
      func = exports.compile(template2, options);
      if (options.cache) {
        exports.cache.set(filename, func);
      }
      return func;
    }
    function tryHandleCache(options, data2, cb) {
      var result;
      if (!cb) {
        if (typeof exports.promiseImpl == "function") {
          return new exports.promiseImpl(function(resolve, reject) {
            try {
              result = handleCache(options)(data2);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          });
        } else {
          throw new Error("Please provide a callback function");
        }
      } else {
        try {
          result = handleCache(options)(data2);
        } catch (err) {
          return cb(err);
        }
        cb(null, result);
      }
    }
    function fileLoader(filePath) {
      return exports.fileLoader(filePath);
    }
    function includeFile(path2, options) {
      var opts = utils.shallowCopy(utils.createNullProtoObjWherePossible(), options);
      opts.filename = getIncludePath(path2, opts);
      if (typeof options.includer === "function") {
        var includerResult = options.includer(path2, opts.filename);
        if (includerResult) {
          if (includerResult.filename) {
            opts.filename = includerResult.filename;
          }
          if (includerResult.template) {
            return handleCache(opts, includerResult.template);
          }
        }
      }
      return handleCache(opts);
    }
    function rethrow(err, str, flnm, lineno, esc) {
      var lines = str.split("\n");
      var start = Math.max(lineno - 3, 0);
      var end = Math.min(lines.length, lineno + 3);
      var filename = esc(flnm);
      var context = lines.slice(start, end).map(function(line, i) {
        var curr = i + start + 1;
        return (curr == lineno ? " >> " : "    ") + curr + "| " + line;
      }).join("\n");
      err.path = filename;
      err.message = (filename || "ejs") + ":" + lineno + "\n" + context + "\n\n" + err.message;
      throw err;
    }
    function stripSemi(str) {
      return str.replace(/;(\s*$)/, "$1");
    }
    exports.compile = function compile(template2, opts) {
      var templ;
      if (opts && opts.scope) {
        if (!scopeOptionWarned) {
          console.warn("`scope` option is deprecated and will be removed in EJS 3");
          scopeOptionWarned = true;
        }
        if (!opts.context) {
          opts.context = opts.scope;
        }
        delete opts.scope;
      }
      templ = new Template(template2, opts);
      return templ.compile();
    };
    exports.render = function(template2, d, o) {
      var data2 = d || utils.createNullProtoObjWherePossible();
      var opts = o || utils.createNullProtoObjWherePossible();
      if (arguments.length == 2) {
        utils.shallowCopyFromList(opts, data2, _OPTS_PASSABLE_WITH_DATA);
      }
      return handleCache(opts, template2)(data2);
    };
    exports.renderFile = function() {
      var args = Array.prototype.slice.call(arguments);
      var filename = args.shift();
      var cb;
      var opts = { filename };
      var data2;
      var viewOpts;
      if (typeof arguments[arguments.length - 1] == "function") {
        cb = args.pop();
      }
      if (args.length) {
        data2 = args.shift();
        if (args.length) {
          utils.shallowCopy(opts, args.pop());
        } else {
          if (data2.settings) {
            if (data2.settings.views) {
              opts.views = data2.settings.views;
            }
            if (data2.settings["view cache"]) {
              opts.cache = true;
            }
            viewOpts = data2.settings["view options"];
            if (viewOpts) {
              utils.shallowCopy(opts, viewOpts);
            }
          }
          utils.shallowCopyFromList(opts, data2, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
        }
        opts.filename = filename;
      } else {
        data2 = utils.createNullProtoObjWherePossible();
      }
      return tryHandleCache(opts, data2, cb);
    };
    exports.Template = Template;
    exports.clearCache = function() {
      exports.cache.reset();
    };
    function Template(text, optsParam) {
      var opts = utils.hasOwnOnlyObject(optsParam);
      var options = utils.createNullProtoObjWherePossible();
      this.templateText = text;
      this.mode = null;
      this.truncate = false;
      this.currentLine = 1;
      this.source = "";
      options.client = opts.client || false;
      options.escapeFunction = opts.escape || opts.escapeFunction || utils.escapeXML;
      options.compileDebug = opts.compileDebug !== false;
      options.debug = !!opts.debug;
      options.filename = opts.filename;
      options.openDelimiter = opts.openDelimiter || exports.openDelimiter || _DEFAULT_OPEN_DELIMITER;
      options.closeDelimiter = opts.closeDelimiter || exports.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
      options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
      options.strict = opts.strict || false;
      options.context = opts.context;
      options.cache = opts.cache || false;
      options.rmWhitespace = opts.rmWhitespace;
      options.root = opts.root;
      options.includer = opts.includer;
      options.outputFunctionName = opts.outputFunctionName;
      options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
      options.views = opts.views;
      options.async = opts.async;
      options.destructuredLocals = opts.destructuredLocals;
      options.legacyInclude = typeof opts.legacyInclude != "undefined" ? !!opts.legacyInclude : true;
      if (options.strict) {
        options._with = false;
      } else {
        options._with = typeof opts._with != "undefined" ? opts._with : true;
      }
      this.opts = options;
      this.regex = this.createRegex();
    }
    Template.modes = {
      EVAL: "eval",
      ESCAPED: "escaped",
      RAW: "raw",
      COMMENT: "comment",
      LITERAL: "literal"
    };
    Template.prototype = {
      createRegex: function() {
        var str = _REGEX_STRING;
        var delim = utils.escapeRegExpChars(this.opts.delimiter);
        var open = utils.escapeRegExpChars(this.opts.openDelimiter);
        var close = utils.escapeRegExpChars(this.opts.closeDelimiter);
        str = str.replace(/%/g, delim).replace(/</g, open).replace(/>/g, close);
        return new RegExp(str);
      },
      compile: function() {
        var src;
        var fn;
        var opts = this.opts;
        var prepended = "";
        var appended = "";
        var escapeFn = opts.escapeFunction;
        var ctor;
        var sanitizedFilename = opts.filename ? JSON.stringify(opts.filename) : "undefined";
        if (!this.source) {
          this.generateSource();
          prepended += '  var __output = "";\n  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
          if (opts.outputFunctionName) {
            if (!_JS_IDENTIFIER.test(opts.outputFunctionName)) {
              throw new Error("outputFunctionName is not a valid JS identifier.");
            }
            prepended += "  var " + opts.outputFunctionName + " = __append;\n";
          }
          if (opts.localsName && !_JS_IDENTIFIER.test(opts.localsName)) {
            throw new Error("localsName is not a valid JS identifier.");
          }
          if (opts.destructuredLocals && opts.destructuredLocals.length) {
            var destructuring = "  var __locals = (" + opts.localsName + " || {}),\n";
            for (var i = 0; i < opts.destructuredLocals.length; i++) {
              var name = opts.destructuredLocals[i];
              if (!_JS_IDENTIFIER.test(name)) {
                throw new Error("destructuredLocals[" + i + "] is not a valid JS identifier.");
              }
              if (i > 0) {
                destructuring += ",\n  ";
              }
              destructuring += name + " = __locals." + name;
            }
            prepended += destructuring + ";\n";
          }
          if (opts._with !== false) {
            prepended += "  with (" + opts.localsName + " || {}) {\n";
            appended += "  }\n";
          }
          appended += "  return __output;\n";
          this.source = prepended + this.source + appended;
        }
        if (opts.compileDebug) {
          src = "var __line = 1\n  , __lines = " + JSON.stringify(this.templateText) + "\n  , __filename = " + sanitizedFilename + ";\ntry {\n" + this.source + "} catch (e) {\n  rethrow(e, __lines, __filename, __line, escapeFn);\n}\n";
        } else {
          src = this.source;
        }
        if (opts.client) {
          src = "escapeFn = escapeFn || " + escapeFn.toString() + ";\n" + src;
          if (opts.compileDebug) {
            src = "rethrow = rethrow || " + rethrow.toString() + ";\n" + src;
          }
        }
        if (opts.strict) {
          src = '"use strict";\n' + src;
        }
        if (opts.debug) {
          console.log(src);
        }
        if (opts.compileDebug && opts.filename) {
          src = src + "\n//# sourceURL=" + sanitizedFilename + "\n";
        }
        try {
          if (opts.async) {
            try {
              ctor = new Function("return (async function(){}).constructor;")();
            } catch (e) {
              if (e instanceof SyntaxError) {
                throw new Error("This environment does not support async/await");
              } else {
                throw e;
              }
            }
          } else {
            ctor = Function;
          }
          fn = new ctor(opts.localsName + ", escapeFn, include, rethrow", src);
        } catch (e) {
          if (e instanceof SyntaxError) {
            if (opts.filename) {
              e.message += " in " + opts.filename;
            }
            e.message += " while compiling ejs\n\n";
            e.message += "If the above error is not helpful, you may want to try EJS-Lint:\n";
            e.message += "https://github.com/RyanZim/EJS-Lint";
            if (!opts.async) {
              e.message += "\n";
              e.message += "Or, if you meant to create an async function, pass `async: true` as an option.";
            }
          }
          throw e;
        }
        var returnedFn = opts.client ? fn : function anonymous(data2) {
          var include = function(path2, includeData) {
            var d = utils.shallowCopy(utils.createNullProtoObjWherePossible(), data2);
            if (includeData) {
              d = utils.shallowCopy(d, includeData);
            }
            return includeFile(path2, opts)(d);
          };
          return fn.apply(
            opts.context,
            [data2 || utils.createNullProtoObjWherePossible(), escapeFn, include, rethrow]
          );
        };
        if (opts.filename && typeof Object.defineProperty === "function") {
          var filename = opts.filename;
          var basename = path.basename(filename, path.extname(filename));
          try {
            Object.defineProperty(returnedFn, "name", {
              value: basename,
              writable: false,
              enumerable: false,
              configurable: true
            });
          } catch (e) {
          }
        }
        return returnedFn;
      },
      generateSource: function() {
        var opts = this.opts;
        if (opts.rmWhitespace) {
          this.templateText = this.templateText.replace(/[\r\n]+/g, "\n").replace(/^\s+|\s+$/gm, "");
        }
        this.templateText = this.templateText.replace(/[ \t]*<%_/gm, "<%_").replace(/_%>[ \t]*/gm, "_%>");
        var self = this;
        var matches = this.parseTemplateText();
        var d = this.opts.delimiter;
        var o = this.opts.openDelimiter;
        var c = this.opts.closeDelimiter;
        if (matches && matches.length) {
          matches.forEach(function(line, index) {
            var closing;
            if (line.indexOf(o + d) === 0 && line.indexOf(o + d + d) !== 0) {
              closing = matches[index + 2];
              if (!(closing == d + c || closing == "-" + d + c || closing == "_" + d + c)) {
                throw new Error('Could not find matching close tag for "' + line + '".');
              }
            }
            self.scanLine(line);
          });
        }
      },
      parseTemplateText: function() {
        var str = this.templateText;
        var pat = this.regex;
        var result = pat.exec(str);
        var arr = [];
        var firstPos;
        while (result) {
          firstPos = result.index;
          if (firstPos !== 0) {
            arr.push(str.substring(0, firstPos));
            str = str.slice(firstPos);
          }
          arr.push(result[0]);
          str = str.slice(result[0].length);
          result = pat.exec(str);
        }
        if (str) {
          arr.push(str);
        }
        return arr;
      },
      _addOutput: function(line) {
        if (this.truncate) {
          line = line.replace(/^(?:\r\n|\r|\n)/, "");
          this.truncate = false;
        }
        if (!line) {
          return line;
        }
        line = line.replace(/\\/g, "\\\\");
        line = line.replace(/\n/g, "\\n");
        line = line.replace(/\r/g, "\\r");
        line = line.replace(/"/g, '\\"');
        this.source += '    ; __append("' + line + '")\n';
      },
      scanLine: function(line) {
        var self = this;
        var d = this.opts.delimiter;
        var o = this.opts.openDelimiter;
        var c = this.opts.closeDelimiter;
        var newLineCount = 0;
        newLineCount = line.split("\n").length - 1;
        switch (line) {
          case o + d:
          case o + d + "_":
            this.mode = Template.modes.EVAL;
            break;
          case o + d + "=":
            this.mode = Template.modes.ESCAPED;
            break;
          case o + d + "-":
            this.mode = Template.modes.RAW;
            break;
          case o + d + "#":
            this.mode = Template.modes.COMMENT;
            break;
          case o + d + d:
            this.mode = Template.modes.LITERAL;
            this.source += '    ; __append("' + line.replace(o + d + d, o + d) + '")\n';
            break;
          case d + d + c:
            this.mode = Template.modes.LITERAL;
            this.source += '    ; __append("' + line.replace(d + d + c, d + c) + '")\n';
            break;
          case d + c:
          case "-" + d + c:
          case "_" + d + c:
            if (this.mode == Template.modes.LITERAL) {
              this._addOutput(line);
            }
            this.mode = null;
            this.truncate = line.indexOf("-") === 0 || line.indexOf("_") === 0;
            break;
          default:
            if (this.mode) {
              switch (this.mode) {
                case Template.modes.EVAL:
                case Template.modes.ESCAPED:
                case Template.modes.RAW:
                  if (line.lastIndexOf("//") > line.lastIndexOf("\n")) {
                    line += "\n";
                  }
              }
              switch (this.mode) {
                // Just executing code
                case Template.modes.EVAL:
                  this.source += "    ; " + line + "\n";
                  break;
                // Exec, esc, and output
                case Template.modes.ESCAPED:
                  this.source += "    ; __append(escapeFn(" + stripSemi(line) + "))\n";
                  break;
                // Exec and output
                case Template.modes.RAW:
                  this.source += "    ; __append(" + stripSemi(line) + ")\n";
                  break;
                case Template.modes.COMMENT:
                  break;
                // Literal <%% mode, append as raw output
                case Template.modes.LITERAL:
                  this._addOutput(line);
                  break;
              }
            } else {
              this._addOutput(line);
            }
        }
        if (self.opts.compileDebug && newLineCount) {
          this.currentLine += newLineCount;
          this.source += "    ; __line = " + this.currentLine + "\n";
        }
      }
    };
    exports.escapeXML = utils.escapeXML;
    exports.__express = exports.renderFile;
    exports.VERSION = _VERSION_STRING;
    exports.name = _NAME;
    if (typeof window != "undefined") {
      window.ejs = exports;
    }
  }
});

// bundles/ejs-entry.js
var import_ejs = __toESM(require_ejs(), 1);

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

// bundles/ejs-entry.js
var template = `<!DOCTYPE html>
<html lang="en" data-theme="<%= userPreferences.theme %>">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= site.name %> - Modern Web Development Blog</title>
    <meta name="description" content="<%= site.description %>" />
    <meta name="author" content="<%= site.author %>" />
    <meta property="og:title" content="<%= site.name %>" />
    <meta property="og:description" content="<%= site.description %>" />
    <meta property="og:type" content="website" />
    <link rel="canonical" href="<%= site.url %>" />
    <link rel="stylesheet" href="/css/blog.css" />
    <script defer src="/js/blog-interactions.js"></script>
  </head>
  <body>
    <header class="site-header">
      <div class="header-content">
        <div class="site-branding">
          <h1 class="site-title">
            <a href="/"><%= site.name %></a>
          </h1>
          <p class="site-tagline"><%= site.description %></p>
        </div>
        <nav class="main-nav" role="navigation" aria-label="Main navigation">
          <ul class="nav-list">
            <% site.navigation.forEach(function(item) { %>
            <li class="nav-item">
              <a href="<%= item.url %>" class="nav-link <%= item.url === '/' ? 'active' : '' %>">
                <%= item.name %>
              </a>
            </li>
            <% }); %>
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
                <input
                  type="search"
                  id="search"
                  name="q"
                  placeholder="Search posts..."
                  value="<%= searchQuery %>"
                  class="search-input"
                />
                <button type="submit" class="search-btn">\u{1F50D} Search</button>
              </div>
            </form>
            <div class="filter-controls">
              <select name="category" class="filter-select" title="Filter by category">
                <option value="">All Categories</option>
                <% categories.forEach(function(category) { %>
                <option value="<%= category %>" <%= selectedCategory === category ? 'selected' : '' %>>
                  <%= category %>
                </option>
                <% }); %>
              </select>
              <select name="sort" class="filter-select" title="Sort posts">
                <option value="publishedAt" <%= sortBy === 'publishedAt' ? 'selected' : '' %>>Latest First</option>
                <option value="views" <%= sortBy === 'views' ? 'selected' : '' %>>Most Popular</option>
                <option value="likes" <%= sortBy === 'likes' ? 'selected' : '' %>>Most Liked</option>
              </select>
            </div>
          </div>

          <!-- Featured Posts Section -->
          <% if (featuredPosts.length > 0) { %>
          <section class="featured-posts" aria-labelledby="featured-heading">
            <h2 id="featured-heading">Featured Posts</h2>
            <div class="featured-grid">
              <% featuredPosts.forEach(function(post) { %>
              <article class="featured-post">
                <div class="featured-content">
                  <div class="post-badge">Featured</div>
                  <h3>
                    <a href="/blog/<%= post.slug %>" class="featured-title">
                      <%= post.title %>
                    </a>
                  </h3>
                  <p class="featured-excerpt"><%= post.excerpt %></p>
                  <div class="featured-meta">
                    <span class="author">by <%= post.author.name %></span>
                    <span class="read-time"><%= post.readTime %> min read</span>
                    <span class="views"><%= post.views.toLocaleString() %> views</span>
                  </div>
                </div>
              </article>
              <% }); %>
            </div>
          </section>
          <% } %>

          <!-- Posts Section -->
          <section class="posts-section" aria-labelledby="posts-heading">
            <div class="section-header">
              <h2 id="posts-heading">
                <%= selectedCategory ? 'Posts in ' + selectedCategory : 'All Posts' %>
              </h2>
              <div class="posts-count"><%= posts.length %> posts found</div>
            </div>

            <% if (posts.length > 0) { %>
            <div class="posts-grid <%= userPreferences.compactView ? 'compact' : '' %>">
              <% posts.forEach(function(post) {
                var publishedDate = new Date(post.publishedAt);
                var isRecent = Date.now() - publishedDate.getTime() < 7 * 24 * 60 * 60 * 1000;
                var readTimeCategory = post.readTime <= 3 ? 'quick' : post.readTime <= 7 ? 'medium' : 'long';
              %>
              <article class="post-card <%= post.featured ? 'featured' : '' %> <%= userPreferences.compactView ? 'compact' : '' %>"
                       data-category="<%= post.category %>"
                       data-read-time="<%= readTimeCategory %>">
                <header class="post-header">
                  <div class="post-badges">
                    <% if (post.featured) { %>
                    <span class="badge featured">Featured</span>
                    <% } %>
                    <% if (isRecent) { %>
                    <span class="badge new">New</span>
                    <% } %>
                    <span class="badge category"><%= post.category %></span>
                  </div>
                  <h3 class="post-title">
                    <a href="/blog/<%= post.slug %>" class="post-link">
                      <%= post.title %>
                    </a>
                  </h3>
                  <div class="post-meta">
                    <div class="author-info">
                      <img src="https://via.placeholder.com/32x32?text=<%= post.author.name.split(' ').map(n => n[0]).join('') %>"
                           alt="<%= post.author.name %>"
                           class="author-avatar"
                           width="32" height="32" />
                      <div class="author-details">
                        <span class="author-name"><%= post.author.name %></span>
                        <span class="author-bio"><%= post.author.bio %></span>
                      </div>
                    </div>
                    <div class="post-timing">
                      <time datetime="<%= publishedDate.toISOString() %>"
                            class="publish-date"
                            title="Published on <%= publishedDate.toLocaleDateString() %>">
                        <%= publishedDate.toLocaleDateString() %>
                      </time>
                      <span class="read-time" title="Estimated reading time">
                        \u{1F4D6} <%= post.readTime %> min read
                      </span>
                    </div>
                  </div>
                </header>

                <% if (!userPreferences.compactView) { %>
                <div class="post-content">
                  <p class="post-excerpt"><%= post.excerpt %></p>
                  <% if (post.content.length > 500) { %>
                  <details class="content-preview">
                    <summary>Read more...</summary>
                    <div class="full-content">
                      <% post.content.split('\\\\n\\\\n').forEach(function(paragraph) { %>
                      <p><%= paragraph %></p>
                      <% }); %>
                    </div>
                  </details>
                  <% } %>
                </div>
                <% } %>

                <div class="post-tags">
                  <% post.tags.forEach(function(tag) { %>
                  <a href="/blog/tag/<%= encodeURIComponent(tag) %>" class="tag">
                    #<%= tag %>
                  </a>
                  <% }); %>
                </div>

                <footer class="post-stats">
                  <div class="engagement-stats">
                    <span class="stat views" title="<%= post.views.toLocaleString() %> views">
                      \u{1F441}\uFE0F <%= post.views > 1000 ? Math.round(post.views / 1000) + 'k' : post.views %>
                    </span>
                    <span class="stat likes" title="<%= post.likes.toLocaleString() %> likes">
                      \u2764\uFE0F <%= post.likes > 1000 ? Math.round(post.likes / 1000) + 'k' : post.likes %>
                    </span>
                    <span class="stat comments" title="<%= post.comments.toLocaleString() %> comments">
                      \u{1F4AC} <%= post.comments %>
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
              <% }); %>
            </div>
            <% } else { %>
            <div class="no-posts">
              <h3>No posts found</h3>
              <p>Try adjusting your search or filter criteria to find more posts.</p>
              <a href="/blog" class="reset-filters">Reset filters</a>
            </div>
            <% } %>
          </section>

          <!-- Pagination -->
          <% if (posts.length > 0) { %>
          <nav class="pagination" role="navigation" aria-label="Pagination">
            <div class="pagination-info">
              <span>Page <%= currentPage %> of <%= totalPages %> (<%= totalPages * 10 %> total posts)</span>
            </div>
            <div class="pagination-controls">
              <% if (hasPrevPage) { %>
              <a href="/blog?page=1" class="page-link first" aria-label="Go to first page">\xAB First</a>
              <a href="/blog?page=<%= currentPage - 1 %>" class="page-link prev" aria-label="Go to previous page">\u2039 Previous</a>
              <% } else { %>
              <span class="page-link disabled">\xAB First</span>
              <span class="page-link disabled">\u2039 Previous</span>
              <% } %>

              <%
              var showPages = 5;
              var start = Math.max(1, currentPage - Math.floor(showPages / 2));
              var end = Math.min(totalPages, start + showPages - 1);
              if (end - start + 1 < showPages) {
                start = Math.max(1, end - showPages + 1);
              }
              for (var i = start; i <= end; i++) { %>
              <a href="/blog?page=<%= i %>"
                 class="page-link <%= i === currentPage ? 'current' : '' %>"
                 <%= i === currentPage ? 'aria-current="page"' : '' %>>
                <%= i %>
              </a>
              <% } %>

              <% if (hasNextPage) { %>
              <a href="/blog?page=<%= currentPage + 1 %>" class="page-link next" aria-label="Go to next page">Next \u203A</a>
              <a href="/blog?page=<%= totalPages %>" class="page-link last" aria-label="Go to last page">Last \xBB</a>
              <% } else { %>
              <span class="page-link disabled">Next \u203A</span>
              <span class="page-link disabled">Last \xBB</span>
              <% } %>
            </div>
          </nav>
          <% } %>
        </div>

        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Analytics Dashboard -->
          <div class="analytics-dashboard">
            <h3>Blog Statistics</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-number"><%= totalPosts.toLocaleString() %></span>
                <span class="stat-label">Total Posts</span>
              </div>
              <div class="stat-item">
                <span class="stat-number"><%= analytics.totalViews.toLocaleString() %></span>
                <span class="stat-label">Total Views</span>
              </div>
              <div class="stat-item">
                <span class="stat-number"><%= analytics.totalLikes.toLocaleString() %></span>
                <span class="stat-label">Total Likes</span>
              </div>
              <div class="stat-item">
                <span class="stat-number"><%= analytics.avgReadTime %> min</span>
                <span class="stat-label">Avg Read Time</span>
              </div>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="category-filter">
            <h3>Filter by Category</h3>
            <ul class="category-list">
              <li>
                <a href="/blog" class="category-link <%= selectedCategory === '' ? 'active' : '' %>">
                  All Posts
                </a>
              </li>
              <% categories.forEach(function(category) { %>
              <li>
                <a href="/blog?category=<%= encodeURIComponent(category) %>"
                   class="category-link <%= selectedCategory === category ? 'active' : '' %>">
                  <%= category %>
                </a>
              </li>
              <% }); %>
            </ul>
          </div>

          <!-- Popular Tags -->
          <div class="popular-tags">
            <h3>Popular Tags</h3>
            <div class="tag-cloud">
              <% popularTags.forEach(function(tag) { %>
              <a href="/blog/tag/<%= encodeURIComponent(tag.name) %>"
                 class="tag-link"
                 style="font-size: <%= Math.min(1.2 + tag.count * 0.1, 2) %>rem"
                 title="<%= tag.count %> posts">
                #<%= tag.name %>
                <span class="tag-count">(<%= tag.count %>)</span>
              </a>
              <% }); %>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="recent-activity">
            <h3>Recent Activity</h3>
            <ul class="activity-list">
              <% recentActivity.forEach(function(activity) { %>
              <li class="activity-item">
                <div class="activity-content">
                  <span class="activity-type"><%= activity.type %></span>
                  <a href="/blog/<%= activity.post.slug %>" class="activity-link">
                    <%= activity.post.title %>
                  </a>
                  <time class="activity-time">
                    <%= new Date(activity.timestamp).toLocaleDateString() %>
                  </time>
                </div>
              </li>
              <% }); %>
            </ul>
          </div>

          <!-- Newsletter Signup -->
          <div class="newsletter-signup">
            <h3>Stay Updated</h3>
            <p>Get notified about new posts and updates.</p>
            <form class="newsletter-form">
              <input type="email" placeholder="your@email.com" required class="newsletter-input" />
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
          <p>&copy; <%= site.year %> <%= site.name %>. All rights reserved.</p>
          <p>Built with modern web technologies for optimal performance and accessibility.</p>
        </div>
        <div class="social-links">
          <a href="https://twitter.com/<%= site.social.twitter %>" class="social-link twitter" aria-label="Follow us on Twitter">
            \u{1F426} Twitter
          </a>
          <a href="https://github.com/<%= site.social.github %>" class="social-link github" aria-label="View our GitHub repository">
            \u{1F419} GitHub
          </a>
          <a href="https://linkedin.com/<%= site.social.linkedin %>" class="social-link linkedin" aria-label="Connect with us on LinkedIn">
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
function render() {
  return import_ejs.default.render(template, data);
}
render();
export {
  render
};
/*! Bundled license information:

ejs/lib/ejs.js:
  (**
   * @file Embedded JavaScript templating engine. {@link http://ejs.co}
   * @author Matthew Eernisse <mde@fleegix.org>
   * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
   * @project EJS
   * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
   *)
*/
