# HTML Components with Tagged Template Literals

Function components through simple composition with tagged template literals achieve significant JSX elegance without heavy runtime overhead. This approach leverages pure JavaScript function calls and the existing `html` tag's array flattening to create reusable, composable UI components with zero framework dependencies and superior performance characteristics.

Unlike JSX which requires transpilation and virtual DOM reconciliation, tagged literal components compile to optimized string concatenation with WeakMap template caching. The result: **~10x faster rendering** with identical developer ergonomics for component composition.

**Developer Experience Note**: While the code examples here appear as plain strings without syntax highlighting, the [RavenJS VS Code extension](../../plugins/vscode/README.md) provides full HTML syntax highlighting, IntelliSense, and auto-completion for all tagged template literals in VS Code, Cursor, and compatible editors—transforming the development experience without requiring any code changes.

## Tagged Template Foundations

### Basic Template Mechanics

The `html` tagged template literal processes interpolated values through specialized functions:

```javascript
import { html } from "@raven-js/beak/html";

// Basic interpolation
const greeting = html`<h1>Hello ${name}</h1>`;

// Array flattening (automatic)
const items = ["apple", "banana", "cherry"];
const list = html`<ul>
  ${items.map((item) => html`<li>${item}</li>`)}
</ul>`;
// → <ul><li>apple</li><li>banana</li><li>cherry</li></ul>
```

### Event Handler Binding

Functions in event attribute positions get automatically registered:

```javascript
function handleClick() {
  console.log("Button clicked");
}

const button = html`<button onclick=${handleClick}>Click me</button>`;
// → <button onclick="handleClick(event)">Click me</button>
```

### Performance Characteristics

- **Template Caching**: WeakMap-based memoization of compiled templates
- **Specialized Code Generation**: Different optimizations for 0, 1, 2-8, and 8+ interpolations
- **Zero Virtual DOM**: Direct string generation without reconciliation overhead
- **Minimal Memory Allocation**: Reuses cached template functions

## Basic Patterns

### Simple Components

Components are functions that return `html` tagged template literals:

```javascript
// Component definition
const Card = (title, className = "", children) => html`
  <div class="card ${className}">
    <h2>${title}</h2>
    <div class="content">${children}</div>
  </div>
`;

// Usage
const page = html`
  ${Card("Welcome", "featured", html`
    <p>This is the card content</p>
    <button onclick=${handleAction}>Action</button>
  `)}
`;
```

### Self-Closing Components

Components without children simply omit the children parameter:

```javascript
const Avatar = (src, alt, size = "medium") => html` <img class="avatar avatar-${size}" src="${src}" alt="${alt}" /> `;

// Usage
const profile = html`
  <div class="profile">
    ${Avatar("/images/user.jpg", "User Avatar", "large")}
    <h3>John Doe</h3>
  </div>
`;
```

### Multiple Children

Arrays automatically flatten, enabling multiple child elements:

```javascript
const Layout = (title, children) => html`
  <div class="layout">
    <header><h1>${title}</h1></header>
    <main>${children}</main>
  </div>
`;

// Usage with multiple children
const app = Layout("Dashboard", [
  html`<section class="stats">Statistics here</section>`,
  html`<section class="content">Main content</section>`,
  html`<section class="sidebar">Sidebar content</section>`,
]);
```

## Conditional Rendering

### Boolean Conditions

Use ternary operators or logical AND for conditional rendering:

```javascript
const Message = (type, text, isVisible) => html`
  ${isVisible ? html`<div class="message message-${type}">${text}</div>` : ""}
`;

// Alternative with logical AND
const Alert = (message, showAlert) => html` ${showAlert && html`<div class="alert">${message}</div>`} `;

// Usage
const notifications = html`
  ${Message("success", "Operation completed", hasSuccess)} ${Alert("Error occurred", hasError)}
`;
```

### Switch-like Patterns

Use functions or objects for multiple conditions:

```javascript
const StatusBadge = (status) => {
  const badges = {
    active: html`<span class="badge badge-green">Active</span>`,
    inactive: html`<span class="badge badge-gray">Inactive</span>`,
    pending: html`<span class="badge badge-yellow">Pending</span>`,
  };
  return badges[status] || html`<span class="badge">Unknown</span>`;
};

// Usage
const userList = html`
  ${users.map((user) => html`
    <div class="user">
      <span>${user.name}</span>
      ${StatusBadge(user.status)}
    </div>
  `)}
`;
```

## Lists and Mapping

### Basic List Rendering

Arrays map naturally to component lists:

```javascript
const TodoItem = (todo) => html`
  <li class="todo ${todo.completed ? "completed" : ""}">
    <input type="checkbox" ${todo.completed ? "checked" : ""} />
    <span>${todo.text}</span>
  </li>
`;

const TodoList = (todos) => html`
  <ul class="todo-list">
    ${todos.map((todo) => TodoItem(todo))}
  </ul>
`;

// Usage
const app = html`
  ${TodoList([
    { id: 1, text: "Learn RavenJS", completed: true },
    { id: 2, text: "Build components", completed: false },
  ])}
`;
```

### Indexed Mapping

Access array indices through map's second parameter:

```javascript
const NumberedList = (items) => html`
  <ol>
    ${items.map((item, index) => html`
      <li>
        <span class="number">${index + 1}.</span>
        <span class="content">${item}</span>
      </li>
    `)}
  </ol>
`;
```

### Nested Lists

Components compose naturally for complex data structures:

```javascript
const Category = (category) => html`
  <div class="category">
    <h3>${category.name}</h3>
    ${ProductList(category.products)}
  </div>
`;

const ProductList = (products) => html`
  <div class="products">
    ${products.map((product) => Product(product))}
  </div>
`;

const Product = (product) => html`
  <div class="product">
    <h4>${product.name}</h4>
    <p class="price">$${product.price}</p>
  </div>
`;
```

## Fragments and Grouping

### Automatic Fragment Behavior

Arrays flatten automatically, providing fragment-like behavior:

```javascript
const UserActions = (user) => [
  html`<button onclick=${() => editUser(user.id)}>Edit</button>`,
  html`<button onclick=${() => deleteUser(user.id)}>Delete</button>`,
  html`<button onclick=${() => viewProfile(user.id)}>Profile</button>`,
];

// Usage - array elements render as siblings
const userRow = html`
  <tr>
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td class="actions">${UserActions(user)}</td>
  </tr>
`;
```

### Conditional Fragments

Combine arrays with conditional logic:

```javascript
const AdminActions = (user, isAdmin) => [
  html`<button>View</button>`,
  html`<button>Edit</button>`,
  ...(isAdmin ? [html`<button>Delete</button>`, html`<button>Permissions</button>`] : []),
];
```

## Props Spreading and Composition

### Attribute Spreading

Use object destructuring and spread operators:

```javascript
const Button = (props, children) => {
  const { variant = "primary", size = "medium", ...attrs } = props;
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  return html` <button class="btn btn-${variant} btn-${size}" ${attrString}>${children}</button> `;
};

// Usage
const saveButton = Button({ variant: "success", disabled: true, "data-action": "save" }, "Save Changes");
```

### Component Composition

Higher-order functions create reusable component patterns:

```javascript
const withCard = (Component) => (title, props, children) =>
  html`
    <div class="card">
      <div class="card-header">
        <h3>${title}</h3>
      </div>
      <div class="card-body">${Component(props, children)}</div>
    </div>
  `;

const UserProfile = (user) => html`
  <div class="profile">
    <img src="${user.avatar}" alt="${user.name}" />
    <h4>${user.name}</h4>
    <p>${user.email}</p>
  </div>
`;

const CardedProfile = withCard(UserProfile);

// Usage
const profileCard = CardedProfile("User Profile", user);
```

## Event Handling

### Direct Event Binding

Functions in event attributes get automatic registration:

```javascript
const Counter = (count, onIncrement, onDecrement) => html`
  <div class="counter">
    <button onclick=${onDecrement}>-</button>
    <span class="count">${count}</span>
    <button onclick=${onIncrement}>+</button>
  </div>
`;

// Usage with event handlers
let count = 0;
const increment = () => {
  count++;
  render();
};
const decrement = () => {
  count--;
  render();
};

const app = () => html` ${Counter(count, increment, decrement)} `;
```

## Higher-Order Components

### Wrapper Components

Functions that enhance other components:

```javascript
const withLoading = (Component) => (isLoading, props, children) => {
  if (isLoading) {
    return html`<div class="loading">Loading...</div>`;
  }
  return Component(props, children);
};

const withError = (Component) => (error, props, children) => {
  if (error) {
    return html`<div class="error">Error: ${error.message}</div>`;
  }
  return Component(props, children);
};

// Compose multiple HOCs
const EnhancedUserList = withError(withLoading(UserList));

// Usage
const userSection = EnhancedUserList(error, isLoading, { users });
```

### Render Props Pattern

Functions as children for flexible composition:

```javascript
const DataProvider = (url, renderFn) => {
  // In a real app, this would fetch data
  const data = fetchData(url);
  const isLoading = !data;
  const error = null;

  return renderFn({ data, isLoading, error });
};

// Usage
const userPage = DataProvider("/api/users", ({ data, isLoading, error }) => {
  if (isLoading) return html`<div>Loading users...</div>`;
  if (error) return html`<div>Error: ${error.message}</div>`;

  return html`
    <div class="users">
      <h2>Users</h2>
      ${UserList(data)}
    </div>
  `;
});
```

## Named Children and Slots

### Multiple Named Sections

Pass different content areas as separate parameters:

```javascript
const Layout = (header, sidebar, main, footer) => html`
  <div class="layout">
    <header class="header">${header}</header>
    <div class="body">
      <aside class="sidebar">${sidebar}</aside>
      <main class="main">${main}</main>
    </div>
    <footer class="footer">${footer}</footer>
  </div>
`;

// Usage with named sections
const page = Layout(
  html`<nav>Navigation here</nav>`,
  html`<div>Sidebar content</div>`,
  html`<article>Main content</article>`,
  html`<p>&copy; 2024 Company</p>`
);
```

### Slot-like Patterns

Use objects for named content areas:

```javascript
const Modal = ({ title, actions }, children) => html`
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="close">&times;</button>
      </div>
      <div class="modal-body">${children}</div>
      <div class="modal-footer">${actions}</div>
    </div>
  </div>
`;

// Usage
const confirmDialog = Modal(
  {
    title: "Confirm Action",
    actions: html`
      <button onclick=${cancel}>Cancel</button>
      <button onclick=${confirm} class="primary">Confirm</button>
    `,
  },
  html`<p>Are you sure you want to delete this item?</p>`
);
```

## State and Reactivity

### No Built-in State Management

Beak focuses exclusively on templating and rendering. For state management and reactivity, use the dedicated `@raven-js/reflex` package:

```javascript
import { html } from "@raven-js/beak/html";
import { signal, computed, effect } from "@raven-js/reflex";

// Reactive state with Reflex
const count = signal(0);
const doubled = computed(() => count.value * 2);

const Counter = () => html`
  <div class="counter">
    <p>Count: ${count.value}</p>
    <p>Doubled: ${doubled.value}</p>
    <button onclick=${() => count.value++}>Increment</button>
  </div>
`;

// Auto-rerender on state changes
effect(() => {
  document.getElementById("app").innerHTML = Counter();
});
```

### Manual State Patterns

For simple cases, use plain JavaScript variables with manual re-rendering:

```javascript
let todos = [];

const addTodo = (text) => {
  todos.push({ id: Date.now(), text, completed: false });
  render();
};

const toggleTodo = (id) => {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.completed = !todo.completed;
  render();
};

const render = () => {
  document.getElementById("app").innerHTML = TodoApp(todos);
};

const TodoApp = (todos) => html`
  <div class="todo-app">
    <input type="text" id="new-todo" placeholder="Add todo..." />
    <button
      onclick=${() => {
        const input = document.getElementById("new-todo");
        addTodo(input.value);
        input.value = "";
      }}>
      Add
    </button>
    ${TodoList(todos)}
  </div>
`;
```

## Performance Considerations

### Template Caching

Templates are cached by their string signature, enabling efficient re-use:

```javascript
// This template is compiled once and cached
const UserCard = (user) => html`
  <div class="user-card">
    <h3>${user.name}</h3>
    <p>${user.email}</p>
  </div>
`;

// Multiple calls reuse the cached template function
users.map((user) => UserCard(user)); // Efficient
```

### Avoiding Re-compilation

Keep template strings stable to maximize cache hits:

```javascript
// Good - stable template string
const Button = (label, onClick) => html` <button onclick=${onClick}>${label}</button> `;

// Avoid - dynamic template strings break caching
const Button = (label, onClick, style) => html` <button onclick=${onClick} style="${style}">${label}</button> `;

// Better - use classes instead of inline styles
const Button = (label, onClick, className) => html` <button class="${className}" onclick=${onClick}>${label}</button> `;
```

### Memory Management

Components are pure functions with no lifecycle overhead:

- No virtual DOM nodes to garbage collect
- No component instances to track
- No subscription cleanup required
- Minimal memory footprint per component call

This approach delivers **surgical precision** in both performance and developer experience—achieving JSX-like component composition through pure JavaScript functions with zero framework overhead.
