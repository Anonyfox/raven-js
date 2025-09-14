/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Hero section component - main landing section with CTA
 */

import { html } from "@raven-js/beak";

/**
 * Hero section with background and call-to-action
 * @returns {string} Hero section HTML
 */
export const Hero = () => html`
  <!-- Fixed background for hero -->
  <div class="hero-bg"></div>

  <!-- Hero Section -->
  <section class="hero-section text-white">
    <div class="container py-5">
      <div class="row justify-content-center text-center">
        <div class="col-lg-8">
          <div class="mb-4">
            <img src="/raven-logo.webp" alt="RavenJS" class="img-fluid mb-3" style="max-height: 120px; filter: brightness(0) invert(1);">
          </div>
          <h1 class="display-4 fw-light mb-4 text-white">
            Web dev toolkit for the post-framework era
          </h1>
          <p class="lead mb-5 text-light fs-5">
            Modern ESM libraries. Everything you need in pure JavaScript.<br>
            <em>Tree-shake what you don't.</em>
          </p>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            <a href="https://github.com/Anonyfox/ravenjs" class="btn btn-outline-light btn-lg px-4 py-3">
              <i class="bi bi-github me-2"></i>View on GitHub
            </a>
            <a href="#intelligence" class="btn btn-light btn-lg px-4 py-3 text-dark">
              <strong>Why Ravens Dominate</strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
