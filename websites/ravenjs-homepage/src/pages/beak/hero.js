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

import { html } from "@raven-js/beak/html";

/**
 * Hero section for Beak page - RavenJS elegance
 */
export const Hero = () =>
  html`
    <section class="py-5 bg-dark text-white position-relative overflow-hidden">
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

          <!-- The Raven Connection - Perfect Balance -->
          <div class="mb-5 text-center position-relative">
            <p class="text-light opacity-75 fst-italic mx-auto pt-3" style="max-width: 520px; line-height: 1.6; font-size: 1.05rem;">
              Ravens are notorious polyglots—they mimic human speech, learn local dialects,
              even fool other birds with perfect imitations.
              <span class="text-white fw-medium opacity-100">Your beak does the same.</span>
            </p>
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
