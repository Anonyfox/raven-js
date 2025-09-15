/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak hero section component
 */

import { highlightJS } from "@raven-js/beak/highlight";
import { escapeHtml, html } from "@raven-js/beak/html";

// Code examples for before/after comparison
const beforeCode = html`const page = \`
  <div class="card">
    <h3>Welcome</h3>
    <p>Hello World</p>
  </div>
\``;

const afterCode = html`const page = html\`
  <div class="card">
    <h3>Welcome</h3>
    <p>Hello World</p>
  </div>
\``;

/**
 * Hero section for Beak page - RavenJS elegance
 */
export const Hero = () =>
  html`
    <section class="py-5 bg-dark text-white position-relative overflow-hidden" style="min-height: 85vh;">
    <div class="container py-5 h-100">
      <div class="row h-100 align-items-center justify-content-center text-center">
        <div class="col-lg-10 col-xl-8">
          <!-- Logo + Name Integration - Optical Alignment -->
          <div class="mb-5 d-flex flex-column flex-md-row align-items-center align-items-md-start justify-content-center position-relative">
            <img
              src="/raven-logo-beak.webp"
              alt="Beak Logo"
              class="opacity-75 hover-glow me-md-4 mb-3 mb-md-0 flex-shrink-0"
              style="width: 100px; height: 100px; filter: brightness(0) invert(1); transition: all 0.3s ease; margin-top: 8px;"
            >
            <div class="text-center text-md-start">
              <h1 class="display-4 fw-bold text-white mb-2 letter-spacing-tight lh-1" style="font-weight: 700; letter-spacing: -0.02em; line-height: 0.9;">
                Beak
              </h1>
              <p class="text-light fs-6 mb-0 opacity-75 subtitle-indent" style="font-weight: 300; max-width: 280px;">
                Template Literals Without <br>the Template Engine
              </p>
            </div>
          </div>

          <!-- Core Value Props - Content-as-Code Focus -->
          <div class="row g-4 mb-5">
            <div class="col-md-4">
              <div class="text-center px-3">
                <div class="text-white fw-semibold mb-2">Content-as-Code, Finally</div>
                <div class="text-light small opacity-75">(HTML | CSS | SQL | ...)-in-JS</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="text-center px-3 border-start border-end border-secondary border-opacity-25">
                <div class="text-white fw-semibold mb-2">7 Languages, One Syntax</div>
                <div class="text-light small opacity-75">Import once, highlight forever</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="text-center px-3">
                <div class="text-white fw-semibold mb-2">Runtime? What Runtime?</div>
                <div class="text-light small opacity-75">Zero deps, zero build step</div>
              </div>
            </div>
          </div>

          <!-- The Hook - Centered & Punchy -->
          <div class="mb-5">
            <h2 class="h3 text-white fw-normal mb-3 lh-base" style="max-width: 600px; margin: 0 auto;">
              Your IDE thinks template literals are just strings.<br/>
              <span class="fw-bold text-white">We taught it seven languages.</span>
            </h2>
          </div>

          <!-- Quick Demo - Elegant Comparison -->
          <div class="row g-4 mb-5 justify-content-center">
            <div class="col-lg-6 col-xl-6">
              <div class="card bg-secondary bg-opacity-10 border border-secondary border-opacity-25 shadow-sm h-100 d-flex flex-column">
                <div class="card-body p-4 d-flex flex-column">
                  <div class="text-light small mb-3 opacity-75 text-uppercase tracking-wide" style="letter-spacing: 0.1em;">Before</div>
                  <div class="bg-light rounded p-3 border flex-grow-1 text-start" style="min-height: 140px;">
                    <pre class="mb-0"><code class="text-dark">${escapeHtml(beforeCode)}</code></pre>
                  </div>
                  <div class="text-light small mt-3 opacity-50 align-self-end">Just bland template literals. No help.</div>
                </div>
              </div>
            </div>
            <div class="col-lg-6 col-xl-6">
              <div class="card bg-light bg-opacity-10 border border-light border-opacity-25 shadow-lg h-100 d-flex flex-column electric-card">
                <div class="card-body p-4 d-flex flex-column">
                  <div class="text-white small mb-3 fw-semibold text-uppercase tracking-wide" style="letter-spacing: 0.1em;">After</div>
                  <div class="bg-light rounded p-3 border flex-grow-1 text-start" style="min-height: 140px;">
                    <pre class="mb-0"><code>${highlightJS(afterCode)}</code></pre>
                  </div>
                  <div class="text-light small mt-3 opacity-75 align-self-end">Syntax highlighting. IntelliSense. Formatting.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA - Clean & Electric -->
          <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a
              href="https://www.npmjs.com/package/@raven-js/beak"
              class="btn btn-light btn-lg px-4 py-3 fw-semibold rounded-3 electric-btn"
            >
              <i class="bi bi-download me-2"></i>npm install @raven-js/beak
            </a>
            <a
              href="#languageAccordion"
              class="btn btn-outline-light btn-lg px-4 py-3 fw-semibold rounded-3 hover-lift"
            >
              Explore Languages
            </a>
          </div>
        </div>
      </div>
    </div>

  </section>

  <style>
    .letter-spacing-tight { letter-spacing: -0.02em; }
    .tracking-wide { letter-spacing: 0.1em; }
    .hover-glow:hover {
      filter: brightness(0) invert(1) drop-shadow(0 0 15px rgba(255,255,255,0.4));
      transform: scale(1.05);
      transition: all 0.3s ease;
    }
    .electric-btn {
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }
    .electric-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255,255,255,0.2);
      border-color: rgba(255,255,255,0.3);
    }
    .hover-lift {
      transition: all 0.2s ease;
    }
    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255,255,255,0.1);
    }
    .electric-card {
      transition: all 0.3s ease;
    }
    .electric-card:hover {
      border-color: rgba(255,255,255,0.4) !important;
      box-shadow: 0 8px 30px rgba(255,255,255,0.1) !important;
    }
    .subtitle-indent { margin-left: 0; }
    @media (min-width: 768px) {
      .subtitle-indent { margin-left: 8px; }
    }
  </style>
`;
