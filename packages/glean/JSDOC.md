# The JSDoc Specification for Modern JavaScript

**Author:** Maximilian Stroh (max@anonyfox.com)

## Introduction

JSDoc is an open-source documentation standard and generator for JavaScript that uses specially formatted comments to document code. By annotating code with JSDoc comments, developers can describe the purpose of functions, classes, parameters, return values, and more, which can then be used to automatically generate HTML documentation or provide rich hints in IDEs.

Unlike a formal language specification, there is no single official spec document for JSDoc; instead, the community relies on the official documentation (jsdoc.app) and broadly agreed conventions. Modern JSDoc (currently JSDoc 3.x) supports ES2015+ language features and a wide variety of tags to describe different aspects of code.

This document consolidates information from official JSDoc documentation and community sources, serving as a comprehensive specification of JSDoc syntax, tags, and usage in practice.

## JSDoc Comment Syntax

A JSDoc comment is a multi-line comment that begins with `/**` and ends with `*/` (note the double asterisk at start). These comments should be placed immediately before the JavaScript code element they describe (such as a function, class, or variable). For example:

```javascript
/**
 * Adds two numbers together.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of a and b.
 */
function add(a, b) {
  return a + b;
}
```

Inside a JSDoc comment, you can write a free-form description followed by structured annotations called tags. Each tag starts with an `@` at the beginning of a line (these are called block tags). Optionally, you can also include inline tags, which are written in the middle of descriptions enclosed in `{...}` braces.

For instance, `{@link SomeClass}` can be used within a description to link to another class or URL. JSDoc expects each block tag to be on its own line (separated by line breaks). Inline tags, on the other hand, are written inside descriptions and enclosed in braces, and do not require a new line.

Block tags provide metadata about your code (parameters, returns, authorship, etc.), while inline tags usually embed links or references within descriptions. In general usage, the top of a JSDoc comment contains a brief summary of what is being documented, followed by any number of `@` tags each on separate lines, each supplying additional information.

## Type Annotations in JSDoc

One of JSDoc's core features is the ability to specify types for variables, parameters, and return values using a type annotation inside curly braces `{}`. JSDoc's type expression syntax is based on the Google Closure Compiler type system, with some additions specific to JSDoc. In practice, this means JSDoc supports a rich variety of type notations:

### Simple Types

You can specify basic types like `{number}`, `{string}`, `{boolean}`, or even reference a class or namespace like `{MyNamespace.MyClass}`. If the symbol is documented, JSDoc will automatically link to its documentation.

### Union Types

Use the pipe character to indicate a value that can be one of multiple types. For example, `{(number|boolean)}` means the value can be a number or a boolean.

### Array Types

There are two equivalent syntaxes for arrays. You can use Java-style generics notation, e.g. `{Array.<string>}`, or the shorthand Type[] syntax, e.g. `{string[]}`, to indicate "array of string".

### Object Types

You can describe object shapes. For example, `{Object.<string, number>}` means an object with string keys and number values. To describe a specific object with known properties, you can use a record type: e.g. `{{a: number, b: string}}` describes an object with property a (number) and b (string). You may document each property separately with `@property` tags for more detail.

### Nullable and Non-nullable

Prefix a type with `?` to indicate it may also be null (e.g. `?number` is number or null). Prefix with `!` to indicate it can never be null (e.g. `!Object` for a non-null object).

### Any Type

The asterisk `*` denotes a value of any type (unspecified type).

### Unknown Type

The name `?` by itself can denote an unknown type.

### Rest (Varargs) Parameters

Prefix the type with `...` to indicate a variable number of arguments of that type. For example, `@param {...string} args` means the function can take an arbitrary number of string arguments.

### Optional Parameters

To mark a parameter as optional, you can either enclose its name in brackets or suffix the type with `=`. For example, `@param {string} [username]` or equivalently `@param {string=} username` marks username as optional. If there's a default value, you can indicate it inside the brackets: e.g. `@param {string} [username="guest"]` means the default is "guest".

### Function Types

You can describe function types in a type expression using either Closure syntax or arrow syntax. For example, `{function(string, boolean): number}` or `{(s: string, b: boolean) => number}` would represent a function that takes a string and boolean and returns a number.

### Callback Types

For reusable callback signatures, JSDoc provides the `@callback` tag. You define a named function type with `@callback` and then reference it as a type in other tags.

### Promise and Other Complex Types

Since JSDoc type expressions accept almost any Closure Compiler syntax, you can also use generics like `Promise<string[]>` to mean a Promise that resolves to an array of strings, or even more advanced types (e.g. record types with function properties, etc.). JSDoc is generally flexible in interpreting types, and since version 3.2 it has full support for Google Closure Compiler type expressions.

In summary, type annotations in JSDoc are written inside `{}` and can express complex type information. If JSDoc encounters an invalid type expression, it will error out (or warn in lenient mode), so it's important to follow the correct syntax. These type annotations improve documentation and can be leveraged by IDEs and tools for type checking and autocompletion.

## Block Tags Reference

Block tags are the primary tags that appear at the start of a line in a JSDoc comment (after the leading `*`). They provide structured meta-information about the code element being documented. Below is a comprehensive list of JSDoc block tags, their meaning, usage, and status.

### @abstract (alias: @virtual)

**Description:** Indicates that a class member (often a method) is abstract and must be implemented (overridden) by a subclass. In other words, the base implementation is incomplete. This tag is official in JSDoc.

**Usage:** Used mainly when documenting abstract classes or interfaces. It's not very common unless you are explicitly marking abstract methods in a framework.

```javascript
/** @abstract */
class Animal {
  constructor(name) {
    this.name = name;
  }
  /** @abstract */
  speak() {} // intended to be overridden by subclasses
}
```

### @access

**Description:** Sets an explicit access level for a member: private, package (package-private), public, or protected. This tag is official, but often optional because JSDoc infers access from tags like `@private` or `@public`.

**Usage:** Rarely used directly. Instead, developers more commonly use `@private`, `@protected`, or `@public` tags to control access level.

```javascript
/**
 * @access protected
 * This method is only for subclasses to use.
 */
function internalMethod() { … }
```

### @alias

**Description:** Treats a documented symbol as if it had a different name (the alias). In other words, it aliases one name to another. This is an official tag.

**Usage:** Uncommon. `@alias` is used in cases where you want documentation generated under a new name or when a symbol is externally known by another name.

```javascript
/**
 * @alias MyLibrary.SuperFunc
 * @function SuperFunc
 */
function reallyLongInternalName() { … }
```

### @async

**Description:** Marks a function as asynchronous. This is official (added for ES2017 async functions).

**Usage:** Occasionally used to explicitly indicate an async function in documentation, though many documentation generators/IDEs infer async from the `async function` syntax.

```javascript
/** @async */
async function fetchData() { … }
```

### @augments (alias: @extends)

**Description:** Indicates that a class (or constructor function) augments (subclasses or inherits from) a parent class. This tag is official. It's used to document classical inheritance relationships.

**Usage:** Common in class-based inheritance. With ES2015 class extends syntax, JSDoc still requires an `@augments` (or `@extends`) tag to know the parent class for documentation.

```javascript
/**
 * @class
 * @augments Animal
 */
class Dog extends Animal {
  …
}
```

### @author

**Description:** Documents the author of a piece of code. Usually contains a name and/or contact. Official tag.

**Usage:** Often used at the top of a file or for a class to give credit or contact info for the code's author.

```javascript
/**
 * @author Jane Doe <jane.doe@example.com>
 * @author John Smith
 */
```

### @borrows

**Description:** Allows one symbol's documentation to include (borrow) documentation from another symbol. Essentially, it inserts docs for "that" object into "this" one. Official tag.

**Usage:** Very niche. Used when you have two references to the same thing and want to avoid duplicating documentation.

```javascript
/**
 * @namespace util
 * @borrows trimString as util.trim  // Borrow docs from trimString() into util.trim
 */
const util = {
  trim: trimString
};

/** Removes whitespace from a string. */
function trimString(str) { … }
```

### @callback

**Description:** Documents a callback function - a function that will be called by another function. This is typically used to define reusable function signatures.

**Usage:** Common when documenting APIs that accept callback functions. Helps define the expected signature of callbacks.

```javascript
/**
 * @callback requestCallback
 * @param {string} responseText
 */

/**
 * @param {requestCallback} callback
 */
function makeRequest(callback) { … }
```

### @class (alias: @constructor)

**Description:** Indicates that a function should be treated as a class constructor. Marks that the function is intended to be called with `new`. Official tag.

**Usage:** Before ES2015, `@class` was used to document constructor functions as classes. In modern ES2015+ code with the `class` keyword, you do not need to use `@class` since JSDoc automatically recognizes class declarations.

```javascript
/**
 * @class
 * @param {string} name
 */
function Person(name) {
  this.name = name;
}
```

### @classdesc

**Description:** Provides a description for an entire class, separate from constructor description. You put `@classdesc` in the class's JSDoc comment followed by a detailed description text. Official tag.

**Usage:** Occasionally used to give a longer description of a class's purpose, especially if the initial brief description line is short.

```javascript
/**
 * @classdesc A utility class for performing advanced math operations.
 * @class
 */
class MathUtil { … }
```

### @constant (alias: @const)

**Description:** Marks a variable as a constant value. Typically used for constants (especially before `const` keyword existed). Official tag.

**Usage:** Can be used in combination with `@type` to indicate a constant of a certain type. With modern JavaScript's `const` keyword, JSDoc `@constant` is somewhat redundant, but still used to clarify that a property or member should not change.

```javascript
/** @constant @type {number} */
const MAX_LIMIT = 100;
```

### @constructs

**Description:** Indicates that a function is the constructor for the preceding `@class` tag. In other words, it ties a function to a class name when documenting separate from the class definition. Official tag.

**Usage:** Rare. Typically used in scenarios where you declare `@class` in one comment and use `@constructs` on the constructor function that comes afterward.

```javascript
/** @class MyNamespace.Foo */
var Foo = {};  // declare a class in a namespace
/** @constructs MyNamespace.Foo */
function FooConstructor() { … }
```

### @copyright

**Description:** Documents copyright information for a piece of code. Official tag.

**Usage:** Often appears in file header comments to state copyright and license info. It's purely informational and doesn't affect code parsing.

```javascript
/**
 * @copyright 2025 Acme Corp. All rights reserved.
 */
```

### @default (alias: @defaultvalue)

**Description:** Documents the default value for a variable or a function parameter. Official tag.

**Usage:** Commonly used in conjunction with `@param` to indicate a parameter's default. Also used for documenting default values of options or settings.

```javascript
/**
 * @param {number} timeout - Timeout in seconds.
 * @default 30
 */
function connect(timeout = 30) { … }
```

### @deprecated

**Description:** Marks a function, method, class, or other item as deprecated, indicating it should no longer be used. You typically include a note about alternatives or the version since when it's deprecated. Official tag.

**Usage:** Very common for API documentation. When an API or function is being phased out, `@deprecated` is used to warn developers.

```javascript
/**
 * @deprecated since v2.0. Use newMethod() instead.
 */
function oldMethod() { … }
```

### @description (alias: @desc)

**Description:** Provides a description for a symbol. It can be used to explicitly start the description section. In practice, any text at the top of a JSDoc comment without a tag serves as the description, so `@description` is optional. Official tag.

**Usage:** Not very common to see explicitly, because most developers just write the description as plain text.

```javascript
/**
 * @description This utility function performs complex calculation.
 * @param {number} x
 * @returns {number}
 */
function compute(x) { … }
```

### @enum

**Description:** Documents an enumeration: a collection of related static properties (often constants) under an object. Official tag. When `@enum` is used on an object, JSDoc treats the object as an enum container of values.

**Usage:** Common for documenting sets of constants.

```javascript
/**
 * @enum {number}
 */
const Color = {
  RED: 1,
  GREEN: 2,
  BLUE: 3,
};
```

### @event

**Description:** Marks an object as an event, typically used in frameworks where events are documented as their own entities. Official tag.

**Usage:** When documenting events (for example, Node.js or browser events, or custom events in an event-driven system), you use `@event` to indicate that a documented name is an event.

```javascript
/**
 * @event connectionOpened
 * @description Fires when the connection is established.
 */
```

### @example

**Description:** Provides an example snippet demonstrating how to use the item being documented. Official tag. The content following `@example` is typically treated as code (often preserved formatting).

**Usage:** Very common. Including usage examples is a best practice for documentation. The tag may appear multiple times to show multiple examples.

```javascript
/**
 * @example <caption>Basic usage</caption>
 * const result = add(2, 3);
 * console.log(result); // 5
 */
```

### @exports

**Description:** Identifies the object that is the export of a module. In a file documenting a module, `@exports Name` can tag a variable as the thing being exported. Official tag.

**Usage:** Used in module-oriented code (CommonJS or similar) to indicate which object is the module's exported value.

```javascript
/**
 * @module myModule
 * @exports MyClass
 */
class MyClass { … }
```

### @external (alias: @host)

**Description:** Documents an external class or namespace that may not be part of your source code. Official tag. Often used to include references to built-in objects or external libraries so they can be linked in documentation.

**Usage:** Occasionally used when you want to integrate external APIs into your docs.

```javascript
/**
 * @external ExternalLib
 * @see http://externallib.js.org/docs
 */
```

### @file (aliases: @fileoverview, @overview)

**Description:** Provides documentation for an entire file. Typically used at the top of a file's JSDoc comment to describe what the file contains or its purpose. Official tag.

**Usage:** Common in project files to give a high-level overview.

```javascript
/**
 * @file This module handles user authentication logic.
 * (Other tags like @author or @copyright can go here.)
 */
```

### @fires (alias: @emits)

**Description:** Describes an event that a function fires (emits) during its operation. Official tag. This is used to document that calling a function may trigger certain events.

**Usage:** Common in event-driven code.

```javascript
/**
 * Save the document.
 * @fires Document#saved
 */
Document.prototype.save = function() { … }
```

### @function (aliases: @func, @method)

**Description:** Explicitly marks a symbol as a function or method. Official tag. Normally, JSDoc infers functions, but you might use `@function` in cases where inference is tricky or to document a function literal assigned to a variable.

**Usage:** Sometimes used when a function is defined in a non-standard way and you need to force JSDoc to treat it as a function.

```javascript
/** @function */
const doThing = function() { … };
```

### @generator

**Description:** Marks a function as a generator (i.e., uses `function*` or yields). Official tag.

**Usage:** Optional, since JSDoc can often tell a generator by the `function*` syntax.

```javascript
/** @generator */
function* idMaker() { … }
```

### @global

**Description:** Marks an item as global, meaning it lives in the global scope. Official tag.

**Usage:** Used when documenting global variables or functions, especially if JSDoc might otherwise assign them to a namespace or module.

```javascript
/** @global */
function globalUtility() { … }
```

### @hideconstructor

**Description:** When used on a class, this tag hides the constructor from documentation output. Official tag.

**Usage:** Useful if a class's constructor is not meaningful to the end-user of the docs.

```javascript
/**
 * @class
 * @hideconstructor
 */
class Singleton { constructor() { … } }
```

### @ignore

**Description:** Instructs JSDoc to ignore this item and omit it from documentation. Official tag.

**Usage:** Commonly used to hide internal or deprecated items from the generated docs without removing the code or comment.

```javascript
/** @ignore */
function internalHelper() { … }
```

### @implements

**Description:** Indicates that a class implements an interface. Official tag. It's typically used to note that a class provides all members of an interface.

**Usage:** Occasionally used in JS (more common in TS). If you define an interface with `@interface`, classes can use `@implements InterfaceName`.

```javascript
/**
 * @interface Database
 * @property {function(): void} connect
 */

/**
 * @implements Database
 */
class MyDatabase { connect() { … } }
```

### @inheritdoc

**Description:** Indicates that this documentation should be inherited from the parent class or a specified source. Official tag. Using `@inheritdoc` will copy documentation from the overridden parent method so you don't have to repeat it.

**Usage:** Useful when overriding methods in subclasses that don't need new documentation.

```javascript
/** @inheritdoc */
ChildClass.prototype.method = function() { … }
```

### @inner

**Description:** Marks a symbol as an inner member, i.e., a member of its parent that is not exposed publicly. Often used for members defined inside a constructor or within a closure. Official tag.

**Usage:** Useful for complex documentation where you want to distinguish between inner (internal) members and outer (public) ones.

```javascript
function Outer() {
  /**
   * @inner
   * @memberof Outer
   */
  function helper() { … }
}
```

### @instance

**Description:** Marks a member as an instance member (as opposed to static). JSDoc normally infers this, but the tag can explicitly mark it. Official tag.

**Usage:** Rarely needed explicitly, because context usually determines if something is an instance member.

```javascript
/** @instance */
this.instanceVar = 42;
```

### @interface

**Description:** Declares that a symbol is an interface (a purely abstract definition of methods/properties). Official tag. When you mark a function or object with `@interface`, it tells JSDoc this is an interface that can be implemented by classes.

**Usage:** Sometimes used in large codebases to define formal interfaces in JS.

```javascript
/**
 * @interface
 */
function Serializable() {
  /** @function */
  this.serialize = function () {};
}
```

### @kind

**Description:** Specifies the kind of symbol being documented (such as class, function, member, etc.). Official tag. Similar to `@class` or `@function`, but a more general way to override JSDoc's automatic kind inference.

**Usage:** Rare. Most use specific tags (`@function`, `@member`, etc.) rather than `@kind`.

```javascript
/** @kind function */
const doStuff = () => { … };
```

### @lends

**Description:** Lends properties of an object literal to a specific constructor or namespace, as if they were defined as members of that constructor/namespace. Official tag.

**Usage:** Niche. Often used in older patterns where you do something like `MyClass.prototype = { ... }` and want to attribute those properties to `MyClass.prototype` in documentation.

```javascript
/** @lends MyClass.prototype */
const MyClassMethods = {
  /** @function */
  doA() { … },
  /** @function */
  doB() { … }
};
```

### @license

**Description:** States the software license for the code. Official tag. Usually contains a license name or text.

**Usage:** Common in open-source projects at the top of files or in library headers.

```javascript
/** @license MIT */
```

### @listens

**Description:** Lists an event that a given class or object listens for (as opposed to fires). Official tag. Useful to indicate that an object is expecting or reacting to certain events.

**Usage:** Not very common, but when documenting event handling components, it can be used to show which events from other sources the component listens to.

```javascript
/**
 * @listens User#login
 */
class SessionManager { … }
```

### @member (alias: @var)

**Description:** Documents a member variable—generally a standalone variable or an object property. Official tag. Use this to indicate a documented item is a member (property) and not a function or class.

**Usage:** Often used when documenting plain object properties or static class properties, especially if you want to provide a type.

```javascript
/** @member {string} */
MyClass.prototype.title = "";
```

### @memberof

**Description:** Specifies that a symbol belongs to a particular parent (namespace, class, etc.). Official tag. This is used to manually attach a function/var to an object's documentation hierarchy when it's not implicitly clear.

**Usage:** Common in cases where the code structure doesn't easily reveal ownership.

```javascript
/**
 * @function
 * @memberof MyClass
 */
function helper() { … }
MyClass.prototype.helper = helper;
```

### @mixes

**Description:** Indicates that an object mixes in all the members from another object. Official tag. It's used to show a mixin relationship where one class includes functionality from another without formal inheritance.

**Usage:** Fairly niche, but used in frameworks that employ mixins.

```javascript
/**
 * @class
 * @mixes CanFly
 */
function Bird() { … }
```

### @mixin

**Description:** Documents a mixin object – essentially a collection of methods/properties intended to be used by other classes (through copying or augmentation). Official tag.

**Usage:** Used to define a set of behaviors as a mixin so that other classes can `@mixes` it.

```javascript
/**
 * @mixin CanFly
 */
const CanFly = {
  /** @function */
  fly() {
    console.log("Flying");
  },
};
```

### @module

**Description:** Marks a file or variable as a JavaScript module, usually documenting a module export. Official tag. When used, it typically goes at the top of a file to signify "this file is a module named X".

**Usage:** Common in Node.js or ES Module code to name modules.

```javascript
/** @module utils/math */
```

### @name

**Description:** Specifies the name of a symbol being documented explicitly. Official tag. Normally JSDoc figures out the name from code, but `@name` can override or set it when the code alone is ambiguous.

**Usage:** Occasionally used to document properties that aren't explicitly named in code.

```javascript
/**
 * @name MyLibrary#event:ready
 * @event
 */
```

### @namespace

**Description:** Marks an object as a namespace, a container of properties or other symbols. Official tag. Use this for plain objects that serve as namespaces for a set of related functions or constants.

**Usage:** Fairly common in older JS or non-module code where global namespaces are used.

```javascript
/** @namespace MyApp.Utils */
MyApp.Utils = {
  doThing() { … }
};
```

### @override

**Description:** Indicates that a method overrides a parent class method of the same name. Official tag. This is mostly for documentation clarity; some tools might warn if no parent method exists.

**Usage:** Often used in class inheritance.

```javascript
/** @override */
ChildClass.prototype.someMethod = function() { … }
```

### @package

**Description:** Marks a symbol as package-private (accessible only within its module/package). Official tag. This is akin to a "default" visibility – not public, not truly private, but internal to a package.

**Usage:** Rare in practice, since JavaScript doesn't have a built-in package privacy concept like Java.

```javascript
/** @package */
function internalFunction() { … }
```

### @param (aliases: @arg, @argument)

**Description:** Documents a function parameter: its type, name, and description. Official tag. The syntax is `@param {Type} name description`. If the parameter is optional, include it in square brackets.

**Usage:** Very common. This is one of the most frequently used tags in JSDoc. Every function with parameters typically has an `@param` for each parameter.

```javascript
/**
 * @param {string} message - The message to print.
 * @param {number} [count=1] - Number of times to print (optional, default 1).
 */
function printMessage(message, count) { … }
```

### @private

**Description:** Marks a symbol as private, meaning it's intended for internal use and not part of the public API. Official tag. JSDoc will by default omit `@private` items from public documentation.

**Usage:** Very common in large codebases to hide internal functions or methods.

```javascript
/** @private */
function helperFunction() { … }
```

### @property (alias: @prop)

**Description:** Documents a property of an object (especially for object literals or record types). Official tag. Often used in combination with `@typedef` or `@param` when an object has known properties.

**Usage:** Common when documenting object literals or configuration objects with specific fields.

```javascript
/**
 * @typedef {Object} Options
 * @property {string} url - The URL to connect to.
 * @property {number} timeout - Timeout in ms.
 */
```

### @protected

**Description:** Marks a symbol as protected, meaning it's intended for use only by the class itself and its subclasses. Official tag. Similar effect to `@private` in documentation, but indicates a different level of intended access.

**Usage:** Occasionally used in frameworks or libraries to indicate that a method is not public API but is available to subclasses.

```javascript
/** @protected */
MyClass.prototype.helperMethod = function() { … }
```

### @public

**Description:** Marks a symbol as public, explicitly indicating it's part of the public API. Official tag. By default, everything not marked private/protected is public, so this tag is usually redundant.

**Usage:** Not commonly needed to specify because public is the default.

```javascript
/** @public */
this.someProperty = 42;
```

### @readonly

**Description:** Marks a property as read-only (should not be reassigned). Official tag. Used for constants on instances or static properties that should not change after initialization.

**Usage:** Moderately used. Often appears with `@property` or `@member` to indicate that once set, the value shouldn't be changed.

```javascript
/** @member {number} @readonly */
MyClass.prototype.id = 0;
```

### @requires

**Description:** Indicates that a file or symbol requires an external module or script. Official tag. Often used at file level to denote dependencies.

**Usage:** Could be used to document that you expect a certain global or module.

```javascript
/** @requires ./polyfill.js */
```

### @returns (alias: @return)

**Description:** Documents the return value of a function – its type and description. Official tag. It can appear as `@return {Type} description`.

**Usage:** Very common. Virtually every function that returns a value should have a `@return`/`@returns` tag describing what is returned.

```javascript
/** @returns {boolean} True if the operation succeeded. */
function save() { … }
```

### @see

**Description:** Provides a reference or link to related information. Official tag. You can use it to point to another function, website, or documentation page that is relevant.

**Usage:** Common in thorough documentation. Useful for cross-referencing.

```javascript
/** @see OtherClass#method */
```

### @since

**Description:** Indicates the version or time since which this item has been available. Official tag. Typically you include a version number or date.

**Usage:** Common in library documentation to mark when a function or feature was added.

```javascript
/** @since 1.0.0 */
function newFeature() { … }
```

### @static

**Description:** Marks a member as static (not tied to an instance, but rather to the class or constructor). Official tag. JSDoc can infer static for many cases, but this tag can enforce it.

**Usage:** Commonly used in class docs to ensure clarity that a property or method is static.

```javascript
/** @static */
MyClass.initialize = function() { … }
```

### @summary

**Description:** Provides a short summary for a symbol, which can be used in overviews or listings. Official tag. Typically a one-line summary separate from the fuller description.

**Usage:** Not very common in practice. Some doc generators might use `@summary` if provided.

```javascript
/**
 * @summary Briefly does something important.
 * @description This function performs a very long operation...
 */
function doImportantThing() { … }
```

### @this

**Description:** Specifies what the JavaScript `this` refers to within a function. Official tag. Useful when a function is not a method of an object, but you want to document the expected context.

**Usage:** Somewhat uncommon, but when needed it's crucial.

```javascript
/**
 * @this {XMLHttpRequest}  // within this function, `this` is an XHR object
 */
function onXhrLoad() { … }
```

### @throws (alias: @exception)

**Description:** Documents the exceptions or errors a function might throw. Official tag. Typically you mention the type of error and in the description explain the circumstances.

**Usage:** Fairly common in robust APIs. If a function can throw (or rejects a promise), listing it with `@throws {ErrorType}` helps users handle errors.

```javascript
/** @throws {TypeError} If the input is not valid JSON. */
function parseJson(str) { … }
```

### @todo

**Description:** Lists a "to do" item – some task or enhancement related to the code. Official tag. Often used as internal notes in documentation to mark things that need fixing or improving in the future.

**Usage:** Common as informal documentation comments. It doesn't affect code; it's for developers.

```javascript
/** @todo Refactor this function for better performance. */
```

### @tutorial

**Description:** Inserts a link to an external or additional documentation tutorial file. Official tag. Usually used to tie in longer form guides or explanations that are separate from the API docs.

**Usage:** Occasionally used in projects that maintain separate tutorial markdown files.

```javascript
/** @tutorial getting-started */
```

### @type

**Description:** Documents the type of a variable, property, or constant. Official tag. For example, on a standalone variable or class property, `@type {Type}` specifies what type it is.

**Usage:** Very common for global variables, constants, or class fields. Also used in `@typedef` to define the structure of a custom type.

```javascript
/** @type {HTMLElement} */
let containerElement;
```

### @typedef

**Description:** Defines a custom type name (typedef = "type definition"). Official tag. Often used to create an alias for a complex object type or function signature, so it can be referenced by name elsewhere.

**Usage:** Common in JSDoc-heavy codebases to describe object literals or configuration objects in detail.

```javascript
/**
 * @typedef {Object} Config
 * @property {string} url
 * @property {number} retryCount
 */
```

### @variation

**Description:** Distinguishes between multiple documented objects that have the same name. Official tag. It allows you to document overloaded functions or similar names by giving them variation identifiers.

**Usage:** Rare. Mostly used if you have two functions or methods named the same in the same scope.

```javascript
/**
 * @function
 * @variation 1
 */
function foo(x) { … }

/**
 * @function
 * @variation 2
 */
function foo(x, y) { … }
```

### @version

**Description:** Documents the version number of an item or the project. Official tag. Usually a semantic version string or other identifier.

**Usage:** Often found in file headers or main library classes to indicate the version of the API or module.

```javascript
/** @version 3.2.1 */
```

### @yields (alias: @yield)

**Description:** Documents the value that a generator function yields (i.e., the type of values produced by an iterator). Official tag. Similar to `@returns`, but for generator yield values.

**Usage:** Used when documenting generator functions to specify what type of values come out when the generator is iterated.

```javascript
/** @yields {number} An incrementing counter value on each yield. */
function* counter() { … }
```

## Inline Tags

Inline tags are written inside curly braces within descriptions or other tag texts, and allow linking or formatting within JSDoc comments. They always start with `@` and are enclosed in `{}` so they can be distinguished from normal text. Here are the standard inline tags in JSDoc:

### {@link} (aliases: {@linkcode}, {@linkplain})

**Description:** Inserts a hyperlink to another symbol in the documentation or an external URL. The basic `{@link SomeSymbol}` will link to the documentation for SomeSymbol. You can also provide custom link text. `{@linkplain}` is the same as `@link` but forces the link to be rendered in plain text font (no monospace), whereas `{@linkcode}` forces the link text to be in code (monospace) style.

**Usage:** Very common inside descriptions to reference other classes, methods, or external docs without breaking the flow.

```javascript
/**
 * See {@link MyClass#methodName} for details.
 * For configuration options, visit {@link https://example.com|the docs}.
 */
```

### {@tutorial}

**Description:** Links to a documentation tutorial by name. Works similarly to `{@link}`, but specifically for linking to tutorial pages that are part of the JSDoc build.

**Usage:** Less common unless the project has separate tutorial files.

```javascript
/** {@tutorial getting-started} */
```

## Additional Community Tags (Unofficial Extensions)

Beyond the official JSDoc tags listed above, the JavaScript community has introduced a few unofficial tags that are not part of JSDoc 3's core but are used in certain contexts (e.g., Google Closure Compiler, TypeScript, or IDE support).

### @template

**Description:** Defines generic type parameters for functions or classes (similar to generics in TypeScript). This tag is not part of the official JSDoc 3 tags – it originated in the Google Closure Compiler JSDoc annotations and has been adopted by some tools and editors for type checking.

**Status:** Unofficial. JSDoc3 will generally ignore `@template` tags (they won't appear in output by default), but TypeScript and some IDEs understand them for providing generics support.

**Usage:** Increasingly used in JS codebases that want static analysis benefits.

```javascript
/**
 * @template T
 * @param {T} x - A value of any type.
 * @returns {T} The same value that was passed in.
 */
function identity(x) {
  return x;
}
```

## Conclusion

This specification has outlined the full range of JSDoc tags and syntax used in modern JavaScript development. It merges the official JSDoc documentation with common community practices to provide a one-stop reference. From the basics of writing JSDoc comments to detailed tag usage, types, and even niche tags, it covers everything needed to understand and parse JSDoc.

JSDoc remains a powerful way to create maintainable code documentation and even to provide type information in JavaScript (especially when not using TypeScript). By adhering to these conventions and tags, tool builders can accurately parse documentation comments and developers can ensure their code is well-documented for any reader or tool consuming it.
