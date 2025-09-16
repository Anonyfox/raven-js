/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Arsenal section component - packages and tools showcase
 */

import { html } from "@raven-js/beak";
import { packages } from "../data/packages.js";

/**
 * Arsenal section showcasing libraries and tools with rich data
 * @returns {string} Arsenal section HTML
 */
export const Arsenal = () => {
  // Separate libraries and tools
  const libraries = packages.filter((pkg) => pkg.type === "library");
  const tools = packages.filter((pkg) => pkg.type === "tool");

  // Status badge helper
  const statusBadge = (/** @type {any} */ status) => {
    switch (status) {
      case "production":
        return html`<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-normal">Production</span>`;
      case "development":
        return html`<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 fw-normal">Development</span>`;
      default:
        return html`<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-normal">Unknown</span>`;
    }
  };

  // Package card helper
  const packageCard = (/** @type {any} */ pkg) => html`
    <div class="col-lg-4 col-md-6">
      <div class="card border-0 bg-white bg-opacity-95 shadow-sm h-100 position-relative overflow-hidden">
        <!-- Status indicator -->
        <div class="position-absolute top-0 end-0 m-3 z-1">
          ${statusBadge(pkg.status)}
        </div>

        <div class="card-body p-4 d-flex flex-column">
          <!-- Logo and title -->
          <div class="d-flex align-items-center mb-3">
            <div class="me-3 flex-shrink-0">
              <img src="${pkg.logoUrl}" alt="${pkg.slug} logo" class="rounded" style="width: 48px; height: 48px; object-fit: contain;">
            </div>
            <div class="flex-grow-1 min-w-0">
              <h6 class="card-title fw-bold text-dark mb-1 text-truncate">${pkg.title.replace("RavenJS ", "").replace(/:.+/, "")}</h6>
              <code class="small text-muted">${pkg.npmName}</code>
            </div>
          </div>

          <!-- Description -->
          <p class="card-text small text-muted lh-sm flex-grow-1 mb-3">
            ${pkg.description}
          </p>

          <!-- Action button -->
          <div class="mt-auto">
            ${
              pkg.status === "production"
                ? html`<a href="https://www.npmjs.com/package/${pkg.npmName}" class="btn btn-outline-dark btn-sm w-100" target="_blank" rel="noopener">
                  📦 Install
                </a>`
                : html`<button class="btn btn-outline-secondary btn-sm w-100" disabled>
                  ⏰ Coming Soon
                </button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  return html`
    <!-- Fixed background for arsenal -->
    <div class="arsenal-bg"></div>

    <!-- Packages Section -->
    <section id="packages" class="arsenal-section text-white">
      <div class="container py-5">
        <div class="text-center mb-5">
          <h2 class="display-6 fw-light text-white mb-4">The Arsenal</h2>
          <p class="lead text-light mb-4">Standalone capabilities instead of another framework. Pick what you need.</p>
          <div class="d-flex justify-content-center gap-4 text-light opacity-75">
            <small>✅ ${libraries.filter((p) => p.status === "production").length + tools.filter((p) => p.status === "production").length} Production Ready</small>
            <small>⏰ ${libraries.filter((p) => p.status === "development").length + tools.filter((p) => p.status === "development").length} In Development</small>
          </div>
        </div>

        <!-- Libraries -->
        <div class="mb-5">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h4 class="fw-bold text-white mb-0">
              Libraries
              <small class="text-light fs-6 fw-normal">npm install</small>
            </h4>
            <small class="text-light opacity-75">${libraries.length} packages</small>
          </div>
          <div class="row g-4">
            ${libraries.map((pkg) => packageCard(pkg)).join("")}
          </div>
        </div>

        <!-- Tools -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-4">
            <h4 class="fw-bold text-white mb-0">
              Tools
              <small class="text-light fs-6 fw-normal">npx run</small>
            </h4>
            <small class="text-light opacity-75">${tools.length} packages</small>
          </div>
          <div class="row g-4">
            ${tools.map((pkg) => packageCard(pkg)).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
};
