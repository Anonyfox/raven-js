# RavenJS SSG Example

**Content As Code** - Build static sites with pure JavaScript, no magic syntax to learn.

This example demonstrates how to create a static site generator using RavenJS building blocks. Each page is a JavaScript module that exports content data - familiar, powerful, and infinitely flexible.

## 🎯 Perfect For

- **Marketing sites** that need to look professional
- **Documentation** with rich components
- **Blogs** with custom layouts
- **Prototypes** that can evolve into full applications

## 🚀 Evolution Path

This isn't just a static site generator - it's your **growth path from static to full-stack**:

### 1. **Static Phase** (You Are Here)

- Pure HTML/CSS/JS output
- Markdown content with components
- Deploy to any CDN or static host
- Perfect for marketing, docs, blogs

### 2. **Interactive Phase**

- Add client-side JavaScript with **Reflex** signals
- Dynamic components that react to user input
- Form handling, animations, interactivity
- Still deployable to static hosts

### 3. **Dynamic Phase**

- Server-side logic with **Wings** routing
- API endpoints, database integration
- User authentication, real-time features
- Deploy to Cloudflare Workers, AWS Lambda

### 4. **Scale Phase**

- Full application with **Cortex** ML features
- Deploy to VPS with **Soar**
- Handle thousands of users
- Enterprise-ready architecture

**Same codebase. Same patterns. Seamless evolution.**

## 📁 Project Structure

```
src/
├── pages/              # Each page = folder + index.js
│   ├── home/
│   │   └── index.js    # Exports title, description, body
│   ├── about/
│   │   └── index.js    # Pure JavaScript, no magic
│   └── docs/
│       └── index.js    # Markdown + components
├── components/         # Reusable UI components
│   ├── layout.js       # Main HTML wrapper
│   ├── hero.js         # Landing page hero
│   └── code-block.js   # Syntax highlighted code
└── routes.js          # Central route mounting

public/                # Static assets
├── styles.css         # Modern, responsive CSS
└── favicon.ico        # Site icon

build.js              # Static site generation
boot.js               # Development server (shows what gets built)
```

## 🛠 Getting Started

```bash
# Install dependencies
npm install

# Start development server (auto-reload on changes)
npm run dev

# Visit http://localhost:3000
```

## 📝 Writing Content

### Pages as JavaScript Modules

Each page is a folder with an `index.js` that exports content data:

```javascript
// src/pages/about/index.js
import { md } from "@raven-js/beak";
import { MyComponent } from "../../components/my-component.js";

export const title = "About Us";
export const description = "Learn about our Content As Code approach";

export const body = md`
  # About Us

  We build **Content As Code** - no magic, just JavaScript.

  ${MyComponent({ data: "example" })}
`;
```

### Components in Markdown

Use Beak's tagged template literals to embed components naturally:

```javascript
const content = md`
# My Blog Post

Here's a code example:
${CodeBlock({
  language: "javascript",
  code: "const raven = signal('intelligent');",
})}

And a callout box:
${Callout({
  type: "tip",
  content: "This is pure JavaScript - no special syntax!",
})}
`;
```

### Central Route Mounting

Mount page data in `src/routes.js`:

```javascript
const routes = [
  { path: "/", page: "./pages/home/index.js" },
  { path: "/about", page: "./pages/about/index.js" },
];

// Dynamic imports with centralized processing
for (const route of routes) {
  router.get(route.path, async (ctx) => {
    const { title, description, body } = await import(route.page);
    const content = markdownToHTML(body);
    const page = Layout({ title, description, content });
    ctx.html(page);
  });
}
```

## 🏗 Building & Deployment

### Build Static Site

```bash
# Generate static HTML/CSS/JS
npm run build

# The dev server shows exactly what gets built!
npm run dev
```

### Deploy Anywhere

The built site works on any static host:

```bash
# Deploy to Cloudflare Workers with Soar
npx @raven-js/soar deploy --static ./dist --cf-workers my-site

# Or copy to any server
rsync -av dist/ user@server:/var/www/html/

# Or use any static hosting service
# Netlify, Vercel, GitHub Pages, etc.
```

## 🔧 Extending Your Site

### Add a New Page

1. Create page folder: `src/pages/contact/`
2. Add page data: `src/pages/contact/index.js`
3. Mount route in `src/routes.js`

```javascript
// src/pages/contact/index.js
export const title = "Contact Us";
export const description = "Get in touch with our team";

export const body = md`
  # Contact Us

  Reach out to us for any questions or support.
`;

// src/routes.js
// Add to routes array: { path: "/contact", page: "./pages/contact/index.js" }
```

### Create Components

Components are just functions that return HTML:

```javascript
// src/components/newsletter-signup.js
import { html } from "@raven-js/beak";

export const NewsletterSignup = ({ title = "Stay Updated" }) => {
  return html`
    <div class="newsletter">
      <h3>${title}</h3>
      <form action="/subscribe" method="post">
        <input type="email" placeholder="your@email.com" required />
        <button type="submit">Subscribe</button>
      </form>
    </div>
  `;
};
```

### Add Client-Side JavaScript

When you're ready for interactivity, add **Reflex** signals:

```javascript
// Add to your page
import { signal, computed, effect } from "@raven-js/reflex";

const count = signal(0);
const doubled = computed(() => count() * 2);

const content = md`
# Interactive Counter

<div id="counter">
  <p>Count: <span id="count">${count()}</span></p>
  <p>Doubled: <span id="doubled">${doubled()}</span></p>
  <button onclick="increment()">+1</button>
</div>

<script>
  // Client-side reactivity
  effect(() => {
    document.getElementById('count').textContent = count();
    document.getElementById('doubled').textContent = doubled();
  });

  function increment() {
    count.set(count() + 1);
  }
</script>
`;
```

## 🎨 Customization

### Styling

Edit `public/styles.css` for visual changes. The default theme uses:

- Modern CSS Grid and Flexbox
- Responsive design patterns
- CSS custom properties for theming
- Gradient backgrounds and shadows

### Layout

Modify `src/components/layout.js` to change:

- HTML structure
- Meta tags and SEO
- Navigation menu
- Footer content

### Build Process

Customize `build.js` to:

- Add more routes
- Configure asset optimization
- Add preprocessing steps
- Integrate with external APIs

## 🦅 Why RavenJS SSG?

### Content As Code

- **Familiar**: Every page is just JavaScript
- **Powerful**: Full programming language for content
- **Type-safe**: JSDoc annotations for intellisense
- **Testable**: Unit test your content logic

### Zero Dependencies

- **Secure**: No supply chain attacks
- **Stable**: No breaking changes from abandoned packages
- **Fast**: No bloated node_modules
- **Reliable**: Platform-native code that lasts

### Evolution Ready

- **Start simple**: Static HTML/CSS/JS
- **Add features**: Client-side interactivity
- **Go dynamic**: Server-side logic
- **Scale up**: Full application architecture

### RavenJS Integration

- **Beak**: Template engine with tagged literals
- **Wings**: Isomorphic routing (server + CLI)
- **Fledge**: Build system for static generation
- **Soar**: Deployment to any platform
- **Reflex**: Reactive signals for interactivity
- **Cortex**: ML features when you need them

## 📚 Learn More

- [RavenJS Documentation](https://docs.ravenjs.dev)
- [Beak Template Engine](https://docs.ravenjs.dev/beak)
- [Wings Routing](https://docs.ravenjs.dev/wings)
- [Fledge Build System](https://docs.ravenjs.dev/fledge)

## 🤝 Contributing

Found a bug or want to improve something?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Built with ❤️ using RavenJS - Content As Code**
