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

        <style>
          /* iOS-compatible parallax using position: fixed */
          .hero-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.4)), url('/raven-landscape.webp');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: -1;
          }

          .arsenal-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-image: linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.6)), url('/raven-landscape.webp');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: -1;
          }

          /* Content containers */
          .hero-section, .arsenal-section {
            width: 100%;
            min-height: 100vh;
            display: flex;
            align-items: center;
            position: relative;
          }

          .hero-section .container,
          .arsenal-section .container {
            position: relative;
            z-index: 1;
            width: 100%;
          }

          /* Mobile text adjustments */
          @media (max-width: 767px) {
            .hero-section .display-4 {
              font-size: 2rem;
            }

            .hero-section .lead {
              font-size: 1.1rem;
            }

            .hero-section, .arsenal-section {
              min-height: 100vh;
            }
          }
        </style>
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
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Packages
                  </a>
                  <ul class="dropdown-menu">
                    <li><h6 class="dropdown-header text-muted small text-uppercase fw-bold" style="letter-spacing: 0.05em;">Libraries</h6></li>
                    <li><a class="dropdown-item" href="/beak/">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-beak.webp" alt="Beak" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Beak</div>
                          <small class="text-muted">Template literals without the engine</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/wings/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-wings.webp" alt="Wings" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Wings</div>
                          <small class="text-muted">Isomorphic routing & clustering</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/reflex/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-reflex.webp" alt="Reflex" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Reflex</div>
                          <small class="text-muted">Reactive signals & DOM</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/cortex/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-cortex.webp" alt="Cortex" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Cortex</div>
                          <small class="text-muted">AI & data processing</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/eye/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-eye.webp" alt="Eye" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Eye</div>
                          <small class="text-muted">Digital fingerprinting</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/talons/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-talons.webp" alt="Talons" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Talons</div>
                          <small class="text-muted">Data interaction patterns</small>
                        </div>
                      </div>
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><h6 class="dropdown-header text-muted small text-uppercase fw-bold" style="letter-spacing: 0.05em;">Tools</h6></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/fledge/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-fledge.webp" alt="Fledge" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Fledge</div>
                          <small class="text-muted">Static site generation</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/soar/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-soar.webp" alt="Soar" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Soar</div>
                          <small class="text-muted">Deployment automation</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/glean/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-glean.webp" alt="Glean" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Glean</div>
                          <small class="text-muted">Documentation generation</small>
                        </div>
                      </div>
                    </a></li>
                    <li><a class="dropdown-item" href="https://docs.ravenjs.dev/hatch/" target="_blank">
                      <div class="d-flex align-items-center">
                        <img src="/raven-logo-hatch.webp" alt="Hatch" class="me-2" style="height: 16px;">
                        <div>
                          <div class="fw-medium">Hatch</div>
                          <small class="text-muted">Project bootstrapping</small>
                        </div>
                      </div>
                    </a></li>
                  </ul>
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
