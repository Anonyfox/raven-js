/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak problem section component
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";

// Code examples for the problem illustration
const webpackConfigCode = `// webpack.config.js
module.exports = {
  module: {
    rules: [
      { test: /.html$/, use: 'html-loader' },
      { test: /.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      { test: /.sql$/, use: 'raw-loader' }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin()
  ]
}`;

const beakSolutionCode = `import { html, css, sql } from "@raven-js/beak"

const page = html\`<div class="card">Hello World</div>\`
const styles = css\`body { margin: 0; }\`
const query = sql\`SELECT * FROM users\`

// Deploy anywhere. Zero config.`;

/**
 * Problem section for Beak page - RavenJS electric elegance
 */
export const Problem = () => html`
  <section id="problem" class="py-5 bg-white position-relative">
    <div class="spine-dot" style="top: 2.25rem;"></div>
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-11 col-xl-10">
          <!-- Cheeky Problem Statement -->
          <div class="text-center mb-5">
            <div class="text-uppercase text-muted small section-kicker mb-1">01 — Problem</div>
            <h2 class="display-6 fw-bold text-dark mb-2">Template Engine Cacophony</h2>
            <p class="lead text-muted mb-0" style="max-width: 700px; margin: 0 auto;">
              While other tools squawk in proprietary dialects, every content type demands its own loader, plugin, build step, and deployment pipeline.
              <br/>
              <span class="text-dark fw-semibold">Meanwhile, JavaScript already has template literals.</span>
            </p>
          </div>

          <!-- The Problem vs Solution Cards -->
          <div class="row g-4 mb-5">
            <!-- Traditional Hell -->
            <div class="col-lg-6">
              <div class="card bg-dark text-white border-0 shadow-lg h-100 problem-card">
                <div class="card-header bg-danger bg-opacity-10 border-bottom border-danger border-opacity-25">
                  <div class="d-flex align-items-center">
                    <span class="text-danger me-3 fs-5">⚠️</span>
                    <h5 class="mb-0 text-white">The Traditional Way</h5>
                  </div>
                </div>
                <div class="card-body p-4">
                  <div class="mb-4">
                    <div class="text-light small mb-2 opacity-75 text-uppercase" style="letter-spacing: 0.1em;">webpack.config.js</div>
                    <div class="bg-light rounded p-3 border">
                      <pre class="mb-0 text-start"><code class="text-dark small">${webpackConfigCode}</code></pre>
                    </div>
                  </div>
                  <div class="row g-2 text-center">
                    <div class="col-6">
                      <div class="bg-secondary bg-opacity-20 rounded p-2">
                        <small class="text-light opacity-75">12 Dependencies</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="bg-secondary bg-opacity-20 rounded p-2">
                        <small class="text-light opacity-75">Build Required</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="bg-secondary bg-opacity-20 rounded p-2">
                        <small class="text-light opacity-75">Config Hell</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="bg-secondary bg-opacity-20 rounded p-2">
                        <small class="text-light opacity-75">Deploy Complexity</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Beak Solution -->
            <div class="col-lg-6">
              <div class="card bg-dark text-white border-0 shadow-lg h-100 solution-card">
                <div class="card-header bg-success bg-opacity-10 border-bottom border-success border-opacity-25">
                  <div class="d-flex align-items-center">
                    <span class="text-success me-3 fs-5">✅</span>
                    <h5 class="mb-0 text-white">The Beak Way</h5>
                  </div>
                </div>
                <div class="card-body p-4 d-flex flex-column">
                  <div class="mb-4 flex-grow-1">
                    <div class="text-light small mb-2 opacity-75 text-uppercase" style="letter-spacing: 0.1em;">your-app.js</div>
                    <div class="bg-light rounded p-3 border">
                      <pre class="mb-0 text-start"><code>${highlightJS(beakSolutionCode)}</code></pre>
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="border border-success border-opacity-50 rounded p-3">
                      <div class="text-white fw-semibold mb-1">One Import. Seven Languages.</div>
                      <small class="text-light opacity-75">npm install @raven-js/beak</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <style>
    .problem-card {
      transition: all 0.3s ease;
    }
    .problem-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(220, 53, 69, 0.2) !important;
    }
    .solution-card {
      transition: all 0.3s ease;
    }
    .solution-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px rgba(25, 135, 84, 0.2) !important;
    }
  </style>
`;
