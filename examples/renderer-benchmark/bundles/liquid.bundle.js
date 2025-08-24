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

// node_modules/liquidjs/dist/liquid.node.js
var require_liquid_node = __commonJS({
  "node_modules/liquidjs/dist/liquid.node.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stream = __require("stream");
    var path = __require("path");
    var fs$1 = __require("fs");
    var Token = class {
      constructor(kind, input, begin, end, file) {
        this.kind = kind;
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
      }
      getText() {
        return this.input.slice(this.begin, this.end);
      }
      getPosition() {
        let [row, col] = [1, 1];
        for (let i = 0; i < this.begin; i++) {
          if (this.input[i] === "\n") {
            row++;
            col = 1;
          } else
            col++;
        }
        return [row, col];
      }
      size() {
        return this.end - this.begin;
      }
    };
    var Drop = class {
      liquidMethodMissing(key) {
        return void 0;
      }
    };
    var toString$1 = Object.prototype.toString;
    var toLowerCase = String.prototype.toLowerCase;
    var hasOwnProperty = Object.hasOwnProperty;
    function isString(value) {
      return typeof value === "string";
    }
    function isFunction(value) {
      return typeof value === "function";
    }
    function isPromise(val) {
      return val && isFunction(val.then);
    }
    function isIterator(val) {
      return val && isFunction(val.next) && isFunction(val.throw) && isFunction(val.return);
    }
    function escapeRegex(str) {
      return str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    function promisify(fn) {
      return function(...args) {
        return new Promise((resolve2, reject2) => {
          fn(...args, (err, result) => {
            err ? reject2(err) : resolve2(result);
          });
        });
      };
    }
    function stringify(value) {
      value = toValue(value);
      if (isString(value))
        return value;
      if (isNil(value))
        return "";
      if (isArray(value))
        return value.map((x) => stringify(x)).join("");
      return String(value);
    }
    function toEnumerable(val) {
      val = toValue(val);
      if (isArray(val))
        return val;
      if (isString(val) && val.length > 0)
        return [val];
      if (isIterable(val))
        return Array.from(val);
      if (isObject(val))
        return Object.keys(val).map((key) => [key, val[key]]);
      return [];
    }
    function toArray(val) {
      val = toValue(val);
      if (isNil(val))
        return [];
      if (isArray(val))
        return val;
      return [val];
    }
    function toValue(value) {
      return value instanceof Drop && isFunction(value.valueOf) ? value.valueOf() : value;
    }
    function toNumber(value) {
      value = Number(value);
      return isNaN(value) ? 0 : value;
    }
    function isNumber(value) {
      return typeof value === "number";
    }
    function toLiquid(value) {
      if (value && isFunction(value.toLiquid))
        return toLiquid(value.toLiquid());
      return value;
    }
    function isNil(value) {
      return value == null;
    }
    function isUndefined(value) {
      return value === void 0;
    }
    function isArray(value) {
      return toString$1.call(value) === "[object Array]";
    }
    function isArrayLike(value) {
      return value && isNumber(value.length);
    }
    function isIterable(value) {
      return isObject(value) && Symbol.iterator in value;
    }
    function forOwn(obj, iteratee) {
      obj = obj || {};
      for (const k in obj) {
        if (hasOwnProperty.call(obj, k)) {
          if (iteratee(obj[k], k, obj) === false)
            break;
        }
      }
      return obj;
    }
    function last(arr) {
      return arr[arr.length - 1];
    }
    function isObject(value) {
      const type = typeof value;
      return value !== null && (type === "object" || type === "function");
    }
    function range(start, stop, step = 1) {
      const arr = [];
      for (let i = start; i < stop; i += step) {
        arr.push(i);
      }
      return arr;
    }
    function padStart(str, length, ch = " ") {
      return pad(str, length, ch, (str2, ch2) => ch2 + str2);
    }
    function padEnd(str, length, ch = " ") {
      return pad(str, length, ch, (str2, ch2) => str2 + ch2);
    }
    function pad(str, length, ch, add) {
      str = String(str);
      let n = length - str.length;
      while (n-- > 0)
        str = add(str, ch);
      return str;
    }
    function identify(val) {
      return val;
    }
    function changeCase(str) {
      const hasLowerCase = [...str].some((ch) => ch >= "a" && ch <= "z");
      return hasLowerCase ? str.toUpperCase() : str.toLowerCase();
    }
    function ellipsis(str, N) {
      return str.length > N ? str.slice(0, N - 3) + "..." : str;
    }
    function caseInsensitiveCompare(a, b) {
      if (a == null && b == null)
        return 0;
      if (a == null)
        return 1;
      if (b == null)
        return -1;
      a = toLowerCase.call(a);
      b = toLowerCase.call(b);
      if (a < b)
        return -1;
      if (a > b)
        return 1;
      return 0;
    }
    function argumentsToValue(fn) {
      return function(...args) {
        return fn.call(this, ...args.map(toValue));
      };
    }
    function escapeRegExp(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }
    function* strictUniq(array) {
      const seen = /* @__PURE__ */ new Set();
      for (const element of array) {
        const key = JSON.stringify(element);
        if (!seen.has(key)) {
          seen.add(key);
          yield element;
        }
      }
    }
    var TRAIT = "__liquidClass__";
    var LiquidError = class extends Error {
      constructor(err, token) {
        super(typeof err === "string" ? err : err.message);
        this.context = "";
        if (typeof err !== "string")
          Object.defineProperty(this, "originalError", { value: err, enumerable: false });
        Object.defineProperty(this, "token", { value: token, enumerable: false });
        Object.defineProperty(this, TRAIT, { value: "LiquidError", enumerable: false });
      }
      update() {
        Object.defineProperty(this, "context", { value: mkContext(this.token), enumerable: false });
        this.message = mkMessage(this.message, this.token);
        this.stack = this.message + "\n" + this.context + "\n" + this.stack;
        if (this.originalError)
          this.stack += "\nFrom " + this.originalError.stack;
      }
      static is(obj) {
        return obj?.[TRAIT] === "LiquidError";
      }
    };
    var TokenizationError = class extends LiquidError {
      constructor(message, token) {
        super(message, token);
        this.name = "TokenizationError";
        super.update();
      }
    };
    var ParseError = class extends LiquidError {
      constructor(err, token) {
        super(err, token);
        this.name = "ParseError";
        this.message = err.message;
        super.update();
      }
    };
    var RenderError = class extends LiquidError {
      constructor(err, tpl) {
        super(err, tpl.token);
        this.name = "RenderError";
        this.message = err.message;
        super.update();
      }
      static is(obj) {
        return obj.name === "RenderError";
      }
    };
    var LiquidErrors = class extends LiquidError {
      constructor(errors) {
        super(errors[0], errors[0].token);
        this.errors = errors;
        this.name = "LiquidErrors";
        const s = errors.length > 1 ? "s" : "";
        this.message = `${errors.length} error${s} found`;
        super.update();
      }
      static is(obj) {
        return obj.name === "LiquidErrors";
      }
    };
    var UndefinedVariableError = class extends LiquidError {
      constructor(err, token) {
        super(err, token);
        this.name = "UndefinedVariableError";
        this.message = err.message;
        super.update();
      }
    };
    var InternalUndefinedVariableError = class extends Error {
      constructor(variableName) {
        super(`undefined variable: ${variableName}`);
        this.name = "InternalUndefinedVariableError";
        this.variableName = variableName;
      }
    };
    var AssertionError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "AssertionError";
        this.message = message + "";
      }
    };
    function mkContext(token) {
      const [line, col] = token.getPosition();
      const lines = token.input.split("\n");
      const begin = Math.max(line - 2, 1);
      const end = Math.min(line + 3, lines.length);
      const context = range(begin, end + 1).map((lineNumber) => {
        const rowIndicator = lineNumber === line ? ">> " : "   ";
        const num = padStart(String(lineNumber), String(end).length);
        let text = `${rowIndicator}${num}| `;
        const colIndicator = lineNumber === line ? "\n" + padStart("^", col + text.length) : "";
        text += lines[lineNumber - 1];
        text += colIndicator;
        return text;
      }).join("\n");
      return context;
    }
    function mkMessage(msg, token) {
      if (token.file)
        msg += `, file:${token.file}`;
      const [line, col] = token.getPosition();
      msg += `, line:${line}, col:${col}`;
      return msg;
    }
    var TYPES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 4, 4, 4, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 2, 8, 0, 0, 0, 0, 8, 0, 0, 0, 64, 0, 65, 0, 0, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 0, 0, 2, 2, 2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var WORD = 1;
    var BLANK = 4;
    var QUOTE = 8;
    var INLINE_BLANK = 16;
    var NUMBER = 32;
    var SIGN = 64;
    var PUNCTUATION = 128;
    function isWord(char) {
      const code = char.charCodeAt(0);
      return code >= 128 ? !TYPES[code] : !!(TYPES[code] & WORD);
    }
    TYPES[160] = TYPES[5760] = TYPES[6158] = TYPES[8192] = TYPES[8193] = TYPES[8194] = TYPES[8195] = TYPES[8196] = TYPES[8197] = TYPES[8198] = TYPES[8199] = TYPES[8200] = TYPES[8201] = TYPES[8202] = TYPES[8232] = TYPES[8233] = TYPES[8239] = TYPES[8287] = TYPES[12288] = BLANK;
    TYPES[8220] = TYPES[8221] = PUNCTUATION;
    function assert(predicate, message) {
      if (!predicate) {
        const msg = typeof message === "function" ? message() : message || `expect ${predicate} to be true`;
        throw new AssertionError(msg);
      }
    }
    function assertEmpty(predicate, message = `unexpected ${JSON.stringify(predicate)}`) {
      assert(!predicate, message);
    }
    var NullDrop = class extends Drop {
      equals(value) {
        return isNil(toValue(value));
      }
      gt() {
        return false;
      }
      geq() {
        return false;
      }
      lt() {
        return false;
      }
      leq() {
        return false;
      }
      valueOf() {
        return null;
      }
    };
    var EmptyDrop = class _EmptyDrop extends Drop {
      equals(value) {
        if (value instanceof _EmptyDrop)
          return false;
        value = toValue(value);
        if (isString(value) || isArray(value))
          return value.length === 0;
        if (isObject(value))
          return Object.keys(value).length === 0;
        return false;
      }
      gt() {
        return false;
      }
      geq() {
        return false;
      }
      lt() {
        return false;
      }
      leq() {
        return false;
      }
      valueOf() {
        return "";
      }
      static is(value) {
        return value instanceof _EmptyDrop;
      }
    };
    var BlankDrop = class _BlankDrop extends EmptyDrop {
      equals(value) {
        if (value === false)
          return true;
        if (isNil(toValue(value)))
          return true;
        if (isString(value))
          return /^\s*$/.test(value);
        return super.equals(value);
      }
      static is(value) {
        return value instanceof _BlankDrop;
      }
    };
    var ForloopDrop = class extends Drop {
      constructor(length, collection, variable) {
        super();
        this.i = 0;
        this.length = length;
        this.name = `${variable}-${collection}`;
      }
      next() {
        this.i++;
      }
      index0() {
        return this.i;
      }
      index() {
        return this.i + 1;
      }
      first() {
        return this.i === 0;
      }
      last() {
        return this.i === this.length - 1;
      }
      rindex() {
        return this.length - this.i;
      }
      rindex0() {
        return this.length - this.i - 1;
      }
      valueOf() {
        return JSON.stringify(this);
      }
    };
    var SimpleEmitter = class {
      constructor() {
        this.buffer = "";
      }
      write(html) {
        this.buffer += stringify(html);
      }
    };
    var StreamedEmitter = class {
      constructor() {
        this.buffer = "";
        this.stream = new stream.PassThrough();
      }
      write(html) {
        this.stream.write(stringify(html));
      }
      error(err) {
        this.stream.emit("error", err);
      }
      end() {
        this.stream.end();
      }
    };
    var KeepingTypeEmitter = class {
      constructor() {
        this.buffer = "";
      }
      write(html) {
        html = toValue(html);
        if (typeof html !== "string" && this.buffer === "") {
          this.buffer = html;
        } else {
          this.buffer = stringify(this.buffer) + stringify(html);
        }
      }
    };
    var BlockDrop = class extends Drop {
      constructor(superBlockRender = () => "") {
        super();
        this.superBlockRender = superBlockRender;
      }
      /**
       * Provide parent access in child block by
       * {{ block.super }}
       */
      *super() {
        const emitter = new SimpleEmitter();
        yield this.superBlockRender(emitter);
        return emitter.buffer;
      }
    };
    function isComparable(arg) {
      return arg && isFunction(arg.equals) && isFunction(arg.gt) && isFunction(arg.geq) && isFunction(arg.lt) && isFunction(arg.leq);
    }
    var nil = new NullDrop();
    var literalValues = {
      "true": true,
      "false": false,
      "nil": nil,
      "null": nil,
      "empty": new EmptyDrop(),
      "blank": new BlankDrop()
    };
    function createTrie(input) {
      const trie = {};
      for (const [name, data2] of Object.entries(input)) {
        let node = trie;
        for (let i = 0; i < name.length; i++) {
          const c = name[i];
          node[c] = node[c] || {};
          if (i === name.length - 1 && isWord(name[i])) {
            node[c].needBoundary = true;
          }
          node = node[c];
        }
        node.data = data2;
        node.end = true;
      }
      return trie;
    }
    async function toPromise(val) {
      if (!isIterator(val))
        return val;
      let value;
      let done = false;
      let next = "next";
      do {
        const state = val[next](value);
        done = state.done;
        value = state.value;
        next = "next";
        try {
          if (isIterator(value))
            value = toPromise(value);
          if (isPromise(value))
            value = await value;
        } catch (err) {
          next = "throw";
          value = err;
        }
      } while (!done);
      return value;
    }
    function toValueSync(val) {
      if (!isIterator(val))
        return val;
      let value;
      let done = false;
      let next = "next";
      do {
        const state = val[next](value);
        done = state.done;
        value = state.value;
        next = "next";
        if (isIterator(value)) {
          try {
            value = toValueSync(value);
          } catch (err) {
            next = "throw";
            value = err;
          }
        }
      } while (!done);
      return value;
    }
    var rFormat = /%([-_0^#:]+)?(\d+)?([EO])?(.)/;
    function daysInMonth(d) {
      const feb = isLeapYear(d) ? 29 : 28;
      return [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    }
    function getDayOfYear(d) {
      let num = 0;
      for (let i = 0; i < d.getMonth(); ++i) {
        num += daysInMonth(d)[i];
      }
      return num + d.getDate();
    }
    function getWeekOfYear(d, startDay) {
      const now = getDayOfYear(d) + (startDay - d.getDay());
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const then = 7 - jan1.getDay() + startDay;
      return String(Math.floor((now - then) / 7) + 1);
    }
    function isLeapYear(d) {
      const year = d.getFullYear();
      return !!((year & 3) === 0 && (year % 100 || year % 400 === 0 && year));
    }
    function ordinal(d) {
      const date2 = d.getDate();
      if ([11, 12, 13].includes(date2))
        return "th";
      switch (date2 % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    }
    function century(d) {
      return parseInt(d.getFullYear().toString().substring(0, 2), 10);
    }
    var padWidths = {
      d: 2,
      e: 2,
      H: 2,
      I: 2,
      j: 3,
      k: 2,
      l: 2,
      L: 3,
      m: 2,
      M: 2,
      S: 2,
      U: 2,
      W: 2
    };
    var padSpaceChars = new Set("aAbBceklpP");
    function getTimezoneOffset(d, opts) {
      const nOffset = Math.abs(d.getTimezoneOffset());
      const h = Math.floor(nOffset / 60);
      const m = nOffset % 60;
      return (d.getTimezoneOffset() > 0 ? "-" : "+") + padStart(h, 2, "0") + (opts.flags[":"] ? ":" : "") + padStart(m, 2, "0");
    }
    var formatCodes = {
      a: (d) => d.getShortWeekdayName(),
      A: (d) => d.getLongWeekdayName(),
      b: (d) => d.getShortMonthName(),
      B: (d) => d.getLongMonthName(),
      c: (d) => d.toLocaleString(),
      C: (d) => century(d),
      d: (d) => d.getDate(),
      e: (d) => d.getDate(),
      H: (d) => d.getHours(),
      I: (d) => String(d.getHours() % 12 || 12),
      j: (d) => getDayOfYear(d),
      k: (d) => d.getHours(),
      l: (d) => String(d.getHours() % 12 || 12),
      L: (d) => d.getMilliseconds(),
      m: (d) => d.getMonth() + 1,
      M: (d) => d.getMinutes(),
      N: (d, opts) => {
        const width = Number(opts.width) || 9;
        const str = String(d.getMilliseconds()).slice(0, width);
        return padEnd(str, width, "0");
      },
      p: (d) => d.getHours() < 12 ? "AM" : "PM",
      P: (d) => d.getHours() < 12 ? "am" : "pm",
      q: (d) => ordinal(d),
      s: (d) => Math.round(d.getTime() / 1e3),
      S: (d) => d.getSeconds(),
      u: (d) => d.getDay() || 7,
      U: (d) => getWeekOfYear(d, 0),
      w: (d) => d.getDay(),
      W: (d) => getWeekOfYear(d, 1),
      x: (d) => d.toLocaleDateString(),
      X: (d) => d.toLocaleTimeString(),
      y: (d) => d.getFullYear().toString().slice(2, 4),
      Y: (d) => d.getFullYear(),
      z: getTimezoneOffset,
      Z: (d, opts) => d.getTimeZoneName() || getTimezoneOffset(d, opts),
      "t": () => "	",
      "n": () => "\n",
      "%": () => "%"
    };
    formatCodes.h = formatCodes.b;
    function strftime(d, formatStr) {
      let output = "";
      let remaining = formatStr;
      let match;
      while (match = rFormat.exec(remaining)) {
        output += remaining.slice(0, match.index);
        remaining = remaining.slice(match.index + match[0].length);
        output += format(d, match);
      }
      return output + remaining;
    }
    function format(d, match) {
      const [input, flagStr = "", width, modifier, conversion] = match;
      const convert = formatCodes[conversion];
      if (!convert)
        return input;
      const flags = {};
      for (const flag of flagStr)
        flags[flag] = true;
      let ret = String(convert(d, { flags, width, modifier }));
      let padChar = padSpaceChars.has(conversion) ? " " : "0";
      let padWidth = width || padWidths[conversion] || 0;
      if (flags["^"])
        ret = ret.toUpperCase();
      else if (flags["#"])
        ret = changeCase(ret);
      if (flags["_"])
        padChar = " ";
      else if (flags["0"])
        padChar = "0";
      if (flags["-"])
        padWidth = 0;
      return padStart(ret, padWidth, padChar);
    }
    function getDateTimeFormat() {
      return typeof Intl !== "undefined" ? Intl.DateTimeFormat : void 0;
    }
    var OneMinute = 6e4;
    var TIMEZONE_PATTERN = /([zZ]|([+-])(\d{2}):?(\d{2}))$/;
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    var monthNamesShort = monthNames.map((name) => name.slice(0, 3));
    var dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    var dayNamesShort = dayNames.map((name) => name.slice(0, 3));
    var LiquidDate = class _LiquidDate {
      constructor(init, locale, timezone) {
        this.locale = locale;
        this.DateTimeFormat = getDateTimeFormat();
        this.date = new Date(init);
        this.timezoneFixed = timezone !== void 0;
        if (timezone === void 0) {
          timezone = this.date.getTimezoneOffset();
        }
        this.timezoneOffset = isString(timezone) ? _LiquidDate.getTimezoneOffset(timezone, this.date) : timezone;
        this.timezoneName = isString(timezone) ? timezone : "";
        const diff = (this.date.getTimezoneOffset() - this.timezoneOffset) * OneMinute;
        const time = this.date.getTime() + diff;
        this.displayDate = new Date(time);
      }
      getTime() {
        return this.displayDate.getTime();
      }
      getMilliseconds() {
        return this.displayDate.getMilliseconds();
      }
      getSeconds() {
        return this.displayDate.getSeconds();
      }
      getMinutes() {
        return this.displayDate.getMinutes();
      }
      getHours() {
        return this.displayDate.getHours();
      }
      getDay() {
        return this.displayDate.getDay();
      }
      getDate() {
        return this.displayDate.getDate();
      }
      getMonth() {
        return this.displayDate.getMonth();
      }
      getFullYear() {
        return this.displayDate.getFullYear();
      }
      toLocaleString(locale, init) {
        if (init?.timeZone) {
          return this.date.toLocaleString(locale, init);
        }
        return this.displayDate.toLocaleString(locale, init);
      }
      toLocaleTimeString(locale) {
        return this.displayDate.toLocaleTimeString(locale);
      }
      toLocaleDateString(locale) {
        return this.displayDate.toLocaleDateString(locale);
      }
      getTimezoneOffset() {
        return this.timezoneOffset;
      }
      getTimeZoneName() {
        if (this.timezoneFixed)
          return this.timezoneName;
        if (!this.DateTimeFormat)
          return;
        return this.DateTimeFormat().resolvedOptions().timeZone;
      }
      getLongMonthName() {
        return this.format({ month: "long" }) ?? monthNames[this.getMonth()];
      }
      getShortMonthName() {
        return this.format({ month: "short" }) ?? monthNamesShort[this.getMonth()];
      }
      getLongWeekdayName() {
        return this.format({ weekday: "long" }) ?? dayNames[this.displayDate.getDay()];
      }
      getShortWeekdayName() {
        return this.format({ weekday: "short" }) ?? dayNamesShort[this.displayDate.getDay()];
      }
      valid() {
        return !isNaN(this.getTime());
      }
      format(options) {
        return this.DateTimeFormat && this.DateTimeFormat(this.locale, options).format(this.displayDate);
      }
      /**
       * Create a Date object fixed to it's declared Timezone. Both
       * - 2021-08-06T02:29:00.000Z and
       * - 2021-08-06T02:29:00.000+08:00
       * will always be displayed as
       * - 2021-08-06 02:29:00
       * regardless timezoneOffset in JavaScript realm
       *
       * The implementation hack:
       * Instead of calling `.getMonth()`/`.getUTCMonth()` respect to `preserveTimezones`,
       * we create a different Date to trick strftime, it's both simpler and more performant.
       * Given that a template is expected to be parsed fewer times than rendered.
       */
      static createDateFixedToTimezone(dateString, locale) {
        const m = dateString.match(TIMEZONE_PATTERN);
        if (m && m[1] === "Z") {
          return new _LiquidDate(+new Date(dateString), locale, 0);
        }
        if (m && m[2] && m[3] && m[4]) {
          const [, , sign, hours, minutes] = m;
          const offset2 = (sign === "+" ? -1 : 1) * (parseInt(hours, 10) * 60 + parseInt(minutes, 10));
          return new _LiquidDate(+new Date(dateString), locale, offset2);
        }
        return new _LiquidDate(dateString, locale);
      }
      static getTimezoneOffset(timezoneName, date2) {
        const localDateString = date2.toLocaleString("en-US", { timeZone: timezoneName });
        const utcDateString = date2.toLocaleString("en-US", { timeZone: "UTC" });
        const localDate = new Date(localDateString);
        const utcDate = new Date(utcDateString);
        return (+utcDate - +localDate) / (60 * 1e3);
      }
    };
    var Limiter = class {
      constructor(resource, limit2) {
        this.base = 0;
        this.message = `${resource} limit exceeded`;
        this.limit = limit2;
      }
      use(count) {
        count = toNumber(count);
        assert(this.base + count <= this.limit, this.message);
        this.base += count;
      }
      check(count) {
        count = toNumber(count);
        assert(count <= this.limit, this.message);
      }
    };
    var DelimitedToken = class extends Token {
      constructor(kind, [contentBegin, contentEnd], input, begin, end, trimLeft2, trimRight2, file) {
        super(kind, input, begin, end, file);
        this.trimLeft = false;
        this.trimRight = false;
        const tl = input[contentBegin] === "-";
        const tr = input[contentEnd - 1] === "-";
        let l = tl ? contentBegin + 1 : contentBegin;
        let r = tr ? contentEnd - 1 : contentEnd;
        while (l < r && TYPES[input.charCodeAt(l)] & BLANK)
          l++;
        while (r > l && TYPES[input.charCodeAt(r - 1)] & BLANK)
          r--;
        this.contentRange = [l, r];
        this.trimLeft = tl || trimLeft2;
        this.trimRight = tr || trimRight2;
      }
      get content() {
        return this.input.slice(this.contentRange[0], this.contentRange[1]);
      }
    };
    var TagToken = class extends DelimitedToken {
      constructor(input, begin, end, options, file) {
        const { trimTagLeft, trimTagRight, tagDelimiterLeft, tagDelimiterRight } = options;
        const [valueBegin, valueEnd] = [begin + tagDelimiterLeft.length, end - tagDelimiterRight.length];
        super(exports.TokenKind.Tag, [valueBegin, valueEnd], input, begin, end, trimTagLeft, trimTagRight, file);
        this.tokenizer = new Tokenizer(input, options.operators, file, this.contentRange);
        this.name = this.tokenizer.readTagName();
        this.tokenizer.assert(this.name, `illegal tag syntax, tag name expected`);
        this.tokenizer.skipBlank();
        this.args = this.tokenizer.input.slice(this.tokenizer.p, this.contentRange[1]);
      }
    };
    var OutputToken = class extends DelimitedToken {
      constructor(input, begin, end, options, file) {
        const { trimOutputLeft, trimOutputRight, outputDelimiterLeft, outputDelimiterRight } = options;
        const valueRange = [begin + outputDelimiterLeft.length, end - outputDelimiterRight.length];
        super(exports.TokenKind.Output, valueRange, input, begin, end, trimOutputLeft, trimOutputRight, file);
      }
    };
    var HTMLToken = class extends Token {
      constructor(input, begin, end, file) {
        super(exports.TokenKind.HTML, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.trimLeft = 0;
        this.trimRight = 0;
      }
      getContent() {
        return this.input.slice(this.begin + this.trimLeft, this.end - this.trimRight);
      }
    };
    var NumberToken = class extends Token {
      constructor(input, begin, end, file) {
        super(exports.TokenKind.Number, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.content = Number(this.getText());
      }
    };
    var IdentifierToken = class extends Token {
      constructor(input, begin, end, file) {
        super(exports.TokenKind.Word, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.content = this.getText();
      }
    };
    var LiteralToken = class extends Token {
      constructor(input, begin, end, file) {
        super(exports.TokenKind.Literal, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.literal = this.getText();
        this.content = literalValues[this.literal];
      }
    };
    var operatorPrecedences = {
      "==": 2,
      "!=": 2,
      ">": 2,
      "<": 2,
      ">=": 2,
      "<=": 2,
      "contains": 2,
      "not": 1,
      "and": 0,
      "or": 0
    };
    var operatorTypes = {
      "==": 0,
      "!=": 0,
      ">": 0,
      "<": 0,
      ">=": 0,
      "<=": 0,
      "contains": 0,
      "not": 1,
      "and": 0,
      "or": 0
      /* OperatorType.Binary */
    };
    var OperatorToken = class extends Token {
      constructor(input, begin, end, file) {
        super(exports.TokenKind.Operator, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.operator = this.getText();
      }
      getPrecedence() {
        const key = this.getText();
        return key in operatorPrecedences ? operatorPrecedences[key] : 1;
      }
    };
    var PropertyAccessToken = class extends Token {
      constructor(variable, props, input, begin, end, file) {
        super(exports.TokenKind.PropertyAccess, input, begin, end, file);
        this.variable = variable;
        this.props = props;
      }
    };
    var FilterToken = class extends Token {
      constructor(name, args, input, begin, end, file) {
        super(exports.TokenKind.Filter, input, begin, end, file);
        this.name = name;
        this.args = args;
      }
    };
    var HashToken = class extends Token {
      constructor(input, begin, end, name, value, file) {
        super(exports.TokenKind.Hash, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.name = name;
        this.value = value;
        this.file = file;
      }
    };
    var rHex = /[\da-fA-F]/;
    var rOct = /[0-7]/;
    var escapeChar = {
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "	",
      v: "\v"
    };
    function hexVal(c) {
      const code = c.charCodeAt(0);
      if (code >= 97)
        return code - 87;
      if (code >= 65)
        return code - 55;
      return code - 48;
    }
    function parseStringLiteral(str) {
      let ret = "";
      for (let i = 1; i < str.length - 1; i++) {
        if (str[i] !== "\\") {
          ret += str[i];
          continue;
        }
        if (escapeChar[str[i + 1]] !== void 0) {
          ret += escapeChar[str[++i]];
        } else if (str[i + 1] === "u") {
          let val = 0;
          let j = i + 2;
          while (j <= i + 5 && rHex.test(str[j])) {
            val = val * 16 + hexVal(str[j++]);
          }
          i = j - 1;
          ret += String.fromCharCode(val);
        } else if (!rOct.test(str[i + 1])) {
          ret += str[++i];
        } else {
          let j = i + 1;
          let val = 0;
          while (j <= i + 3 && rOct.test(str[j])) {
            val = val * 8 + hexVal(str[j++]);
          }
          i = j - 1;
          ret += String.fromCharCode(val);
        }
      }
      return ret;
    }
    var QuotedToken = class extends Token {
      constructor(input, begin, end, file) {
        super(exports.TokenKind.Quoted, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.content = parseStringLiteral(this.getText());
      }
    };
    var RangeToken = class extends Token {
      constructor(input, begin, end, lhs, rhs, file) {
        super(exports.TokenKind.Range, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.lhs = lhs;
        this.rhs = rhs;
        this.file = file;
      }
    };
    var LiquidTagToken = class extends DelimitedToken {
      constructor(input, begin, end, options, file) {
        super(exports.TokenKind.Tag, [begin, end], input, begin, end, false, false, file);
        this.tokenizer = new Tokenizer(input, options.operators, file, this.contentRange);
        this.name = this.tokenizer.readTagName();
        this.tokenizer.assert(this.name, "illegal liquid tag syntax");
        this.tokenizer.skipBlank();
      }
      get args() {
        return this.tokenizer.input.slice(this.tokenizer.p, this.contentRange[1]);
      }
    };
    var FilteredValueToken = class extends Token {
      constructor(initial, filters2, input, begin, end, file) {
        super(exports.TokenKind.FilteredValue, input, begin, end, file);
        this.initial = initial;
        this.filters = filters2;
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
      }
    };
    var polyfill = {
      now: () => Date.now()
    };
    function getPerformance() {
      return typeof global === "object" && global.performance || typeof window === "object" && window.performance || polyfill;
    }
    var Render = class {
      renderTemplatesToNodeStream(templates, ctx) {
        const emitter = new StreamedEmitter();
        Promise.resolve().then(() => toPromise(this.renderTemplates(templates, ctx, emitter))).then(() => emitter.end(), (err) => emitter.error(err));
        return emitter.stream;
      }
      *renderTemplates(templates, ctx, emitter) {
        if (!emitter) {
          emitter = ctx.opts.keepOutputType ? new KeepingTypeEmitter() : new SimpleEmitter();
        }
        const errors = [];
        for (const tpl of templates) {
          ctx.renderLimit.check(getPerformance().now());
          try {
            const html = yield tpl.render(ctx, emitter);
            html && emitter.write(html);
            if (ctx.breakCalled || ctx.continueCalled)
              break;
          } catch (e) {
            const err = LiquidError.is(e) ? e : new RenderError(e, tpl);
            if (ctx.opts.catchAllErrors)
              errors.push(err);
            else
              throw err;
          }
        }
        if (errors.length) {
          throw new LiquidErrors(errors);
        }
        return emitter.buffer;
      }
    };
    var Expression = class {
      constructor(tokens) {
        this.postfix = [...toPostfix(tokens)];
      }
      *evaluate(ctx, lenient) {
        assert(ctx, "unable to evaluate: context not defined");
        const operands = [];
        for (const token of this.postfix) {
          if (isOperatorToken(token)) {
            const r = operands.pop();
            let result;
            if (operatorTypes[token.operator] === 1) {
              result = yield ctx.opts.operators[token.operator](r, ctx);
            } else {
              const l = operands.pop();
              result = yield ctx.opts.operators[token.operator](l, r, ctx);
            }
            operands.push(result);
          } else {
            operands.push(yield evalToken(token, ctx, lenient));
          }
        }
        return operands[0];
      }
      valid() {
        return !!this.postfix.length;
      }
    };
    function* evalToken(token, ctx, lenient = false) {
      if (!token)
        return;
      if ("content" in token)
        return token.content;
      if (isPropertyAccessToken(token))
        return yield evalPropertyAccessToken(token, ctx, lenient);
      if (isRangeToken(token))
        return yield evalRangeToken(token, ctx);
    }
    function* evalPropertyAccessToken(token, ctx, lenient) {
      const props = [];
      for (const prop of token.props) {
        props.push(yield evalToken(prop, ctx, false));
      }
      try {
        if (token.variable) {
          const variable = yield evalToken(token.variable, ctx, lenient);
          return yield ctx._getFromScope(variable, props);
        } else {
          return yield ctx._get(props);
        }
      } catch (e) {
        if (lenient && e.name === "InternalUndefinedVariableError")
          return null;
        throw new UndefinedVariableError(e, token);
      }
    }
    function evalQuotedToken(token) {
      return token.content;
    }
    function* evalRangeToken(token, ctx) {
      const low = yield evalToken(token.lhs, ctx);
      const high = yield evalToken(token.rhs, ctx);
      ctx.memoryLimit.use(high - low + 1);
      return range(+low, +high + 1);
    }
    function* toPostfix(tokens) {
      const ops = [];
      for (const token of tokens) {
        if (isOperatorToken(token)) {
          while (ops.length && ops[ops.length - 1].getPrecedence() > token.getPrecedence()) {
            yield ops.pop();
          }
          ops.push(token);
        } else
          yield token;
      }
      while (ops.length) {
        yield ops.pop();
      }
    }
    function isTruthy(val, ctx) {
      return !isFalsy(val, ctx);
    }
    function isFalsy(val, ctx) {
      val = toValue(val);
      if (ctx.opts.jsTruthy) {
        return !val;
      } else {
        return val === false || void 0 === val || val === null;
      }
    }
    var defaultOperators = {
      "==": equals,
      "!=": (l, r) => !equals(l, r),
      ">": (l, r) => {
        if (isComparable(l))
          return l.gt(r);
        if (isComparable(r))
          return r.lt(l);
        return toValue(l) > toValue(r);
      },
      "<": (l, r) => {
        if (isComparable(l))
          return l.lt(r);
        if (isComparable(r))
          return r.gt(l);
        return toValue(l) < toValue(r);
      },
      ">=": (l, r) => {
        if (isComparable(l))
          return l.geq(r);
        if (isComparable(r))
          return r.leq(l);
        return toValue(l) >= toValue(r);
      },
      "<=": (l, r) => {
        if (isComparable(l))
          return l.leq(r);
        if (isComparable(r))
          return r.geq(l);
        return toValue(l) <= toValue(r);
      },
      "contains": (l, r) => {
        l = toValue(l);
        if (isArray(l))
          return l.some((i) => equals(i, r));
        if (isFunction(l?.indexOf))
          return l.indexOf(toValue(r)) > -1;
        return false;
      },
      "not": (v, ctx) => isFalsy(toValue(v), ctx),
      "and": (l, r, ctx) => isTruthy(toValue(l), ctx) && isTruthy(toValue(r), ctx),
      "or": (l, r, ctx) => isTruthy(toValue(l), ctx) || isTruthy(toValue(r), ctx)
    };
    function equals(lhs, rhs) {
      if (isComparable(lhs))
        return lhs.equals(rhs);
      if (isComparable(rhs))
        return rhs.equals(lhs);
      lhs = toValue(lhs);
      rhs = toValue(rhs);
      if (isArray(lhs)) {
        return isArray(rhs) && arrayEquals(lhs, rhs);
      }
      return lhs === rhs;
    }
    function arrayEquals(lhs, rhs) {
      if (lhs.length !== rhs.length)
        return false;
      return !lhs.some((value, i) => !equals(value, rhs[i]));
    }
    function arrayIncludes(arr, item) {
      return arr.some((value) => equals(value, item));
    }
    var Node = class {
      constructor(key, value, next, prev) {
        this.key = key;
        this.value = value;
        this.next = next;
        this.prev = prev;
      }
    };
    var LRU = class {
      constructor(limit2, size2 = 0) {
        this.limit = limit2;
        this.size = size2;
        this.cache = {};
        this.head = new Node("HEAD", null, null, null);
        this.tail = new Node("TAIL", null, null, null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
      }
      write(key, value) {
        if (this.cache[key]) {
          this.cache[key].value = value;
        } else {
          const node = new Node(key, value, this.head.next, this.head);
          this.head.next.prev = node;
          this.head.next = node;
          this.cache[key] = node;
          this.size++;
          this.ensureLimit();
        }
      }
      read(key) {
        if (!this.cache[key])
          return;
        const { value } = this.cache[key];
        this.remove(key);
        this.write(key, value);
        return value;
      }
      remove(key) {
        const node = this.cache[key];
        node.prev.next = node.next;
        node.next.prev = node.prev;
        delete this.cache[key];
        this.size--;
      }
      clear() {
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.size = 0;
        this.cache = {};
      }
      ensureLimit() {
        if (this.size > this.limit)
          this.remove(this.tail.prev.key);
      }
    };
    var requireResolve = (partial) => __require.resolve(partial, { paths: ["."] });
    var statAsync = promisify(fs$1.stat);
    var readFileAsync = promisify(fs$1.readFile);
    async function exists(filepath) {
      try {
        await statAsync(filepath);
        return true;
      } catch (err) {
        return false;
      }
    }
    function readFile(filepath) {
      return readFileAsync(filepath, "utf8");
    }
    function existsSync(filepath) {
      try {
        fs$1.statSync(filepath);
        return true;
      } catch (err) {
        return false;
      }
    }
    function readFileSync(filepath) {
      return fs$1.readFileSync(filepath, "utf8");
    }
    function resolve(root, file, ext) {
      if (!path.extname(file))
        file += ext;
      return path.resolve(root, file);
    }
    function fallback(file) {
      try {
        return requireResolve(file);
      } catch (e) {
      }
    }
    function dirname(filepath) {
      return path.dirname(filepath);
    }
    function contains(root, file) {
      root = path.resolve(root);
      root = root.endsWith(path.sep) ? root : root + path.sep;
      return file.startsWith(root);
    }
    var fs = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      exists,
      readFile,
      existsSync,
      readFileSync,
      resolve,
      fallback,
      dirname,
      contains,
      sep: path.sep
    });
    function defaultFilter(value, defaultValue, ...args) {
      value = toValue(value);
      if (isArray(value) || isString(value))
        return value.length ? value : defaultValue;
      if (value === false && new Map(args).get("allow_false"))
        return false;
      return isFalsy(value, this.context) ? defaultValue : value;
    }
    function json(value, space = 0) {
      return JSON.stringify(value, null, space);
    }
    function inspect(value, space = 0) {
      const ancestors = [];
      return JSON.stringify(value, function(_key, value2) {
        if (typeof value2 !== "object" || value2 === null)
          return value2;
        while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this)
          ancestors.pop();
        if (ancestors.includes(value2))
          return "[Circular]";
        ancestors.push(value2);
        return value2;
      }, space);
    }
    function to_integer(value) {
      return Number(value);
    }
    var raw = {
      raw: true,
      handler: identify
    };
    var misc = {
      default: defaultFilter,
      raw,
      jsonify: json,
      to_integer,
      json,
      inspect
    };
    var escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&#34;",
      "'": "&#39;"
    };
    var unescapeMap = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&#34;": '"',
      "&#39;": "'"
    };
    function escape(str) {
      str = stringify(str);
      this.context.memoryLimit.use(str.length);
      return str.replace(/&|<|>|"|'/g, (m) => escapeMap[m]);
    }
    function xml_escape(str) {
      return escape.call(this, str);
    }
    function unescape(str) {
      str = stringify(str);
      this.context.memoryLimit.use(str.length);
      return str.replace(/&(amp|lt|gt|#34|#39);/g, (m) => unescapeMap[m]);
    }
    function escape_once(str) {
      return escape.call(this, unescape.call(this, str));
    }
    function newline_to_br(v) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.replace(/\r?\n/gm, "<br />\n");
    }
    function strip_html(v) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<.*?>|<!--[\s\S]*?-->/g, "");
    }
    var htmlFilters = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      escape,
      xml_escape,
      escape_once,
      newline_to_br,
      strip_html
    });
    var MapFS = class {
      constructor(mapping) {
        this.mapping = mapping;
        this.sep = "/";
      }
      async exists(filepath) {
        return this.existsSync(filepath);
      }
      existsSync(filepath) {
        return !isNil(this.mapping[filepath]);
      }
      async readFile(filepath) {
        return this.readFileSync(filepath);
      }
      readFileSync(filepath) {
        const content = this.mapping[filepath];
        if (isNil(content))
          throw new Error(`ENOENT: ${filepath}`);
        return content;
      }
      dirname(filepath) {
        const segments = filepath.split(this.sep);
        segments.pop();
        return segments.join(this.sep);
      }
      resolve(dir, file, ext) {
        file += ext;
        if (dir === ".")
          return file;
        const segments = dir.split(/\/+/);
        for (const segment of file.split(this.sep)) {
          if (segment === "." || segment === "")
            continue;
          else if (segment === "..") {
            if (segments.length > 1 || segments[0] !== "")
              segments.pop();
          } else
            segments.push(segment);
        }
        return segments.join(this.sep);
      }
    };
    var defaultOptions = {
      root: ["."],
      layouts: ["."],
      partials: ["."],
      relativeReference: true,
      jekyllInclude: false,
      keyValueSeparator: ":",
      cache: void 0,
      extname: "",
      fs,
      dynamicPartials: true,
      jsTruthy: false,
      dateFormat: "%A, %B %-e, %Y at %-l:%M %P %z",
      locale: "",
      trimTagRight: false,
      trimTagLeft: false,
      trimOutputRight: false,
      trimOutputLeft: false,
      greedy: true,
      tagDelimiterLeft: "{%",
      tagDelimiterRight: "%}",
      outputDelimiterLeft: "{{",
      outputDelimiterRight: "}}",
      preserveTimezones: false,
      strictFilters: false,
      strictVariables: false,
      ownPropertyOnly: true,
      lenientIf: false,
      globals: {},
      keepOutputType: false,
      operators: defaultOperators,
      memoryLimit: Infinity,
      parseLimit: Infinity,
      renderLimit: Infinity
    };
    function normalize(options) {
      if (options.hasOwnProperty("root")) {
        if (!options.hasOwnProperty("partials"))
          options.partials = options.root;
        if (!options.hasOwnProperty("layouts"))
          options.layouts = options.root;
      }
      if (options.hasOwnProperty("cache")) {
        let cache;
        if (typeof options.cache === "number")
          cache = options.cache > 0 ? new LRU(options.cache) : void 0;
        else if (typeof options.cache === "object")
          cache = options.cache;
        else
          cache = options.cache ? new LRU(1024) : void 0;
        options.cache = cache;
      }
      options = { ...defaultOptions, ...options.jekyllInclude ? { dynamicPartials: false } : {}, ...options };
      if ((!options.fs.dirname || !options.fs.sep) && options.relativeReference) {
        console.warn("[LiquidJS] `fs.dirname` and `fs.sep` are required for relativeReference, set relativeReference to `false` to suppress this warning");
        options.relativeReference = false;
      }
      options.root = normalizeDirectoryList(options.root);
      options.partials = normalizeDirectoryList(options.partials);
      options.layouts = normalizeDirectoryList(options.layouts);
      options.outputEscape = options.outputEscape && getOutputEscapeFunction(options.outputEscape);
      if (!options.locale) {
        options.locale = getDateTimeFormat()?.().resolvedOptions().locale ?? "en-US";
      }
      if (options.templates) {
        options.fs = new MapFS(options.templates);
        options.relativeReference = true;
        options.root = options.partials = options.layouts = ".";
      }
      return options;
    }
    function getOutputEscapeFunction(nameOrFunction) {
      if (nameOrFunction === "escape")
        return escape;
      if (nameOrFunction === "json")
        return misc.json;
      assert(isFunction(nameOrFunction), "`outputEscape` need to be of type string or function");
      return nameOrFunction;
    }
    function normalizeDirectoryList(value) {
      let list = [];
      if (isArray(value))
        list = value;
      if (isString(value))
        list = [value];
      return list;
    }
    function whiteSpaceCtrl(tokens, options) {
      let inRaw = false;
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!isDelimitedToken(token))
          continue;
        if (!inRaw && token.trimLeft) {
          trimLeft(tokens[i - 1], options.greedy);
        }
        if (isTagToken(token)) {
          if (token.name === "raw")
            inRaw = true;
          else if (token.name === "endraw")
            inRaw = false;
        }
        if (!inRaw && token.trimRight) {
          trimRight(tokens[i + 1], options.greedy);
        }
      }
    }
    function trimLeft(token, greedy) {
      if (!token || !isHTMLToken(token))
        return;
      const mask = greedy ? BLANK : INLINE_BLANK;
      while (TYPES[token.input.charCodeAt(token.end - 1 - token.trimRight)] & mask)
        token.trimRight++;
    }
    function trimRight(token, greedy) {
      if (!token || !isHTMLToken(token))
        return;
      const mask = greedy ? BLANK : INLINE_BLANK;
      while (TYPES[token.input.charCodeAt(token.begin + token.trimLeft)] & mask)
        token.trimLeft++;
      if (token.input.charAt(token.begin + token.trimLeft) === "\n")
        token.trimLeft++;
    }
    var Tokenizer = class {
      constructor(input, operators = defaultOptions.operators, file, range2) {
        this.input = input;
        this.file = file;
        this.rawBeginAt = -1;
        this.p = range2 ? range2[0] : 0;
        this.N = range2 ? range2[1] : input.length;
        this.opTrie = createTrie(operators);
        this.literalTrie = createTrie(literalValues);
      }
      readExpression() {
        return new Expression(this.readExpressionTokens());
      }
      *readExpressionTokens() {
        while (this.p < this.N) {
          const operator = this.readOperator();
          if (operator) {
            yield operator;
            continue;
          }
          const operand = this.readValue();
          if (operand) {
            yield operand;
            continue;
          }
          return;
        }
      }
      readOperator() {
        this.skipBlank();
        const end = this.matchTrie(this.opTrie);
        if (end === -1)
          return;
        return new OperatorToken(this.input, this.p, this.p = end, this.file);
      }
      matchTrie(trie) {
        let node = trie;
        let i = this.p;
        let info;
        while (node[this.input[i]] && i < this.N) {
          node = node[this.input[i++]];
          if (node["end"])
            info = node;
        }
        if (!info)
          return -1;
        if (info["needBoundary"] && isWord(this.peek(i - this.p)))
          return -1;
        return i;
      }
      readFilteredValue() {
        const begin = this.p;
        const initial = this.readExpression();
        this.assert(initial.valid(), `invalid value expression: ${this.snapshot()}`);
        const filters2 = this.readFilters();
        return new FilteredValueToken(initial, filters2, this.input, begin, this.p, this.file);
      }
      readFilters() {
        const filters2 = [];
        while (true) {
          const filter2 = this.readFilter();
          if (!filter2)
            return filters2;
          filters2.push(filter2);
        }
      }
      readFilter() {
        this.skipBlank();
        if (this.end())
          return null;
        this.assert(this.read() === "|", `expected "|" before filter`);
        const name = this.readIdentifier();
        if (!name.size()) {
          this.assert(this.end(), `expected filter name`);
          return null;
        }
        const args = [];
        this.skipBlank();
        if (this.peek() === ":") {
          do {
            ++this.p;
            const arg = this.readFilterArg();
            arg && args.push(arg);
            this.skipBlank();
            this.assert(this.end() || this.peek() === "," || this.peek() === "|", () => `unexpected character ${this.snapshot()}`);
          } while (this.peek() === ",");
        } else if (this.peek() === "|" || this.end()) ;
        else {
          throw this.error('expected ":" after filter name');
        }
        return new FilterToken(name.getText(), args, this.input, name.begin, this.p, this.file);
      }
      readFilterArg() {
        const key = this.readValue();
        if (!key)
          return;
        this.skipBlank();
        if (this.peek() !== ":")
          return key;
        ++this.p;
        const value = this.readValue();
        return [key.getText(), value];
      }
      readTopLevelTokens(options = defaultOptions) {
        const tokens = [];
        while (this.p < this.N) {
          const token = this.readTopLevelToken(options);
          tokens.push(token);
        }
        whiteSpaceCtrl(tokens, options);
        return tokens;
      }
      readTopLevelToken(options) {
        const { tagDelimiterLeft, outputDelimiterLeft } = options;
        if (this.rawBeginAt > -1)
          return this.readEndrawOrRawContent(options);
        if (this.match(tagDelimiterLeft))
          return this.readTagToken(options);
        if (this.match(outputDelimiterLeft))
          return this.readOutputToken(options);
        return this.readHTMLToken([tagDelimiterLeft, outputDelimiterLeft]);
      }
      readHTMLToken(stopStrings) {
        const begin = this.p;
        while (this.p < this.N) {
          if (stopStrings.some((str) => this.match(str)))
            break;
          ++this.p;
        }
        return new HTMLToken(this.input, begin, this.p, this.file);
      }
      readTagToken(options) {
        const { file, input } = this;
        const begin = this.p;
        if (this.readToDelimiter(options.tagDelimiterRight) === -1) {
          throw this.error(`tag ${this.snapshot(begin)} not closed`, begin);
        }
        const token = new TagToken(input, begin, this.p, options, file);
        if (token.name === "raw")
          this.rawBeginAt = begin;
        return token;
      }
      readToDelimiter(delimiter, respectQuoted = false) {
        this.skipBlank();
        while (this.p < this.N) {
          if (respectQuoted && this.peekType() & QUOTE) {
            this.readQuoted();
            continue;
          }
          ++this.p;
          if (this.rmatch(delimiter))
            return this.p;
        }
        return -1;
      }
      readOutputToken(options = defaultOptions) {
        const { file, input } = this;
        const { outputDelimiterRight } = options;
        const begin = this.p;
        if (this.readToDelimiter(outputDelimiterRight, true) === -1) {
          throw this.error(`output ${this.snapshot(begin)} not closed`, begin);
        }
        return new OutputToken(input, begin, this.p, options, file);
      }
      readEndrawOrRawContent(options) {
        const { tagDelimiterLeft, tagDelimiterRight } = options;
        const begin = this.p;
        let leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
        while (this.p < this.N) {
          if (this.readIdentifier().getText() !== "endraw") {
            leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
            continue;
          }
          while (this.p <= this.N) {
            if (this.rmatch(tagDelimiterRight)) {
              const end = this.p;
              if (begin === leftPos) {
                this.rawBeginAt = -1;
                return new TagToken(this.input, begin, end, options, this.file);
              } else {
                this.p = leftPos;
                return new HTMLToken(this.input, begin, leftPos, this.file);
              }
            }
            if (this.rmatch(tagDelimiterLeft))
              break;
            this.p++;
          }
        }
        throw this.error(`raw ${this.snapshot(this.rawBeginAt)} not closed`, begin);
      }
      readLiquidTagTokens(options = defaultOptions) {
        const tokens = [];
        while (this.p < this.N) {
          const token = this.readLiquidTagToken(options);
          token && tokens.push(token);
        }
        return tokens;
      }
      readLiquidTagToken(options) {
        this.skipBlank();
        if (this.end())
          return;
        const begin = this.p;
        this.readToDelimiter("\n");
        const end = this.p;
        return new LiquidTagToken(this.input, begin, end, options, this.file);
      }
      error(msg, pos = this.p) {
        return new TokenizationError(msg, new IdentifierToken(this.input, pos, this.N, this.file));
      }
      assert(pred, msg, pos) {
        if (!pred)
          throw this.error(typeof msg === "function" ? msg() : msg, pos);
      }
      snapshot(begin = this.p) {
        return JSON.stringify(ellipsis(this.input.slice(begin, this.N), 32));
      }
      /**
       * @deprecated use #readIdentifier instead
       */
      readWord() {
        return this.readIdentifier();
      }
      readIdentifier() {
        this.skipBlank();
        const begin = this.p;
        while (!this.end() && isWord(this.peek()))
          ++this.p;
        return new IdentifierToken(this.input, begin, this.p, this.file);
      }
      readNonEmptyIdentifier() {
        const id = this.readIdentifier();
        return id.size() ? id : void 0;
      }
      readTagName() {
        this.skipBlank();
        if (this.input[this.p] === "#")
          return this.input.slice(this.p, ++this.p);
        return this.readIdentifier().getText();
      }
      readHashes(jekyllStyle) {
        const hashes = [];
        while (true) {
          const hash = this.readHash(jekyllStyle);
          if (!hash)
            return hashes;
          hashes.push(hash);
        }
      }
      readHash(jekyllStyle) {
        this.skipBlank();
        if (this.peek() === ",")
          ++this.p;
        const begin = this.p;
        const name = this.readNonEmptyIdentifier();
        if (!name)
          return;
        let value;
        this.skipBlank();
        const sep = isString(jekyllStyle) ? jekyllStyle : jekyllStyle ? "=" : ":";
        if (this.peek() === sep) {
          ++this.p;
          value = this.readValue();
        }
        return new HashToken(this.input, begin, this.p, name, value, this.file);
      }
      remaining() {
        return this.input.slice(this.p, this.N);
      }
      advance(step = 1) {
        this.p += step;
      }
      end() {
        return this.p >= this.N;
      }
      read() {
        return this.input[this.p++];
      }
      readTo(end) {
        while (this.p < this.N) {
          ++this.p;
          if (this.rmatch(end))
            return this.p;
        }
        return -1;
      }
      readValue() {
        this.skipBlank();
        const begin = this.p;
        const variable = this.readLiteral() || this.readQuoted() || this.readRange() || this.readNumber();
        const props = this.readProperties(!variable);
        if (!props.length)
          return variable;
        return new PropertyAccessToken(variable, props, this.input, begin, this.p);
      }
      readScopeValue() {
        this.skipBlank();
        const begin = this.p;
        const props = this.readProperties();
        if (!props.length)
          return void 0;
        return new PropertyAccessToken(void 0, props, this.input, begin, this.p);
      }
      readProperties(isBegin = true) {
        const props = [];
        while (true) {
          if (this.peek() === "[") {
            this.p++;
            const prop = this.readValue() || new IdentifierToken(this.input, this.p, this.p, this.file);
            this.assert(this.readTo("]") !== -1, "[ not closed");
            props.push(prop);
            continue;
          }
          if (isBegin && !props.length) {
            const prop = this.readNonEmptyIdentifier();
            if (prop) {
              props.push(prop);
              continue;
            }
          }
          if (this.peek() === "." && this.peek(1) !== ".") {
            this.p++;
            const prop = this.readNonEmptyIdentifier();
            if (!prop)
              break;
            props.push(prop);
            continue;
          }
          break;
        }
        return props;
      }
      readNumber() {
        this.skipBlank();
        let decimalFound = false;
        let digitFound = false;
        let n = 0;
        if (this.peekType() & SIGN)
          n++;
        while (this.p + n <= this.N) {
          if (this.peekType(n) & NUMBER) {
            digitFound = true;
            n++;
          } else if (this.peek(n) === "." && this.peek(n + 1) !== ".") {
            if (decimalFound || !digitFound)
              return;
            decimalFound = true;
            n++;
          } else
            break;
        }
        if (digitFound && !isWord(this.peek(n))) {
          const num = new NumberToken(this.input, this.p, this.p + n, this.file);
          this.advance(n);
          return num;
        }
      }
      readLiteral() {
        this.skipBlank();
        const end = this.matchTrie(this.literalTrie);
        if (end === -1)
          return;
        const literal = new LiteralToken(this.input, this.p, end, this.file);
        this.p = end;
        return literal;
      }
      readRange() {
        this.skipBlank();
        const begin = this.p;
        if (this.peek() !== "(")
          return;
        ++this.p;
        const lhs = this.readValueOrThrow();
        this.skipBlank();
        this.assert(this.read() === "." && this.read() === ".", "invalid range syntax");
        const rhs = this.readValueOrThrow();
        this.skipBlank();
        this.assert(this.read() === ")", "invalid range syntax");
        return new RangeToken(this.input, begin, this.p, lhs, rhs, this.file);
      }
      readValueOrThrow() {
        const value = this.readValue();
        this.assert(value, () => `unexpected token ${this.snapshot()}, value expected`);
        return value;
      }
      readQuoted() {
        this.skipBlank();
        const begin = this.p;
        if (!(this.peekType() & QUOTE))
          return;
        ++this.p;
        let escaped = false;
        while (this.p < this.N) {
          ++this.p;
          if (this.input[this.p - 1] === this.input[begin] && !escaped)
            break;
          if (escaped)
            escaped = false;
          else if (this.input[this.p - 1] === "\\")
            escaped = true;
        }
        return new QuotedToken(this.input, begin, this.p, this.file);
      }
      *readFileNameTemplate(options) {
        const { outputDelimiterLeft } = options;
        const htmlStopStrings = [",", " ", outputDelimiterLeft];
        const htmlStopStringSet = new Set(htmlStopStrings);
        while (this.p < this.N && !htmlStopStringSet.has(this.peek())) {
          yield this.match(outputDelimiterLeft) ? this.readOutputToken(options) : this.readHTMLToken(htmlStopStrings);
        }
      }
      match(word) {
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== this.input[this.p + i])
            return false;
        }
        return true;
      }
      rmatch(pattern) {
        for (let i = 0; i < pattern.length; i++) {
          if (pattern[pattern.length - 1 - i] !== this.input[this.p - 1 - i])
            return false;
        }
        return true;
      }
      peekType(n = 0) {
        return this.p + n >= this.N ? 0 : TYPES[this.input.charCodeAt(this.p + n)];
      }
      peek(n = 0) {
        return this.p + n >= this.N ? "" : this.input[this.p + n];
      }
      skipBlank() {
        while (this.peekType() & BLANK)
          ++this.p;
      }
    };
    var ParseStream = class {
      constructor(tokens, parseToken) {
        this.handlers = {};
        this.stopRequested = false;
        this.tokens = tokens;
        this.parseToken = parseToken;
      }
      on(name, cb) {
        this.handlers[name] = cb;
        return this;
      }
      trigger(event, arg) {
        const h = this.handlers[event];
        return h ? (h.call(this, arg), true) : false;
      }
      start() {
        this.trigger("start");
        let token;
        while (!this.stopRequested && (token = this.tokens.shift())) {
          if (this.trigger("token", token))
            continue;
          if (isTagToken(token) && this.trigger(`tag:${token.name}`, token)) {
            continue;
          }
          const template2 = this.parseToken(token, this.tokens);
          this.trigger("template", template2);
        }
        if (!this.stopRequested)
          this.trigger("end");
        return this;
      }
      stop() {
        this.stopRequested = true;
        return this;
      }
    };
    var TemplateImpl = class {
      constructor(token) {
        this.token = token;
      }
    };
    var Tag = class extends TemplateImpl {
      constructor(token, remainTokens, liquid) {
        super(token);
        this.name = token.name;
        this.liquid = liquid;
        this.tokenizer = token.tokenizer;
      }
    };
    var Hash = class {
      constructor(input, jekyllStyle) {
        this.hash = {};
        const tokenizer = input instanceof Tokenizer ? input : new Tokenizer(input, {});
        for (const hash of tokenizer.readHashes(jekyllStyle)) {
          this.hash[hash.name.content] = hash.value;
        }
      }
      *render(ctx) {
        const hash = {};
        for (const key of Object.keys(this.hash)) {
          hash[key] = this.hash[key] === void 0 ? true : yield evalToken(this.hash[key], ctx);
        }
        return hash;
      }
    };
    function createTagClass(options) {
      return class extends Tag {
        constructor(token, tokens, liquid) {
          super(token, tokens, liquid);
          if (isFunction(options.parse)) {
            options.parse.call(this, token, tokens);
          }
        }
        *render(ctx, emitter) {
          const hash = yield new Hash(this.token.args, ctx.opts.keyValueSeparator).render(ctx);
          return yield options.render.call(this, ctx, emitter, hash);
        }
      };
    }
    function isKeyValuePair(arr) {
      return isArray(arr);
    }
    var Filter = class {
      constructor(token, options, liquid) {
        this.token = token;
        this.name = token.name;
        this.handler = isFunction(options) ? options : isFunction(options?.handler) ? options.handler : identify;
        this.raw = !isFunction(options) && !!options?.raw;
        this.args = token.args;
        this.liquid = liquid;
      }
      *render(value, context) {
        const argv = [];
        for (const arg of this.args) {
          if (isKeyValuePair(arg))
            argv.push([arg[0], yield evalToken(arg[1], context)]);
          else
            argv.push(yield evalToken(arg, context));
        }
        return yield this.handler.apply({ context, token: this.token, liquid: this.liquid }, [value, ...argv]);
      }
    };
    var Value = class {
      /**
       * @param str the value to be valuated, eg.: "foobar" | truncate: 3
       */
      constructor(input, liquid) {
        this.filters = [];
        const token = typeof input === "string" ? new Tokenizer(input, liquid.options.operators).readFilteredValue() : input;
        this.initial = token.initial;
        this.filters = token.filters.map((token2) => new Filter(token2, this.getFilter(liquid, token2.name), liquid));
      }
      *value(ctx, lenient) {
        lenient = lenient || ctx.opts.lenientIf && this.filters.length > 0 && this.filters[0].name === "default";
        let val = yield this.initial.evaluate(ctx, lenient);
        for (const filter2 of this.filters) {
          val = yield filter2.render(val, ctx);
        }
        return val;
      }
      getFilter(liquid, name) {
        const impl = liquid.filters[name];
        assert(impl || !liquid.options.strictFilters, () => `undefined filter: ${name}`);
        return impl;
      }
    };
    var Output = class extends TemplateImpl {
      constructor(token, liquid) {
        super(token);
        const tokenizer = new Tokenizer(token.input, liquid.options.operators, token.file, token.contentRange);
        this.value = new Value(tokenizer.readFilteredValue(), liquid);
        const filters2 = this.value.filters;
        const outputEscape = liquid.options.outputEscape;
        if (!filters2[filters2.length - 1]?.raw && outputEscape) {
          const token2 = new FilterToken(toString.call(outputEscape), [], "", 0, 0);
          filters2.push(new Filter(token2, outputEscape, liquid));
        }
      }
      *render(ctx, emitter) {
        const val = yield this.value.value(ctx, false);
        emitter.write(val);
      }
      *arguments() {
        yield this.value;
      }
    };
    var HTML = class extends TemplateImpl {
      constructor(token) {
        super(token);
        this.str = token.getContent();
      }
      *render(ctx, emitter) {
        emitter.write(this.str);
      }
    };
    var Variable = class _Variable {
      constructor(segments, location) {
        this.segments = segments;
        this.location = location;
      }
      toString() {
        return segmentsString(this.segments, true);
      }
      /** Return this variable's segments as an array, possibly with nested arrays for nested paths. */
      toArray() {
        function* _visit(...segments) {
          for (const segment of segments) {
            if (segment instanceof _Variable) {
              yield Array.from(_visit(...segment.segments));
            } else {
              yield segment;
            }
          }
        }
        return Array.from(_visit(...this.segments));
      }
    };
    var VariableMap = class {
      constructor() {
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const k = segmentsString([key.segments[0]]);
        if (!this.map.has(k)) {
          this.map.set(k, []);
        }
        return this.map.get(k);
      }
      has(key) {
        return this.map.has(segmentsString([key.segments[0]]));
      }
      push(variable) {
        this.get(variable).push(variable);
      }
      asObject() {
        return Object.fromEntries(this.map);
      }
    };
    var defaultStaticAnalysisOptions = {
      partials: true
    };
    function* _analyze(templates, partials, sync) {
      const variables = new VariableMap();
      const globals = new VariableMap();
      const locals = new VariableMap();
      const rootScope = new DummyScope(/* @__PURE__ */ new Set());
      const seen = /* @__PURE__ */ new Set();
      function updateVariables(variable, scope) {
        variables.push(variable);
        const aliased = scope.alias(variable);
        if (aliased !== void 0) {
          const root = aliased.segments[0];
          if (isString(root) && !rootScope.has(root)) {
            globals.push(aliased);
          }
        } else {
          const root = variable.segments[0];
          if (isString(root) && !scope.has(root)) {
            globals.push(variable);
          }
        }
        for (const segment of variable.segments) {
          if (segment instanceof Variable) {
            updateVariables(segment, scope);
          }
        }
      }
      function* visit(template2, scope) {
        if (template2.arguments) {
          for (const arg of template2.arguments()) {
            for (const variable of extractVariables(arg)) {
              updateVariables(variable, scope);
            }
          }
        }
        if (template2.localScope) {
          for (const ident of template2.localScope()) {
            scope.add(ident.content);
            scope.deleteAlias(ident.content);
            const [row, col] = ident.getPosition();
            locals.push(new Variable([ident.content], { row, col, file: ident.file }));
          }
        }
        if (template2.children) {
          if (template2.partialScope) {
            const partial = template2.partialScope();
            if (partial === void 0) {
              for (const child of yield template2.children(partials, sync)) {
                yield visit(child, scope);
              }
              return;
            }
            if (seen.has(partial.name))
              return;
            const partialScopeNames = /* @__PURE__ */ new Set();
            const partialScope = partial.isolated ? new DummyScope(partialScopeNames) : scope.push(partialScopeNames);
            for (const name of partial.scope) {
              if (isString(name)) {
                partialScopeNames.add(name);
              } else {
                const [alias, argument] = name;
                partialScopeNames.add(alias);
                const variables2 = Array.from(extractVariables(argument));
                if (variables2.length) {
                  partialScope.setAlias(alias, variables2[0].segments);
                }
              }
            }
            for (const child of yield template2.children(partials, sync)) {
              yield visit(child, partialScope);
              seen.add(partial.name);
            }
            partialScope.pop();
          } else {
            if (template2.blockScope) {
              scope.push(new Set(template2.blockScope()));
            }
            for (const child of yield template2.children(partials, sync)) {
              yield visit(child, scope);
            }
            if (template2.blockScope) {
              scope.pop();
            }
          }
        }
      }
      for (const template2 of templates) {
        yield visit(template2, rootScope);
      }
      return {
        variables: variables.asObject(),
        globals: globals.asObject(),
        locals: locals.asObject()
      };
    }
    function analyze(template2, options = {}) {
      const opts = { ...defaultStaticAnalysisOptions, ...options };
      return toPromise(_analyze(template2, opts.partials, false));
    }
    function analyzeSync(template2, options = {}) {
      const opts = { ...defaultStaticAnalysisOptions, ...options };
      return toValueSync(_analyze(template2, opts.partials, true));
    }
    var DummyScope = class {
      constructor(globals) {
        this.stack = [{ names: globals, aliases: /* @__PURE__ */ new Map() }];
      }
      /** Return true if `name` is in scope.  */
      has(name) {
        for (const scope of this.stack) {
          if (scope.names.has(name)) {
            return true;
          }
        }
        return false;
      }
      push(scope) {
        this.stack.push({ names: scope, aliases: /* @__PURE__ */ new Map() });
        return this;
      }
      pop() {
        return this.stack.pop()?.names;
      }
      // Add a name to the template scope.
      add(name) {
        this.stack[0].names.add(name);
      }
      /** Return the variable that `variable` aliases, or `variable` if it doesn't alias anything. */
      alias(variable) {
        const root = variable.segments[0];
        if (!isString(root))
          return void 0;
        const alias = this.getAlias(root);
        if (alias === void 0)
          return void 0;
        return new Variable([...alias, ...variable.segments.slice(1)], variable.location);
      }
      // TODO: `from` could be a path with multiple segments, like `include.x`.
      setAlias(from, to) {
        this.stack[this.stack.length - 1].aliases.set(from, to);
      }
      deleteAlias(name) {
        this.stack[this.stack.length - 1].aliases.delete(name);
      }
      getAlias(name) {
        for (const scope of this.stack) {
          if (scope.aliases.has(name)) {
            return scope.aliases.get(name);
          }
          if (scope.names.has(name)) {
            return void 0;
          }
        }
        return void 0;
      }
    };
    function* extractVariables(value) {
      if (isValueToken(value)) {
        yield* extractValueTokenVariables(value);
      } else if (value instanceof Value) {
        yield* extractFilteredValueVariables(value);
      }
    }
    function* extractFilteredValueVariables(value) {
      for (const token of value.initial.postfix) {
        if (isValueToken(token)) {
          yield* extractValueTokenVariables(token);
        }
      }
      for (const filter2 of value.filters) {
        for (const arg of filter2.args) {
          if (isKeyValuePair(arg) && arg[1]) {
            yield* extractValueTokenVariables(arg[1]);
          } else if (isValueToken(arg)) {
            yield* extractValueTokenVariables(arg);
          }
        }
      }
    }
    function* extractValueTokenVariables(token) {
      if (isRangeToken(token)) {
        yield* extractValueTokenVariables(token.lhs);
        yield* extractValueTokenVariables(token.rhs);
      } else if (isPropertyAccessToken(token)) {
        yield extractPropertyAccessVariable(token);
      }
    }
    function extractPropertyAccessVariable(token) {
      const segments = [];
      let file = token.file;
      const root = token.props[0];
      file = file || root.file;
      if (isQuotedToken(root) || isNumberToken(root) || isWordToken(root)) {
        segments.push(root.content);
      } else if (isPropertyAccessToken(root)) {
        segments.push(...extractPropertyAccessVariable(root).segments);
      }
      for (const prop of token.props.slice(1)) {
        file = file || prop.file;
        if (isQuotedToken(prop) || isNumberToken(prop) || isWordToken(prop)) {
          segments.push(prop.content);
        } else if (isPropertyAccessToken(prop)) {
          segments.push(extractPropertyAccessVariable(prop));
        }
      }
      const [row, col] = token.getPosition();
      return new Variable(segments, {
        row,
        col,
        file
      });
    }
    var RE_PROPERTY = /^[\u0080-\uFFFFa-zA-Z_][\u0080-\uFFFFa-zA-Z0-9_-]*$/;
    function segmentsString(segments, bracketedRoot = false) {
      const buf = [];
      const root = segments[0];
      if (isString(root)) {
        if (!bracketedRoot || root.match(RE_PROPERTY)) {
          buf.push(`${root}`);
        } else {
          buf.push(`['${root}']`);
        }
      }
      for (const segment of segments.slice(1)) {
        if (segment instanceof Variable) {
          buf.push(`[${segmentsString(segment.segments)}]`);
        } else if (isString(segment)) {
          if (segment.match(RE_PROPERTY)) {
            buf.push(`.${segment}`);
          } else {
            buf.push(`['${segment}']`);
          }
        } else {
          buf.push(`[${segment}]`);
        }
      }
      return buf.join("");
    }
    var LookupType;
    (function(LookupType2) {
      LookupType2["Partials"] = "partials";
      LookupType2["Layouts"] = "layouts";
      LookupType2["Root"] = "root";
    })(LookupType || (LookupType = {}));
    var Loader = class {
      constructor(options) {
        this.options = options;
        if (options.relativeReference) {
          const sep = options.fs.sep;
          assert(sep, "`fs.sep` is required for relative reference");
          const rRelativePath = new RegExp(["." + sep, ".." + sep, "./", "../"].map((prefix) => escapeRegex(prefix)).join("|"));
          this.shouldLoadRelative = (referencedFile) => rRelativePath.test(referencedFile);
        } else {
          this.shouldLoadRelative = (_referencedFile) => false;
        }
        this.contains = this.options.fs.contains || (() => true);
      }
      *lookup(file, type, sync, currentFile) {
        const { fs: fs2 } = this.options;
        const dirs = this.options[type];
        for (const filepath of this.candidates(file, dirs, currentFile, type !== LookupType.Root)) {
          if (sync ? fs2.existsSync(filepath) : yield fs2.exists(filepath))
            return filepath;
        }
        throw this.lookupError(file, dirs);
      }
      *candidates(file, dirs, currentFile, enforceRoot) {
        const { fs: fs2, extname } = this.options;
        if (this.shouldLoadRelative(file) && currentFile) {
          const referenced = fs2.resolve(this.dirname(currentFile), file, extname);
          for (const dir of dirs) {
            if (!enforceRoot || this.contains(dir, referenced)) {
              yield referenced;
              break;
            }
          }
        }
        for (const dir of dirs) {
          const referenced = fs2.resolve(dir, file, extname);
          if (!enforceRoot || this.contains(dir, referenced)) {
            yield referenced;
          }
        }
        if (fs2.fallback !== void 0) {
          const filepath = fs2.fallback(file);
          if (filepath !== void 0)
            yield filepath;
        }
      }
      dirname(path2) {
        const fs2 = this.options.fs;
        assert(fs2.dirname, "`fs.dirname` is required for relative reference");
        return fs2.dirname(path2);
      }
      lookupError(file, roots) {
        const err = new Error("ENOENT");
        err.message = `ENOENT: Failed to lookup "${file}" in "${roots}"`;
        err.code = "ENOENT";
        return err;
      }
    };
    var Parser = class {
      constructor(liquid) {
        this.liquid = liquid;
        this.cache = this.liquid.options.cache;
        this.fs = this.liquid.options.fs;
        this.parseFile = this.cache ? this._parseFileCached : this._parseFile;
        this.loader = new Loader(this.liquid.options);
        this.parseLimit = new Limiter("parse length", liquid.options.parseLimit);
      }
      parse(html, filepath) {
        html = String(html);
        this.parseLimit.use(html.length);
        const tokenizer = new Tokenizer(html, this.liquid.options.operators, filepath);
        const tokens = tokenizer.readTopLevelTokens(this.liquid.options);
        return this.parseTokens(tokens);
      }
      parseTokens(tokens) {
        let token;
        const templates = [];
        const errors = [];
        while (token = tokens.shift()) {
          try {
            templates.push(this.parseToken(token, tokens));
          } catch (err) {
            if (this.liquid.options.catchAllErrors)
              errors.push(err);
            else
              throw err;
          }
        }
        if (errors.length)
          throw new LiquidErrors(errors);
        return templates;
      }
      parseToken(token, remainTokens) {
        try {
          if (isTagToken(token)) {
            const TagClass = this.liquid.tags[token.name];
            assert(TagClass, `tag "${token.name}" not found`);
            return new TagClass(token, remainTokens, this.liquid, this);
          }
          if (isOutputToken(token)) {
            return new Output(token, this.liquid);
          }
          return new HTML(token);
        } catch (e) {
          if (LiquidError.is(e))
            throw e;
          throw new ParseError(e, token);
        }
      }
      parseStream(tokens) {
        return new ParseStream(tokens, (token, tokens2) => this.parseToken(token, tokens2));
      }
      *_parseFileCached(file, sync, type = LookupType.Root, currentFile) {
        const cache = this.cache;
        const key = this.loader.shouldLoadRelative(file) ? currentFile + "," + file : type + ":" + file;
        const tpls = yield cache.read(key);
        if (tpls)
          return tpls;
        const task = this._parseFile(file, sync, type, currentFile);
        const taskOrTpl = sync ? yield task : toPromise(task);
        cache.write(key, taskOrTpl);
        try {
          return yield taskOrTpl;
        } catch (err) {
          cache.remove(key);
          throw err;
        }
      }
      *_parseFile(file, sync, type = LookupType.Root, currentFile) {
        const filepath = yield this.loader.lookup(file, type, sync, currentFile);
        return this.parse(sync ? this.fs.readFileSync(filepath) : yield this.fs.readFile(filepath), filepath);
      }
    };
    (function(TokenKind) {
      TokenKind[TokenKind["Number"] = 1] = "Number";
      TokenKind[TokenKind["Literal"] = 2] = "Literal";
      TokenKind[TokenKind["Tag"] = 4] = "Tag";
      TokenKind[TokenKind["Output"] = 8] = "Output";
      TokenKind[TokenKind["HTML"] = 16] = "HTML";
      TokenKind[TokenKind["Filter"] = 32] = "Filter";
      TokenKind[TokenKind["Hash"] = 64] = "Hash";
      TokenKind[TokenKind["PropertyAccess"] = 128] = "PropertyAccess";
      TokenKind[TokenKind["Word"] = 256] = "Word";
      TokenKind[TokenKind["Range"] = 512] = "Range";
      TokenKind[TokenKind["Quoted"] = 1024] = "Quoted";
      TokenKind[TokenKind["Operator"] = 2048] = "Operator";
      TokenKind[TokenKind["FilteredValue"] = 4096] = "FilteredValue";
      TokenKind[TokenKind["Delimited"] = 12] = "Delimited";
    })(exports.TokenKind || (exports.TokenKind = {}));
    function isDelimitedToken(val) {
      return !!(getKind(val) & exports.TokenKind.Delimited);
    }
    function isOperatorToken(val) {
      return getKind(val) === exports.TokenKind.Operator;
    }
    function isHTMLToken(val) {
      return getKind(val) === exports.TokenKind.HTML;
    }
    function isOutputToken(val) {
      return getKind(val) === exports.TokenKind.Output;
    }
    function isTagToken(val) {
      return getKind(val) === exports.TokenKind.Tag;
    }
    function isQuotedToken(val) {
      return getKind(val) === exports.TokenKind.Quoted;
    }
    function isLiteralToken(val) {
      return getKind(val) === exports.TokenKind.Literal;
    }
    function isNumberToken(val) {
      return getKind(val) === exports.TokenKind.Number;
    }
    function isPropertyAccessToken(val) {
      return getKind(val) === exports.TokenKind.PropertyAccess;
    }
    function isWordToken(val) {
      return getKind(val) === exports.TokenKind.Word;
    }
    function isRangeToken(val) {
      return getKind(val) === exports.TokenKind.Range;
    }
    function isValueToken(val) {
      return (getKind(val) & 1667) > 0;
    }
    function getKind(val) {
      return val ? val.kind : -1;
    }
    var typeGuards = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      isDelimitedToken,
      isOperatorToken,
      isHTMLToken,
      isOutputToken,
      isTagToken,
      isQuotedToken,
      isLiteralToken,
      isNumberToken,
      isPropertyAccessToken,
      isWordToken,
      isRangeToken,
      isValueToken
    });
    var __assign = function() {
      __assign = Object.assign || function __assign2(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var Context = class _Context {
      constructor(env = {}, opts = defaultOptions, renderOptions = {}, { memoryLimit, renderLimit } = {}) {
        this.scopes = [{}];
        this.registers = {};
        this.breakCalled = false;
        this.continueCalled = false;
        this.sync = !!renderOptions.sync;
        this.opts = opts;
        this.globals = renderOptions.globals ?? opts.globals;
        this.environments = isObject(env) ? env : Object(env);
        this.strictVariables = renderOptions.strictVariables ?? this.opts.strictVariables;
        this.ownPropertyOnly = renderOptions.ownPropertyOnly ?? opts.ownPropertyOnly;
        this.memoryLimit = memoryLimit ?? new Limiter("memory alloc", renderOptions.memoryLimit ?? opts.memoryLimit);
        this.renderLimit = renderLimit ?? new Limiter("template render", getPerformance().now() + (renderOptions.renderLimit ?? opts.renderLimit));
      }
      getRegister(key) {
        return this.registers[key] = this.registers[key] || {};
      }
      setRegister(key, value) {
        return this.registers[key] = value;
      }
      saveRegister(...keys) {
        return keys.map((key) => [key, this.getRegister(key)]);
      }
      restoreRegister(keyValues) {
        return keyValues.forEach(([key, value]) => this.setRegister(key, value));
      }
      getAll() {
        return [this.globals, this.environments, ...this.scopes].reduce((ctx, val) => __assign(ctx, val), {});
      }
      /**
       * @deprecated use `_get()` or `getSync()` instead
       */
      get(paths) {
        return this.getSync(paths);
      }
      getSync(paths) {
        return toValueSync(this._get(paths));
      }
      *_get(paths) {
        const scope = this.findScope(paths[0]);
        return yield this._getFromScope(scope, paths);
      }
      /**
       * @deprecated use `_get()` instead
       */
      getFromScope(scope, paths) {
        return toValueSync(this._getFromScope(scope, paths));
      }
      *_getFromScope(scope, paths, strictVariables = this.strictVariables) {
        if (isString(paths))
          paths = paths.split(".");
        for (let i = 0; i < paths.length; i++) {
          scope = yield readProperty(scope, paths[i], this.ownPropertyOnly);
          if (strictVariables && isUndefined(scope)) {
            throw new InternalUndefinedVariableError(paths.slice(0, i + 1).join("."));
          }
        }
        return scope;
      }
      push(ctx) {
        return this.scopes.push(ctx);
      }
      pop() {
        return this.scopes.pop();
      }
      bottom() {
        return this.scopes[0];
      }
      spawn(scope = {}) {
        return new _Context(scope, this.opts, {
          sync: this.sync,
          globals: this.globals,
          strictVariables: this.strictVariables
        }, {
          renderLimit: this.renderLimit,
          memoryLimit: this.memoryLimit
        });
      }
      findScope(key) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
          const candidate = this.scopes[i];
          if (key in candidate)
            return candidate;
        }
        if (key in this.environments)
          return this.environments;
        return this.globals;
      }
    };
    function readProperty(obj, key, ownPropertyOnly) {
      obj = toLiquid(obj);
      key = toValue(key);
      if (isNil(obj))
        return obj;
      if (isArray(obj) && key < 0)
        return obj[obj.length + +key];
      const value = readJSProperty(obj, key, ownPropertyOnly);
      if (value === void 0 && obj instanceof Drop)
        return obj.liquidMethodMissing(key);
      if (isFunction(value))
        return value.call(obj);
      if (key === "size")
        return readSize(obj);
      else if (key === "first")
        return readFirst(obj);
      else if (key === "last")
        return readLast(obj);
      return value;
    }
    function readJSProperty(obj, key, ownPropertyOnly) {
      if (ownPropertyOnly && !hasOwnProperty.call(obj, key) && !(obj instanceof Drop))
        return void 0;
      return obj[key];
    }
    function readFirst(obj) {
      if (isArray(obj))
        return obj[0];
      return obj["first"];
    }
    function readLast(obj) {
      if (isArray(obj))
        return obj[obj.length - 1];
      return obj["last"];
    }
    function readSize(obj) {
      if (hasOwnProperty.call(obj, "size") || obj["size"] !== void 0)
        return obj["size"];
      if (isArray(obj) || isString(obj))
        return obj.length;
      if (typeof obj === "object")
        return Object.keys(obj).length;
    }
    var BlockMode;
    (function(BlockMode2) {
      BlockMode2[BlockMode2["OUTPUT"] = 0] = "OUTPUT";
      BlockMode2[BlockMode2["STORE"] = 1] = "STORE";
    })(BlockMode || (BlockMode = {}));
    var abs = argumentsToValue(Math.abs);
    var at_least = argumentsToValue(Math.max);
    var at_most = argumentsToValue(Math.min);
    var ceil = argumentsToValue(Math.ceil);
    var divided_by = argumentsToValue((dividend, divisor, integerArithmetic = false) => integerArithmetic ? Math.floor(dividend / divisor) : dividend / divisor);
    var floor = argumentsToValue(Math.floor);
    var minus = argumentsToValue((v, arg) => v - arg);
    var modulo = argumentsToValue((v, arg) => v % arg);
    var times = argumentsToValue((v, arg) => v * arg);
    function round(v, arg = 0) {
      v = toValue(v);
      arg = toValue(arg);
      const amp = Math.pow(10, arg);
      return Math.round(v * amp) / amp;
    }
    function plus(v, arg) {
      v = toValue(v);
      arg = toValue(arg);
      return Number(v) + Number(arg);
    }
    var mathFilters = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      abs,
      at_least,
      at_most,
      ceil,
      divided_by,
      floor,
      minus,
      modulo,
      times,
      round,
      plus
    });
    var url_decode = (x) => decodeURIComponent(stringify(x)).replace(/\+/g, " ");
    var url_encode = (x) => encodeURIComponent(stringify(x)).replace(/%20/g, "+");
    var cgi_escape = (x) => encodeURIComponent(stringify(x)).replace(/%20/g, "+").replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    var uri_escape = (x) => encodeURI(stringify(x)).replace(/%5B/g, "[").replace(/%5D/g, "]");
    var rSlugifyDefault = /[^\p{M}\p{L}\p{Nd}]+/ug;
    var rSlugifyReplacers = {
      "raw": /\s+/g,
      "default": rSlugifyDefault,
      "pretty": /[^\p{M}\p{L}\p{Nd}._~!$&'()+,;=@]+/ug,
      "ascii": /[^A-Za-z0-9]+/g,
      "latin": rSlugifyDefault,
      "none": null
    };
    function slugify(str, mode = "default", cased = false) {
      str = stringify(str);
      const replacer = rSlugifyReplacers[mode];
      if (replacer) {
        if (mode === "latin")
          str = removeAccents(str);
        str = str.replace(replacer, "-").replace(/^-|-$/g, "");
      }
      return cased ? str : str.toLowerCase();
    }
    function removeAccents(str) {
      return str.replace(/[àáâãäå]/g, "a").replace(/[æ]/g, "ae").replace(/[ç]/g, "c").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i").replace(/[ð]/g, "d").replace(/[ñ]/g, "n").replace(/[òóôõöø]/g, "o").replace(/[ùúûü]/g, "u").replace(/[ýÿ]/g, "y").replace(/[ß]/g, "ss").replace(/[œ]/g, "oe").replace(/[þ]/g, "th").replace(/[ẞ]/g, "SS").replace(/[Œ]/g, "OE").replace(/[Þ]/g, "TH");
    }
    var urlFilters = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      url_decode,
      url_encode,
      cgi_escape,
      uri_escape,
      slugify
    });
    var join = argumentsToValue(function(v, arg) {
      const array = toArray(v);
      const sep = isNil(arg) ? " " : stringify(arg);
      const complexity = array.length * (1 + sep.length);
      this.context.memoryLimit.use(complexity);
      return array.join(sep);
    });
    var last$1 = argumentsToValue((v) => isArrayLike(v) ? last(v) : "");
    var first = argumentsToValue((v) => isArrayLike(v) ? v[0] : "");
    var reverse = argumentsToValue(function(v) {
      const array = toArray(v);
      this.context.memoryLimit.use(array.length);
      return [...array].reverse();
    });
    function* sort(arr, property) {
      const values = [];
      const array = toArray(arr);
      this.context.memoryLimit.use(array.length);
      for (const item of array) {
        values.push([
          item,
          property ? yield this.context._getFromScope(item, stringify(property).split("."), false) : item
        ]);
      }
      return values.sort((lhs, rhs) => {
        const lvalue = lhs[1];
        const rvalue = rhs[1];
        return lvalue < rvalue ? -1 : lvalue > rvalue ? 1 : 0;
      }).map((tuple) => tuple[0]);
    }
    function sort_natural(input, property) {
      const propertyString = stringify(property);
      const compare = property === void 0 ? caseInsensitiveCompare : (lhs, rhs) => caseInsensitiveCompare(lhs[propertyString], rhs[propertyString]);
      const array = toArray(input);
      this.context.memoryLimit.use(array.length);
      return [...array].sort(compare);
    }
    var size = (v) => v && v.length || 0;
    function* map(arr, property) {
      const results = [];
      const array = toArray(arr);
      this.context.memoryLimit.use(array.length);
      for (const item of array) {
        results.push(yield this.context._getFromScope(item, stringify(property), false));
      }
      return results;
    }
    function* sum(arr, property) {
      let sum2 = 0;
      const array = toArray(arr);
      for (const item of array) {
        const data2 = Number(property ? yield this.context._getFromScope(item, stringify(property), false) : item);
        sum2 += Number.isNaN(data2) ? 0 : data2;
      }
      return sum2;
    }
    function compact(arr) {
      const array = toArray(arr);
      this.context.memoryLimit.use(array.length);
      return array.filter((x) => !isNil(toValue(x)));
    }
    function concat(v, arg = []) {
      const lhs = toArray(v);
      const rhs = toArray(arg);
      this.context.memoryLimit.use(lhs.length + rhs.length);
      return lhs.concat(rhs);
    }
    function push(v, arg) {
      return concat.call(this, v, [arg]);
    }
    function unshift(v, arg) {
      const array = toArray(v);
      this.context.memoryLimit.use(array.length);
      const clone = [...array];
      clone.unshift(arg);
      return clone;
    }
    function pop(v) {
      const clone = [...toArray(v)];
      clone.pop();
      return clone;
    }
    function shift(v) {
      const array = toArray(v);
      this.context.memoryLimit.use(array.length);
      const clone = [...array];
      clone.shift();
      return clone;
    }
    function slice(v, begin, length = 1) {
      v = toValue(v);
      if (isNil(v))
        return [];
      if (!isArray(v))
        v = stringify(v);
      begin = begin < 0 ? v.length + begin : begin;
      this.context.memoryLimit.use(length);
      return v.slice(begin, begin + length);
    }
    function expectedMatcher(expected) {
      if (this.context.opts.jekyllWhere) {
        return (v) => EmptyDrop.is(expected) ? equals(v, expected) : isArray(v) ? arrayIncludes(v, expected) : equals(v, expected);
      } else if (expected === void 0) {
        return (v) => isTruthy(v, this.context);
      } else {
        return (v) => equals(v, expected);
      }
    }
    function* filter(include, arr, property, expected) {
      const values = [];
      arr = toArray(arr);
      this.context.memoryLimit.use(arr.length);
      const token = new Tokenizer(stringify(property)).readScopeValue();
      for (const item of arr) {
        values.push(yield evalToken(token, this.context.spawn(item)));
      }
      const matcher = expectedMatcher.call(this, expected);
      return arr.filter((_, i) => matcher(values[i]) === include);
    }
    function* filter_exp(include, arr, itemName, exp) {
      const filtered = [];
      const keyTemplate = new Value(stringify(exp), this.liquid);
      const array = toArray(arr);
      this.context.memoryLimit.use(array.length);
      for (const item of array) {
        this.context.push({ [itemName]: item });
        const value = yield keyTemplate.value(this.context);
        this.context.pop();
        if (value === include)
          filtered.push(item);
      }
      return filtered;
    }
    function* where(arr, property, expected) {
      return yield* filter.call(this, true, arr, property, expected);
    }
    function* reject(arr, property, expected) {
      return yield* filter.call(this, false, arr, property, expected);
    }
    function* where_exp(arr, itemName, exp) {
      return yield* filter_exp.call(this, true, arr, itemName, exp);
    }
    function* reject_exp(arr, itemName, exp) {
      return yield* filter_exp.call(this, false, arr, itemName, exp);
    }
    function* group_by(arr, property) {
      const map2 = /* @__PURE__ */ new Map();
      arr = toEnumerable(arr);
      const token = new Tokenizer(stringify(property)).readScopeValue();
      this.context.memoryLimit.use(arr.length);
      for (const item of arr) {
        const key = yield evalToken(token, this.context.spawn(item));
        if (!map2.has(key))
          map2.set(key, []);
        map2.get(key).push(item);
      }
      return [...map2.entries()].map(([name, items]) => ({ name, items }));
    }
    function* group_by_exp(arr, itemName, exp) {
      const map2 = /* @__PURE__ */ new Map();
      const keyTemplate = new Value(stringify(exp), this.liquid);
      arr = toEnumerable(arr);
      this.context.memoryLimit.use(arr.length);
      for (const item of arr) {
        this.context.push({ [itemName]: item });
        const key = yield keyTemplate.value(this.context);
        this.context.pop();
        if (!map2.has(key))
          map2.set(key, []);
        map2.get(key).push(item);
      }
      return [...map2.entries()].map(([name, items]) => ({ name, items }));
    }
    function* search(arr, property, expected) {
      const token = new Tokenizer(stringify(property)).readScopeValue();
      const array = toArray(arr);
      const matcher = expectedMatcher.call(this, expected);
      for (let index = 0; index < array.length; index++) {
        const value = yield evalToken(token, this.context.spawn(array[index]));
        if (matcher(value))
          return [index, array[index]];
      }
    }
    function* search_exp(arr, itemName, exp) {
      const predicate = new Value(stringify(exp), this.liquid);
      const array = toArray(arr);
      for (let index = 0; index < array.length; index++) {
        this.context.push({ [itemName]: array[index] });
        const value = yield predicate.value(this.context);
        this.context.pop();
        if (value)
          return [index, array[index]];
      }
    }
    function* has(arr, property, expected) {
      const result = yield* search.call(this, arr, property, expected);
      return !!result;
    }
    function* has_exp(arr, itemName, exp) {
      const result = yield* search_exp.call(this, arr, itemName, exp);
      return !!result;
    }
    function* find_index(arr, property, expected) {
      const result = yield* search.call(this, arr, property, expected);
      return result ? result[0] : void 0;
    }
    function* find_index_exp(arr, itemName, exp) {
      const result = yield* search_exp.call(this, arr, itemName, exp);
      return result ? result[0] : void 0;
    }
    function* find(arr, property, expected) {
      const result = yield* search.call(this, arr, property, expected);
      return result ? result[1] : void 0;
    }
    function* find_exp(arr, itemName, exp) {
      const result = yield* search_exp.call(this, arr, itemName, exp);
      return result ? result[1] : void 0;
    }
    function uniq(arr) {
      arr = toArray(arr);
      this.context.memoryLimit.use(arr.length);
      return [...new Set(arr)];
    }
    function sample(v, count = 1) {
      v = toValue(v);
      if (isNil(v))
        return [];
      if (!isArray(v))
        v = stringify(v);
      this.context.memoryLimit.use(count);
      const shuffled = [...v].sort(() => Math.random() - 0.5);
      if (count === 1)
        return shuffled[0];
      return shuffled.slice(0, count);
    }
    var arrayFilters = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      join,
      last: last$1,
      first,
      reverse,
      sort,
      sort_natural,
      size,
      map,
      sum,
      compact,
      concat,
      push,
      unshift,
      pop,
      shift,
      slice,
      where,
      reject,
      where_exp,
      reject_exp,
      group_by,
      group_by_exp,
      has,
      has_exp,
      find_index,
      find_index_exp,
      find,
      find_exp,
      uniq,
      sample
    });
    function date(v, format2, timezoneOffset) {
      const size2 = (v?.length ?? 0) + (format2?.length ?? 0) + (timezoneOffset?.length ?? 0);
      this.context.memoryLimit.use(size2);
      const date2 = parseDate(v, this.context.opts, timezoneOffset);
      if (!date2)
        return v;
      format2 = toValue(format2);
      format2 = isNil(format2) ? this.context.opts.dateFormat : stringify(format2);
      return strftime(date2, format2);
    }
    function date_to_xmlschema(v) {
      return date.call(this, v, "%Y-%m-%dT%H:%M:%S%:z");
    }
    function date_to_rfc822(v) {
      return date.call(this, v, "%a, %d %b %Y %H:%M:%S %z");
    }
    function date_to_string(v, type, style) {
      return stringify_date.call(this, v, "%b", type, style);
    }
    function date_to_long_string(v, type, style) {
      return stringify_date.call(this, v, "%B", type, style);
    }
    function stringify_date(v, month_type, type, style) {
      const date2 = parseDate(v, this.context.opts);
      if (!date2)
        return v;
      if (type === "ordinal") {
        const d = date2.getDate();
        return style === "US" ? strftime(date2, `${month_type} ${d}%q, %Y`) : strftime(date2, `${d}%q ${month_type} %Y`);
      }
      return strftime(date2, `%d ${month_type} %Y`);
    }
    function parseDate(v, opts, timezoneOffset) {
      let date2;
      const defaultTimezoneOffset = timezoneOffset ?? opts.timezoneOffset;
      const locale = opts.locale;
      v = toValue(v);
      if (v === "now" || v === "today") {
        date2 = new LiquidDate(Date.now(), locale, defaultTimezoneOffset);
      } else if (isNumber(v)) {
        date2 = new LiquidDate(v * 1e3, locale, defaultTimezoneOffset);
      } else if (isString(v)) {
        if (/^\d+$/.test(v)) {
          date2 = new LiquidDate(+v * 1e3, locale, defaultTimezoneOffset);
        } else if (opts.preserveTimezones && timezoneOffset === void 0) {
          date2 = LiquidDate.createDateFixedToTimezone(v, locale);
        } else {
          date2 = new LiquidDate(v, locale, defaultTimezoneOffset);
        }
      } else {
        date2 = new LiquidDate(v, locale, defaultTimezoneOffset);
      }
      return date2.valid() ? date2 : void 0;
    }
    var dateFilters = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      date,
      date_to_xmlschema,
      date_to_rfc822,
      date_to_string,
      date_to_long_string
    });
    var rCJKWord = /[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/gu;
    var rNonCJKWord = /[^\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\s]+/gu;
    function append(v, arg) {
      assert(arguments.length === 2, "append expect 2 arguments");
      const lhs = stringify(v);
      const rhs = stringify(arg);
      this.context.memoryLimit.use(lhs.length + rhs.length);
      return lhs + rhs;
    }
    function prepend(v, arg) {
      assert(arguments.length === 2, "prepend expect 2 arguments");
      const lhs = stringify(v);
      const rhs = stringify(arg);
      this.context.memoryLimit.use(lhs.length + rhs.length);
      return rhs + lhs;
    }
    function lstrip(v, chars) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      if (chars) {
        chars = escapeRegExp(stringify(chars));
        return str.replace(new RegExp(`^[${chars}]+`, "g"), "");
      }
      return str.replace(/^\s+/, "");
    }
    function downcase(v) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.toLowerCase();
    }
    function upcase(v) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return stringify(str).toUpperCase();
    }
    function remove(v, arg) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.split(stringify(arg)).join("");
    }
    function remove_first(v, l) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.replace(stringify(l), "");
    }
    function remove_last(v, l) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      const pattern = stringify(l);
      const index = str.lastIndexOf(pattern);
      if (index === -1)
        return str;
      return str.substring(0, index) + str.substring(index + pattern.length);
    }
    function rstrip(str, chars) {
      str = stringify(str);
      this.context.memoryLimit.use(str.length);
      if (chars) {
        chars = escapeRegExp(stringify(chars));
        return str.replace(new RegExp(`[${chars}]+$`, "g"), "");
      }
      return str.replace(/\s+$/, "");
    }
    function split(v, arg) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      const arr = str.split(stringify(arg));
      while (arr.length && arr[arr.length - 1] === "")
        arr.pop();
      return arr;
    }
    function strip(v, chars) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      if (chars) {
        chars = escapeRegExp(stringify(chars));
        return str.replace(new RegExp(`^[${chars}]+`, "g"), "").replace(new RegExp(`[${chars}]+$`, "g"), "");
      }
      return str.trim();
    }
    function strip_newlines(v) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.replace(/\r?\n/gm, "");
    }
    function capitalize(str) {
      str = stringify(str);
      this.context.memoryLimit.use(str.length);
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    function replace(v, pattern, replacement) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.split(stringify(pattern)).join(replacement);
    }
    function replace_first(v, arg1, arg2) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.replace(stringify(arg1), arg2);
    }
    function replace_last(v, arg1, arg2) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      const pattern = stringify(arg1);
      const index = str.lastIndexOf(pattern);
      if (index === -1)
        return str;
      const replacement = stringify(arg2);
      return str.substring(0, index) + replacement + str.substring(index + pattern.length);
    }
    function truncate(v, l = 50, o = "...") {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      if (str.length <= l)
        return v;
      return str.substring(0, l - o.length) + o;
    }
    function truncatewords(v, words = 15, o = "...") {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      const arr = str.split(/\s+/);
      if (words <= 0)
        words = 1;
      let ret = arr.slice(0, words).join(" ");
      if (arr.length >= words)
        ret += o;
      return ret;
    }
    function normalize_whitespace(v) {
      const str = stringify(v);
      this.context.memoryLimit.use(str.length);
      return str.replace(/\s+/g, " ");
    }
    function number_of_words(input, mode) {
      const str = stringify(input);
      this.context.memoryLimit.use(str.length);
      input = str.trim();
      if (!input)
        return 0;
      switch (mode) {
        case "cjk":
          return (input.match(rCJKWord) || []).length + (input.match(rNonCJKWord) || []).length;
        case "auto":
          return rCJKWord.test(input) ? input.match(rCJKWord).length + (input.match(rNonCJKWord) || []).length : input.split(/\s+/).length;
        default:
          return input.split(/\s+/).length;
      }
    }
    function array_to_sentence_string(array, connector = "and") {
      this.context.memoryLimit.use(array.length);
      switch (array.length) {
        case 0:
          return "";
        case 1:
          return array[0];
        case 2:
          return `${array[0]} ${connector} ${array[1]}`;
        default:
          return `${array.slice(0, -1).join(", ")}, ${connector} ${array[array.length - 1]}`;
      }
    }
    var stringFilters = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      append,
      prepend,
      lstrip,
      downcase,
      upcase,
      remove,
      remove_first,
      remove_last,
      rstrip,
      split,
      strip,
      strip_newlines,
      capitalize,
      replace,
      replace_first,
      replace_last,
      truncate,
      truncatewords,
      normalize_whitespace,
      number_of_words,
      array_to_sentence_string
    });
    var filters = {
      ...htmlFilters,
      ...mathFilters,
      ...urlFilters,
      ...arrayFilters,
      ...dateFilters,
      ...stringFilters,
      ...misc
    };
    var AssignTag = class extends Tag {
      constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.identifier = this.tokenizer.readIdentifier();
        this.key = this.identifier.content;
        this.tokenizer.assert(this.key, "expected variable name");
        this.tokenizer.skipBlank();
        this.tokenizer.assert(this.tokenizer.peek() === "=", 'expected "="');
        this.tokenizer.advance();
        this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid);
      }
      *render(ctx) {
        ctx.bottom()[this.key] = yield this.value.value(ctx, this.liquid.options.lenientIf);
      }
      *arguments() {
        yield this.value;
      }
      *localScope() {
        yield this.identifier;
      }
    };
    var MODIFIERS = ["offset", "limit", "reversed"];
    var ForTag = class extends Tag {
      constructor(token, remainTokens, liquid, parser) {
        super(token, remainTokens, liquid);
        const variable = this.tokenizer.readIdentifier();
        const inStr = this.tokenizer.readIdentifier();
        const collection = this.tokenizer.readValue();
        if (!variable.size() || inStr.content !== "in" || !collection) {
          throw new Error(`illegal tag: ${token.getText()}`);
        }
        this.variable = variable.content;
        this.collection = collection;
        this.hash = new Hash(this.tokenizer, liquid.options.keyValueSeparator);
        this.templates = [];
        this.elseTemplates = [];
        let p;
        const stream2 = parser.parseStream(remainTokens).on("start", () => p = this.templates).on("tag:else", (tag) => {
          assertEmpty(tag.args);
          p = this.elseTemplates;
        }).on("tag:endfor", (tag) => {
          assertEmpty(tag.args);
          stream2.stop();
        }).on("template", (tpl) => p.push(tpl)).on("end", () => {
          throw new Error(`tag ${token.getText()} not closed`);
        });
        stream2.start();
      }
      *render(ctx, emitter) {
        const r = this.liquid.renderer;
        let collection = toEnumerable(yield evalToken(this.collection, ctx));
        if (!collection.length) {
          yield r.renderTemplates(this.elseTemplates, ctx, emitter);
          return;
        }
        const continueKey = "continue-" + this.variable + "-" + this.collection.getText();
        ctx.push({ continue: ctx.getRegister(continueKey) });
        const hash = yield this.hash.render(ctx);
        ctx.pop();
        const modifiers = this.liquid.options.orderedFilterParameters ? Object.keys(hash).filter((x) => MODIFIERS.includes(x)) : MODIFIERS.filter((x) => hash[x] !== void 0);
        collection = modifiers.reduce((collection2, modifier) => {
          if (modifier === "offset")
            return offset(collection2, hash["offset"]);
          if (modifier === "limit")
            return limit(collection2, hash["limit"]);
          return reversed(collection2);
        }, collection);
        ctx.setRegister(continueKey, (hash["offset"] || 0) + collection.length);
        const scope = { forloop: new ForloopDrop(collection.length, this.collection.getText(), this.variable) };
        ctx.push(scope);
        for (const item of collection) {
          scope[this.variable] = item;
          ctx.continueCalled = ctx.breakCalled = false;
          yield r.renderTemplates(this.templates, ctx, emitter);
          if (ctx.breakCalled)
            break;
          scope.forloop.next();
        }
        ctx.continueCalled = ctx.breakCalled = false;
        ctx.pop();
      }
      *children() {
        const templates = this.templates.slice();
        if (this.elseTemplates) {
          templates.push(...this.elseTemplates);
        }
        return templates;
      }
      *arguments() {
        yield this.collection;
        for (const v of Object.values(this.hash.hash)) {
          if (isValueToken(v)) {
            yield v;
          }
        }
      }
      blockScope() {
        return [this.variable, "forloop"];
      }
    };
    function reversed(arr) {
      return [...arr].reverse();
    }
    function offset(arr, count) {
      return arr.slice(count);
    }
    function limit(arr, count) {
      return arr.slice(0, count);
    }
    var CaptureTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid, parser) {
        super(tagToken, remainTokens, liquid);
        this.templates = [];
        this.identifier = this.readVariable();
        this.variable = this.identifier.content;
        while (remainTokens.length) {
          const token = remainTokens.shift();
          if (isTagToken(token) && token.name === "endcapture")
            return;
          this.templates.push(parser.parseToken(token, remainTokens));
        }
        throw new Error(`tag ${tagToken.getText()} not closed`);
      }
      readVariable() {
        let ident = this.tokenizer.readIdentifier();
        if (ident.content)
          return ident;
        ident = this.tokenizer.readQuoted();
        if (ident)
          return ident;
        throw this.tokenizer.error("invalid capture name");
      }
      *render(ctx) {
        const r = this.liquid.renderer;
        const html = yield r.renderTemplates(this.templates, ctx);
        ctx.bottom()[this.variable] = html;
      }
      *children() {
        return this.templates;
      }
      *localScope() {
        yield this.identifier;
      }
    };
    var CaseTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid, parser) {
        super(tagToken, remainTokens, liquid);
        this.branches = [];
        this.elseTemplates = [];
        this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid);
        this.elseTemplates = [];
        let p = [];
        let elseCount = 0;
        const stream2 = parser.parseStream(remainTokens).on("tag:when", (token) => {
          if (elseCount > 0) {
            return;
          }
          p = [];
          const values = [];
          while (!token.tokenizer.end()) {
            values.push(token.tokenizer.readValueOrThrow());
            token.tokenizer.skipBlank();
            if (token.tokenizer.peek() === ",") {
              token.tokenizer.readTo(",");
            } else {
              token.tokenizer.readTo("or");
            }
          }
          this.branches.push({
            values,
            templates: p
          });
        }).on("tag:else", () => {
          elseCount++;
          p = this.elseTemplates;
        }).on("tag:endcase", () => stream2.stop()).on("template", (tpl) => {
          if (p !== this.elseTemplates || elseCount === 1) {
            p.push(tpl);
          }
        }).on("end", () => {
          throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream2.start();
      }
      *render(ctx, emitter) {
        const r = this.liquid.renderer;
        const target = toValue(yield this.value.value(ctx, ctx.opts.lenientIf));
        let branchHit = false;
        for (const branch of this.branches) {
          for (const valueToken of branch.values) {
            const value = yield evalToken(valueToken, ctx, ctx.opts.lenientIf);
            if (equals(target, value)) {
              yield r.renderTemplates(branch.templates, ctx, emitter);
              branchHit = true;
              break;
            }
          }
        }
        if (!branchHit) {
          yield r.renderTemplates(this.elseTemplates, ctx, emitter);
        }
      }
      *arguments() {
        yield this.value;
        yield* this.branches.flatMap((b) => b.values);
      }
      *children() {
        const templates = this.branches.flatMap((b) => b.templates);
        if (this.elseTemplates) {
          templates.push(...this.elseTemplates);
        }
        return templates;
      }
    };
    var CommentTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid) {
        super(tagToken, remainTokens, liquid);
        while (remainTokens.length) {
          const token = remainTokens.shift();
          if (isTagToken(token) && token.name === "endcomment")
            return;
        }
        throw new Error(`tag ${tagToken.getText()} not closed`);
      }
      render() {
      }
    };
    var RenderTag = class extends Tag {
      constructor(token, remainTokens, liquid, parser) {
        super(token, remainTokens, liquid);
        const tokenizer = this.tokenizer;
        this.file = parseFilePath(tokenizer, this.liquid, parser);
        this.currentFile = token.file;
        while (!tokenizer.end()) {
          tokenizer.skipBlank();
          const begin = tokenizer.p;
          const keyword = tokenizer.readIdentifier();
          if (keyword.content === "with" || keyword.content === "for") {
            tokenizer.skipBlank();
            if (tokenizer.peek() !== ":") {
              const value = tokenizer.readValue();
              if (value) {
                const beforeAs = tokenizer.p;
                const asStr = tokenizer.readIdentifier();
                let alias;
                if (asStr.content === "as")
                  alias = tokenizer.readIdentifier();
                else
                  tokenizer.p = beforeAs;
                this[keyword.content] = { value, alias: alias && alias.content };
                tokenizer.skipBlank();
                if (tokenizer.peek() === ",")
                  tokenizer.advance();
                continue;
              }
            }
          }
          tokenizer.p = begin;
          break;
        }
        this.hash = new Hash(tokenizer, liquid.options.keyValueSeparator);
      }
      *render(ctx, emitter) {
        const { liquid, hash } = this;
        const filepath = yield renderFilePath(this["file"], ctx, liquid);
        assert(filepath, () => `illegal file path "${filepath}"`);
        const childCtx = ctx.spawn();
        const scope = childCtx.bottom();
        __assign(scope, yield hash.render(ctx));
        if (this["with"]) {
          const { value, alias } = this["with"];
          scope[alias || filepath] = yield evalToken(value, ctx);
        }
        if (this["for"]) {
          const { value, alias } = this["for"];
          const collection = toEnumerable(yield evalToken(value, ctx));
          scope["forloop"] = new ForloopDrop(collection.length, value.getText(), alias);
          for (const item of collection) {
            scope[alias] = item;
            const templates = yield liquid._parsePartialFile(filepath, childCtx.sync, this["currentFile"]);
            yield liquid.renderer.renderTemplates(templates, childCtx, emitter);
            scope["forloop"].next();
          }
        } else {
          const templates = yield liquid._parsePartialFile(filepath, childCtx.sync, this["currentFile"]);
          yield liquid.renderer.renderTemplates(templates, childCtx, emitter);
        }
      }
      *children(partials, sync) {
        if (partials && isString(this["file"])) {
          return yield this.liquid._parsePartialFile(this["file"], sync, this["currentFile"]);
        }
        return [];
      }
      partialScope() {
        if (isString(this["file"])) {
          const names = Object.keys(this.hash.hash);
          if (this["with"]) {
            const { value, alias } = this["with"];
            if (isString(alias)) {
              names.push([alias, value]);
            } else if (isString(this.file)) {
              names.push([this.file, value]);
            }
          }
          if (this["for"]) {
            const { value, alias } = this["for"];
            if (isString(alias)) {
              names.push([alias, value]);
            } else if (isString(this.file)) {
              names.push([this.file, value]);
            }
          }
          return { name: this["file"], isolated: true, scope: names };
        }
      }
      *arguments() {
        for (const v of Object.values(this.hash.hash)) {
          if (isValueToken(v)) {
            yield v;
          }
        }
        if (this["with"]) {
          const { value } = this["with"];
          if (isValueToken(value)) {
            yield value;
          }
        }
        if (this["for"]) {
          const { value } = this["for"];
          if (isValueToken(value)) {
            yield value;
          }
        }
      }
    };
    function parseFilePath(tokenizer, liquid, parser) {
      if (liquid.options.dynamicPartials) {
        const file = tokenizer.readValue();
        tokenizer.assert(file, "illegal file path");
        if (file.getText() === "none")
          return;
        if (isQuotedToken(file)) {
          const templates2 = parser.parse(evalQuotedToken(file));
          return optimize(templates2);
        }
        return file;
      }
      const tokens = [...tokenizer.readFileNameTemplate(liquid.options)];
      const templates = optimize(parser.parseTokens(tokens));
      return templates === "none" ? void 0 : templates;
    }
    function optimize(templates) {
      if (templates.length === 1 && isHTMLToken(templates[0].token))
        return templates[0].token.getContent();
      return templates;
    }
    function* renderFilePath(file, ctx, liquid) {
      if (typeof file === "string")
        return file;
      if (Array.isArray(file))
        return liquid.renderer.renderTemplates(file, ctx);
      return yield evalToken(file, ctx);
    }
    var IncludeTag = class extends Tag {
      constructor(token, remainTokens, liquid, parser) {
        super(token, remainTokens, liquid);
        const { tokenizer } = token;
        this["file"] = parseFilePath(tokenizer, this.liquid, parser);
        this["currentFile"] = token.file;
        const begin = tokenizer.p;
        const withStr = tokenizer.readIdentifier();
        if (withStr.content === "with") {
          tokenizer.skipBlank();
          if (tokenizer.peek() !== ":") {
            this.withVar = tokenizer.readValue();
          } else
            tokenizer.p = begin;
        } else
          tokenizer.p = begin;
        this.hash = new Hash(tokenizer, liquid.options.jekyllInclude || liquid.options.keyValueSeparator);
      }
      *render(ctx, emitter) {
        const { liquid, hash, withVar } = this;
        const { renderer } = liquid;
        const filepath = yield renderFilePath(this["file"], ctx, liquid);
        assert(filepath, () => `illegal file path "${filepath}"`);
        const saved = ctx.saveRegister("blocks", "blockMode");
        ctx.setRegister("blocks", {});
        ctx.setRegister("blockMode", BlockMode.OUTPUT);
        const scope = yield hash.render(ctx);
        if (withVar)
          scope[filepath] = yield evalToken(withVar, ctx);
        const templates = yield liquid._parsePartialFile(filepath, ctx.sync, this["currentFile"]);
        ctx.push(ctx.opts.jekyllInclude ? { include: scope } : scope);
        yield renderer.renderTemplates(templates, ctx, emitter);
        ctx.pop();
        ctx.restoreRegister(saved);
      }
      *children(partials, sync) {
        if (partials && isString(this["file"])) {
          return yield this.liquid._parsePartialFile(this["file"], sync, this["currentFile"]);
        }
        return [];
      }
      partialScope() {
        if (isString(this["file"])) {
          let names;
          if (this.liquid.options.jekyllInclude) {
            names = ["include"];
          } else {
            names = Object.keys(this.hash.hash);
            if (this.withVar) {
              names.push([this["file"], this.withVar]);
            }
          }
          return { name: this["file"], isolated: false, scope: names };
        }
      }
      *arguments() {
        yield* Object.values(this.hash.hash).filter(isValueToken);
        if (isValueToken(this["file"])) {
          yield this["file"];
        }
        if (isValueToken(this.withVar)) {
          yield this.withVar;
        }
      }
    };
    var DecrementTag = class extends Tag {
      constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.identifier = this.tokenizer.readIdentifier();
        this.variable = this.identifier.content;
      }
      render(context, emitter) {
        const scope = context.environments;
        if (!isNumber(scope[this.variable])) {
          scope[this.variable] = 0;
        }
        emitter.write(stringify(--scope[this.variable]));
      }
      *localScope() {
        yield this.identifier;
      }
    };
    var CycleTag = class extends Tag {
      constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.candidates = [];
        const group = this.tokenizer.readValue();
        this.tokenizer.skipBlank();
        if (group) {
          if (this.tokenizer.peek() === ":") {
            this.group = group;
            this.tokenizer.advance();
          } else
            this.candidates.push(group);
        }
        while (!this.tokenizer.end()) {
          const value = this.tokenizer.readValue();
          if (value)
            this.candidates.push(value);
          this.tokenizer.readTo(",");
        }
        this.tokenizer.assert(this.candidates.length, () => `empty candidates: "${token.getText()}"`);
      }
      *render(ctx, emitter) {
        const group = yield evalToken(this.group, ctx);
        const fingerprint = `cycle:${group}:` + this.candidates.join(",");
        const groups = ctx.getRegister("cycle");
        let idx = groups[fingerprint];
        if (idx === void 0) {
          idx = groups[fingerprint] = 0;
        }
        const candidate = this.candidates[idx];
        idx = (idx + 1) % this.candidates.length;
        groups[fingerprint] = idx;
        return yield evalToken(candidate, ctx);
      }
      *arguments() {
        yield* this.candidates;
        if (this.group) {
          yield this.group;
        }
      }
    };
    var IfTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid, parser) {
        super(tagToken, remainTokens, liquid);
        this.branches = [];
        let p = [];
        parser.parseStream(remainTokens).on("start", () => this.branches.push({
          value: new Value(tagToken.tokenizer.readFilteredValue(), this.liquid),
          templates: p = []
        })).on("tag:elsif", (token) => {
          assert(!this.elseTemplates, "unexpected elsif after else");
          this.branches.push({
            value: new Value(token.tokenizer.readFilteredValue(), this.liquid),
            templates: p = []
          });
        }).on("tag:else", (tag) => {
          assertEmpty(tag.args);
          assert(!this.elseTemplates, "duplicated else");
          p = this.elseTemplates = [];
        }).on("tag:endif", function(tag) {
          assertEmpty(tag.args);
          this.stop();
        }).on("template", (tpl) => p.push(tpl)).on("end", () => {
          throw new Error(`tag ${tagToken.getText()} not closed`);
        }).start();
      }
      *render(ctx, emitter) {
        const r = this.liquid.renderer;
        for (const { value, templates } of this.branches) {
          const v = yield value.value(ctx, ctx.opts.lenientIf);
          if (isTruthy(v, ctx)) {
            yield r.renderTemplates(templates, ctx, emitter);
            return;
          }
        }
        yield r.renderTemplates(this.elseTemplates || [], ctx, emitter);
      }
      *children() {
        const templates = this.branches.flatMap((b) => b.templates);
        if (this.elseTemplates) {
          templates.push(...this.elseTemplates);
        }
        return templates;
      }
      arguments() {
        return this.branches.map((b) => b.value);
      }
    };
    var IncrementTag = class extends Tag {
      constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.identifier = this.tokenizer.readIdentifier();
        this.variable = this.identifier.content;
      }
      render(context, emitter) {
        const scope = context.environments;
        if (!isNumber(scope[this.variable])) {
          scope[this.variable] = 0;
        }
        const val = scope[this.variable];
        scope[this.variable]++;
        emitter.write(stringify(val));
      }
      *localScope() {
        yield this.identifier;
      }
    };
    var LayoutTag = class extends Tag {
      constructor(token, remainTokens, liquid, parser) {
        super(token, remainTokens, liquid);
        this.file = parseFilePath(this.tokenizer, this.liquid, parser);
        this["currentFile"] = token.file;
        this.args = new Hash(this.tokenizer, liquid.options.keyValueSeparator);
        this.templates = parser.parseTokens(remainTokens);
      }
      *render(ctx, emitter) {
        const { liquid, args, file } = this;
        const { renderer } = liquid;
        if (file === void 0) {
          ctx.setRegister("blockMode", BlockMode.OUTPUT);
          yield renderer.renderTemplates(this.templates, ctx, emitter);
          return;
        }
        const filepath = yield renderFilePath(this.file, ctx, liquid);
        assert(filepath, () => `illegal file path "${filepath}"`);
        const templates = yield liquid._parseLayoutFile(filepath, ctx.sync, this["currentFile"]);
        ctx.setRegister("blockMode", BlockMode.STORE);
        const html = yield renderer.renderTemplates(this.templates, ctx);
        const blocks = ctx.getRegister("blocks");
        if (blocks[""] === void 0)
          blocks[""] = (parent, emitter2) => emitter2.write(html);
        ctx.setRegister("blockMode", BlockMode.OUTPUT);
        ctx.push(yield args.render(ctx));
        yield renderer.renderTemplates(templates, ctx, emitter);
        ctx.pop();
      }
      *children(partials) {
        const templates = this.templates.slice();
        if (partials && isString(this.file)) {
          templates.push(...yield this.liquid._parsePartialFile(this.file, true, this["currentFile"]));
        }
        return templates;
      }
      *arguments() {
        for (const v of Object.values(this.args.hash)) {
          if (isValueToken(v)) {
            yield v;
          }
        }
        if (isValueToken(this.file)) {
          yield this.file;
        }
      }
      partialScope() {
        if (isString(this.file)) {
          return { name: this.file, isolated: false, scope: Object.keys(this.args.hash) };
        }
      }
    };
    var BlockTag = class extends Tag {
      constructor(token, remainTokens, liquid, parser) {
        super(token, remainTokens, liquid);
        this.templates = [];
        const match = /\w+/.exec(token.args);
        this.block = match ? match[0] : "";
        while (remainTokens.length) {
          const token2 = remainTokens.shift();
          if (isTagToken(token2) && token2.name === "endblock")
            return;
          const template2 = parser.parseToken(token2, remainTokens);
          this.templates.push(template2);
        }
        throw new Error(`tag ${token.getText()} not closed`);
      }
      *render(ctx, emitter) {
        const blockRender = this.getBlockRender(ctx);
        if (ctx.getRegister("blockMode") === BlockMode.STORE) {
          ctx.getRegister("blocks")[this.block] = blockRender;
        } else {
          yield blockRender(new BlockDrop(), emitter);
        }
      }
      getBlockRender(ctx) {
        const { liquid, templates } = this;
        const renderChild = ctx.getRegister("blocks")[this.block];
        const renderCurrent = function* (superBlock, emitter) {
          ctx.push({ block: superBlock });
          yield liquid.renderer.renderTemplates(templates, ctx, emitter);
          ctx.pop();
        };
        return renderChild ? (superBlock, emitter) => renderChild(new BlockDrop((emitter2) => renderCurrent(superBlock, emitter2)), emitter) : renderCurrent;
      }
      *children() {
        return this.templates;
      }
      blockScope() {
        return ["block"];
      }
    };
    var RawTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid) {
        super(tagToken, remainTokens, liquid);
        this.tokens = [];
        while (remainTokens.length) {
          const token = remainTokens.shift();
          if (isTagToken(token) && token.name === "endraw")
            return;
          this.tokens.push(token);
        }
        throw new Error(`tag ${tagToken.getText()} not closed`);
      }
      render() {
        return this.tokens.map((token) => token.getText()).join("");
      }
    };
    var TablerowloopDrop = class extends ForloopDrop {
      constructor(length, cols, collection, variable) {
        super(length, collection, variable);
        this.length = length;
        this.cols = cols;
      }
      row() {
        return Math.floor(this.i / this.cols) + 1;
      }
      col0() {
        return this.i % this.cols;
      }
      col() {
        return this.col0() + 1;
      }
      col_first() {
        return this.col0() === 0;
      }
      col_last() {
        return this.col() === this.cols;
      }
    };
    var TablerowTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid, parser) {
        super(tagToken, remainTokens, liquid);
        const variable = this.tokenizer.readIdentifier();
        this.tokenizer.skipBlank();
        const predicate = this.tokenizer.readIdentifier();
        const collectionToken = this.tokenizer.readValue();
        if (predicate.content !== "in" || !collectionToken) {
          throw new Error(`illegal tag: ${tagToken.getText()}`);
        }
        this.variable = variable.content;
        this.collection = collectionToken;
        this.args = new Hash(this.tokenizer, liquid.options.keyValueSeparator);
        this.templates = [];
        let p;
        const stream2 = parser.parseStream(remainTokens).on("start", () => p = this.templates).on("tag:endtablerow", () => stream2.stop()).on("template", (tpl) => p.push(tpl)).on("end", () => {
          throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream2.start();
      }
      *render(ctx, emitter) {
        let collection = toEnumerable(yield evalToken(this.collection, ctx));
        const args = yield this.args.render(ctx);
        const offset2 = args.offset || 0;
        const limit2 = args.limit === void 0 ? collection.length : args.limit;
        collection = collection.slice(offset2, offset2 + limit2);
        const cols = args.cols || collection.length;
        const r = this.liquid.renderer;
        const tablerowloop = new TablerowloopDrop(collection.length, cols, this.collection.getText(), this.variable);
        const scope = { tablerowloop };
        ctx.push(scope);
        for (let idx = 0; idx < collection.length; idx++, tablerowloop.next()) {
          scope[this.variable] = collection[idx];
          if (tablerowloop.col0() === 0) {
            if (tablerowloop.row() !== 1)
              emitter.write("</tr>");
            emitter.write(`<tr class="row${tablerowloop.row()}">`);
          }
          emitter.write(`<td class="col${tablerowloop.col()}">`);
          yield r.renderTemplates(this.templates, ctx, emitter);
          emitter.write("</td>");
        }
        if (collection.length)
          emitter.write("</tr>");
        ctx.pop();
      }
      *children() {
        return this.templates;
      }
      *arguments() {
        yield this.collection;
        for (const v of Object.values(this.args.hash)) {
          if (isValueToken(v)) {
            yield v;
          }
        }
      }
      blockScope() {
        return [this.variable, "tablerowloop"];
      }
    };
    var UnlessTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid, parser) {
        super(tagToken, remainTokens, liquid);
        this.branches = [];
        this.elseTemplates = [];
        let p = [];
        let elseCount = 0;
        parser.parseStream(remainTokens).on("start", () => this.branches.push({
          value: new Value(tagToken.tokenizer.readFilteredValue(), this.liquid),
          test: isFalsy,
          templates: p = []
        })).on("tag:elsif", (token) => {
          if (elseCount > 0) {
            p = [];
            return;
          }
          this.branches.push({
            value: new Value(token.tokenizer.readFilteredValue(), this.liquid),
            test: isTruthy,
            templates: p = []
          });
        }).on("tag:else", () => {
          elseCount++;
          p = this.elseTemplates;
        }).on("tag:endunless", function() {
          this.stop();
        }).on("template", (tpl) => {
          if (p !== this.elseTemplates || elseCount === 1) {
            p.push(tpl);
          }
        }).on("end", () => {
          throw new Error(`tag ${tagToken.getText()} not closed`);
        }).start();
      }
      *render(ctx, emitter) {
        const r = this.liquid.renderer;
        for (const { value, test, templates } of this.branches) {
          const v = yield value.value(ctx, ctx.opts.lenientIf);
          if (test(v, ctx)) {
            yield r.renderTemplates(templates, ctx, emitter);
            return;
          }
        }
        yield r.renderTemplates(this.elseTemplates, ctx, emitter);
      }
      *children() {
        const children = this.branches.flatMap((b) => b.templates);
        if (this.elseTemplates) {
          children.push(...this.elseTemplates);
        }
        return children;
      }
      arguments() {
        return this.branches.map((b) => b.value);
      }
    };
    var BreakTag = class extends Tag {
      render(ctx, _emitter) {
        ctx.breakCalled = true;
      }
    };
    var ContinueTag = class extends Tag {
      render(ctx, _emitter) {
        ctx.continueCalled = true;
      }
    };
    var EchoTag = class extends Tag {
      constructor(token, remainTokens, liquid) {
        super(token, remainTokens, liquid);
        this.tokenizer.skipBlank();
        if (!this.tokenizer.end()) {
          this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid);
        }
      }
      *render(ctx, emitter) {
        if (!this.value)
          return;
        const val = yield this.value.value(ctx, false);
        emitter.write(val);
      }
      *arguments() {
        if (this.value) {
          yield this.value;
        }
      }
    };
    var LiquidTag = class extends Tag {
      constructor(token, remainTokens, liquid, parser) {
        super(token, remainTokens, liquid);
        const tokens = this.tokenizer.readLiquidTagTokens(this.liquid.options);
        this.templates = parser.parseTokens(tokens);
      }
      *render(ctx, emitter) {
        yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      }
      *children() {
        return this.templates;
      }
    };
    var InlineCommentTag = class extends Tag {
      constructor(tagToken, remainTokens, liquid) {
        super(tagToken, remainTokens, liquid);
        if (tagToken.args.search(/\n\s*[^#\s]/g) !== -1) {
          throw new Error("every line of an inline comment must start with a '#' character");
        }
      }
      render() {
      }
    };
    var tags2 = {
      assign: AssignTag,
      "for": ForTag,
      capture: CaptureTag,
      "case": CaseTag,
      comment: CommentTag,
      include: IncludeTag,
      render: RenderTag,
      decrement: DecrementTag,
      increment: IncrementTag,
      cycle: CycleTag,
      "if": IfTag,
      layout: LayoutTag,
      block: BlockTag,
      raw: RawTag,
      tablerow: TablerowTag,
      unless: UnlessTag,
      "break": BreakTag,
      "continue": ContinueTag,
      echo: EchoTag,
      liquid: LiquidTag,
      "#": InlineCommentTag
    };
    var Liquid2 = class _Liquid {
      constructor(opts = {}) {
        this.renderer = new Render();
        this.filters = {};
        this.tags = {};
        this.options = normalize(opts);
        this.parser = new Parser(this);
        forOwn(tags2, (conf, name) => this.registerTag(name, conf));
        forOwn(filters, (handler, name) => this.registerFilter(name, handler));
      }
      parse(html, filepath) {
        const parser = new Parser(this);
        return parser.parse(html, filepath);
      }
      _render(tpl, scope, renderOptions) {
        const ctx = scope instanceof Context ? scope : new Context(scope, this.options, renderOptions);
        return this.renderer.renderTemplates(tpl, ctx);
      }
      async render(tpl, scope, renderOptions) {
        return toPromise(this._render(tpl, scope, { ...renderOptions, sync: false }));
      }
      renderSync(tpl, scope, renderOptions) {
        return toValueSync(this._render(tpl, scope, { ...renderOptions, sync: true }));
      }
      renderToNodeStream(tpl, scope, renderOptions = {}) {
        const ctx = new Context(scope, this.options, renderOptions);
        return this.renderer.renderTemplatesToNodeStream(tpl, ctx);
      }
      _parseAndRender(html, scope, renderOptions) {
        const tpl = this.parse(html);
        return this._render(tpl, scope, renderOptions);
      }
      async parseAndRender(html, scope, renderOptions) {
        return toPromise(this._parseAndRender(html, scope, { ...renderOptions, sync: false }));
      }
      parseAndRenderSync(html, scope, renderOptions) {
        return toValueSync(this._parseAndRender(html, scope, { ...renderOptions, sync: true }));
      }
      _parsePartialFile(file, sync, currentFile) {
        return new Parser(this).parseFile(file, sync, LookupType.Partials, currentFile);
      }
      _parseLayoutFile(file, sync, currentFile) {
        return new Parser(this).parseFile(file, sync, LookupType.Layouts, currentFile);
      }
      _parseFile(file, sync, lookupType, currentFile) {
        return new Parser(this).parseFile(file, sync, lookupType, currentFile);
      }
      async parseFile(file, lookupType) {
        return toPromise(new Parser(this).parseFile(file, false, lookupType));
      }
      parseFileSync(file, lookupType) {
        return toValueSync(new Parser(this).parseFile(file, true, lookupType));
      }
      *_renderFile(file, ctx, renderFileOptions) {
        const templates = yield this._parseFile(file, renderFileOptions.sync, renderFileOptions.lookupType);
        return yield this._render(templates, ctx, renderFileOptions);
      }
      async renderFile(file, ctx, renderFileOptions) {
        return toPromise(this._renderFile(file, ctx, { ...renderFileOptions, sync: false }));
      }
      renderFileSync(file, ctx, renderFileOptions) {
        return toValueSync(this._renderFile(file, ctx, { ...renderFileOptions, sync: true }));
      }
      async renderFileToNodeStream(file, scope, renderOptions) {
        const templates = await this.parseFile(file);
        return this.renderToNodeStream(templates, scope, renderOptions);
      }
      _evalValue(str, scope) {
        const value = new Value(str, this);
        const ctx = scope instanceof Context ? scope : new Context(scope, this.options);
        return value.value(ctx);
      }
      async evalValue(str, scope) {
        return toPromise(this._evalValue(str, scope));
      }
      evalValueSync(str, scope) {
        return toValueSync(this._evalValue(str, scope));
      }
      registerFilter(name, filter2) {
        this.filters[name] = filter2;
      }
      registerTag(name, tag) {
        this.tags[name] = isFunction(tag) ? tag : createTagClass(tag);
      }
      plugin(plugin) {
        return plugin.call(this, _Liquid);
      }
      express() {
        const self = this;
        let firstCall = true;
        return function(filePath, ctx, callback) {
          if (firstCall) {
            firstCall = false;
            const dirs = normalizeDirectoryList(this.root);
            self.options.root.unshift(...dirs);
            self.options.layouts.unshift(...dirs);
            self.options.partials.unshift(...dirs);
          }
          self.renderFile(filePath, ctx).then((html) => callback(null, html), callback);
        };
      }
      async analyze(template2, options = {}) {
        return analyze(template2, options);
      }
      analyzeSync(template2, options = {}) {
        return analyzeSync(template2, options);
      }
      async parseAndAnalyze(html, filename, options = {}) {
        return analyze(this.parse(html, filename), options);
      }
      parseAndAnalyzeSync(html, filename, options = {}) {
        return analyzeSync(this.parse(html, filename), options);
      }
      /** Return an array of all variables without their properties. */
      async variables(template2, options = {}) {
        const analysis = await analyze(isString(template2) ? this.parse(template2) : template2, options);
        return Object.keys(analysis.variables);
      }
      /** Return an array of all variables without their properties. */
      variablesSync(template2, options = {}) {
        const analysis = analyzeSync(isString(template2) ? this.parse(template2) : template2, options);
        return Object.keys(analysis.variables);
      }
      /** Return an array of all variables including their properties/paths. */
      async fullVariables(template2, options = {}) {
        const analysis = await analyze(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(new Set(Object.values(analysis.variables).flatMap((a) => a.map((v) => String(v)))));
      }
      /** Return an array of all variables including their properties/paths. */
      fullVariablesSync(template2, options = {}) {
        const analysis = analyzeSync(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(new Set(Object.values(analysis.variables).flatMap((a) => a.map((v) => String(v)))));
      }
      /** Return an array of all variables, each as an array of properties/segments. */
      async variableSegments(template2, options = {}) {
        const analysis = await analyze(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(strictUniq(Object.values(analysis.variables).flatMap((a) => a.map((v) => v.toArray()))));
      }
      /** Return an array of all variables, each as an array of properties/segments. */
      variableSegmentsSync(template2, options = {}) {
        const analysis = analyzeSync(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(strictUniq(Object.values(analysis.variables).flatMap((a) => a.map((v) => v.toArray()))));
      }
      /** Return an array of all expected context variables without their properties. */
      async globalVariables(template2, options = {}) {
        const analysis = await analyze(isString(template2) ? this.parse(template2) : template2, options);
        return Object.keys(analysis.globals);
      }
      /** Return an array of all expected context variables without their properties. */
      globalVariablesSync(template2, options = {}) {
        const analysis = analyzeSync(isString(template2) ? this.parse(template2) : template2, options);
        return Object.keys(analysis.globals);
      }
      /** Return an array of all expected context variables including their properties/paths. */
      async globalFullVariables(template2, options = {}) {
        const analysis = await analyze(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(new Set(Object.values(analysis.globals).flatMap((a) => a.map((v) => String(v)))));
      }
      /** Return an array of all expected context variables including their properties/paths. */
      globalFullVariablesSync(template2, options = {}) {
        const analysis = analyzeSync(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(new Set(Object.values(analysis.globals).flatMap((a) => a.map((v) => String(v)))));
      }
      /** Return an array of all expected context variables, each as an array of properties/segments. */
      async globalVariableSegments(template2, options = {}) {
        const analysis = await analyze(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(strictUniq(Object.values(analysis.globals).flatMap((a) => a.map((v) => v.toArray()))));
      }
      /** Return an array of all expected context variables, each as an array of properties/segments. */
      globalVariableSegmentsSync(template2, options = {}) {
        const analysis = analyzeSync(isString(template2) ? this.parse(template2) : template2, options);
        return Array.from(strictUniq(Object.values(analysis.globals).flatMap((a) => a.map((v) => v.toArray()))));
      }
    };
    var version = "10.21.1";
    exports.AssertionError = AssertionError;
    exports.AssignTag = AssignTag;
    exports.BlockTag = BlockTag;
    exports.BreakTag = BreakTag;
    exports.CaptureTag = CaptureTag;
    exports.CaseTag = CaseTag;
    exports.CommentTag = CommentTag;
    exports.Context = Context;
    exports.ContinueTag = ContinueTag;
    exports.CycleTag = CycleTag;
    exports.DecrementTag = DecrementTag;
    exports.Drop = Drop;
    exports.EchoTag = EchoTag;
    exports.Expression = Expression;
    exports.Filter = Filter;
    exports.ForTag = ForTag;
    exports.Hash = Hash;
    exports.IfTag = IfTag;
    exports.IncludeTag = IncludeTag;
    exports.IncrementTag = IncrementTag;
    exports.InlineCommentTag = InlineCommentTag;
    exports.LayoutTag = LayoutTag;
    exports.Liquid = Liquid2;
    exports.LiquidError = LiquidError;
    exports.LiquidTag = LiquidTag;
    exports.Output = Output;
    exports.ParseError = ParseError;
    exports.ParseStream = ParseStream;
    exports.Parser = Parser;
    exports.RawTag = RawTag;
    exports.RenderError = RenderError;
    exports.RenderTag = RenderTag;
    exports.TablerowTag = TablerowTag;
    exports.Tag = Tag;
    exports.TagToken = TagToken;
    exports.Token = Token;
    exports.TokenizationError = TokenizationError;
    exports.Tokenizer = Tokenizer;
    exports.TypeGuards = typeGuards;
    exports.UndefinedVariableError = UndefinedVariableError;
    exports.UnlessTag = UnlessTag;
    exports.Value = Value;
    exports.Variable = Variable;
    exports.analyze = analyze;
    exports.analyzeSync = analyzeSync;
    exports.assert = assert;
    exports.createTrie = createTrie;
    exports.defaultOperators = defaultOperators;
    exports.defaultOptions = defaultOptions;
    exports.evalQuotedToken = evalQuotedToken;
    exports.evalToken = evalToken;
    exports.filters = filters;
    exports.isFalsy = isFalsy;
    exports.isTruthy = isTruthy;
    exports.tags = tags2;
    exports.toPromise = toPromise;
    exports.toValue = toValue;
    exports.toValueSync = toValueSync;
    exports.version = version;
  }
});

// bundles/liquid-entry.js
var import_liquidjs = __toESM(require_liquid_node(), 1);

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

// bundles/liquid-entry.js
var engine = new import_liquidjs.Liquid();
var template = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>{{ site.name }} - Modern Web Development Blog</title>\n  <meta name="description" content="{{ site.description }}">\n</head>\n<body>\n  <header>\n    <h1>{{ site.name }}</h1>\n    <nav>\n      <ul>\n        {% for item in site.navigation %}\n          <li><a href="{{ item.url }}">{{ item.name }}</a></li>\n        {% endfor %}\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class="hero">\n      <h2>Latest Blog Posts</h2>\n      <p>{{ site.description }}</p>\n    </section>\n\n    <section class="posts">\n      {% for post in posts %}\n        <article class="post {% if post.featured %}featured{% endif %}">\n          <header>\n            <h3><a href="/blog/{{ post.slug }}">{{ post.title }}</a></h3>\n            <div class="meta">\n              <span class="author">By {{ post.author.name }}</span>\n              <span class="date">{{ post.publishedAt | date: "%m/%d/%Y" }}</span>\n              <span class="category">{{ post.category }}</span>\n              <span class="read-time">{{ post.readTime }} min read</span>\n            </div>\n          </header>\n\n          <div class="excerpt">\n            <p>{{ post.excerpt }}</p>\n          </div>\n\n          <div class="tags">\n            {% for tag in post.tags %}\n              <span class="tag">#{{ tag }}</span>\n            {% endfor %}\n          </div>\n\n          <footer class="stats">\n            <span class="views">{{ post.views }} views</span>\n            <span class="likes">{{ post.likes }} likes</span>\n            <span class="comments">{{ post.comments }} comments</span>\n          </footer>\n        </article>\n      {% endfor %}\n    </section>\n\n    <nav class="pagination">\n      {% if hasPrevPage %}\n        {% assign prevPage = currentPage | minus: 1 %}\n        <a href="/blog?page={{ prevPage }}">Previous</a>\n      {% endif %}\n      <span>Page {{ currentPage }} of {{ totalPages }}</span>\n      {% if hasNextPage %}\n        {% assign nextPage = currentPage | plus: 1 %}\n        <a href="/blog?page={{ nextPage }}">Next</a>\n      {% endif %}\n    </nav>\n  </main>\n\n  <footer>\n    <p>&copy; {{ site.year }} {{ site.name }}. All rights reserved.</p>\n    <div class="social">\n      <a href="https://twitter.com/{{ site.social.twitter }}">Twitter</a>\n      <a href="https://github.com/{{ site.social.github }}">GitHub</a>\n      <a href="https://linkedin.com/{{ site.social.linkedin }}">LinkedIn</a>\n    </div>\n  </footer>\n</body>\n</html>\n';
var data = generateTemplateData();
function render() {
  return engine.parseAndRenderSync(template, data);
}
render();
export {
  render
};
