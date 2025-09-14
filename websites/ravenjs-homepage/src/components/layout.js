/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Main layout component - wraps all pages with HTML structure
 */

import { author, canonical, html, openGraph, twitter } from "@raven-js/beak/html";

/**
 * Main layout component
 * @param {Object} props - Layout properties
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description for meta tags
 * @param {string} props.content - Page content HTML
 * @returns {string} Complete HTML document
 */
export const Layout = ({ title, description, content }) => {
  // Generate social media meta tags
  const authorMeta = author({
    name: "Maximilian Stroh",
    email: "max@anonyfox.com",
    organization: "Anonyfox e. K.",
    website: "https://anonyfox.com",
    profiles: {
      github: "https://github.com/Anonyfox",
      twitter: "https://twitter.com/AnonyfoxCom",
      website: "https://anonyfox.com",
    },
  });

  const canonicalMeta = canonical({
    domain: "ravenjs.dev",
    path: "/",
  });

  const openGraphMeta = openGraph({
    title,
    description,
    domain: "ravenjs.dev",
    url: "/",
    siteName: "RavenJS",
    type: "website",
    image: {
      url: "/raven-logo.webp",
      alt: "RavenJS Logo - Zero-dependency toolkit for experienced developers",
    },
    locale: "en_US",
  });

  const twitterMeta = twitter({
    title,
    description,
    cardType: "summary",
    image: {
      url: "/raven-logo.webp",
      alt: "RavenJS Logo - Zero-dependency toolkit for experienced developers",
    },
  });

  return html`
    <!DOCTYPE html>
    <html lang="en" class="h-100">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <meta name="description" content="${description}" />

        ${authorMeta}
        ${canonicalMeta}
        ${openGraphMeta}
        ${twitterMeta}

        <link rel="stylesheet" href="/bootstrap.css" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body class="d-flex flex-column h-100 bg-white text-dark">
        <!-- Navigation -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-2 border-dark">
          <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="/">
              <img src="/raven-logo.webp" alt="RavenJS" class="me-2" style="height: 32px; filter: brightness(0) invert(1);">
              <span class="fw-bold fs-4">RavenJS</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                  <a class="nav-link" href="#intelligence">Philosophy</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#packages">Arsenal</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="https://docs.ravenjs.dev" target="_blank">
                    Docs
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="https://github.com/Anonyfox/ravenjs" target="_blank">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-grow-1">
          ${content}
        </main>

        <!-- Footer -->
        <footer class="bg-dark text-light py-4 border-top border-2 border-dark">
          <div class="container">
            <div class="row align-items-center">
              <div class="col-md-6">
                <div class="d-flex align-items-center">
                  <img src="/raven-logo.webp" alt="RavenJS" class="me-2" style="height: 24px; filter: brightness(0) invert(1);">
                  <span class="fw-bold text-white">RavenJS</span>
                </div>
                <p class="mb-0 text-light small mt-1 opacity-75">Zero-dependency JS/ESM toolkit</p>
              </div>
              <div class="col-md-6 text-md-end">
                <p class="mb-1 text-light small">
                  Crafted with ♥ by <a href="https://anonyfox.com" class="text-white text-decoration-none fw-bold">Anonyfox e. K.</a>
                </p>
                <p class="mb-0 text-light small opacity-75">&copy; 2025 • MIT License</p>
              </div>
            </div>
          </div>
        </footer>

        <script src="/bootstrap.bundle.js"></script>
        <script type="module" src="/apps/index.js" defer></script>
      </body>
    </html>
  `;
};
