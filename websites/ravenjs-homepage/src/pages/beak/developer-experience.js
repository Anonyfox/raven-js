/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Beak developer experience component
 */

import { html } from "@raven-js/beak";
import { highlightJS } from "@raven-js/beak/highlight";

/**
 * Developer experience section for Beak page
 */
export const DeveloperExperience = () => html`
  <section class="py-5">
    <div class="container py-5">
      <div class="row align-items-center">
        <div class="col-lg-6">
          <h2 class="display-6 fw-bold mb-4">Finally, Template Literals That Aren't Just Strings</h2>
          <div class="mb-4">
            <h5 class="text-dark mb-3">Zero Configuration</h5>
            <p class="text-muted">
              Install the VS Code plugin, get instant IntelliSense for HTML, CSS, SQL, Markdown, XML, JavaScript, and Shell.
              No configuration files, no setup complexity.
            </p>
          </div>
          <div class="mb-4">
            <h5 class="text-dark mb-3">Full IDE Support</h5>
            <p class="text-muted">
              Syntax highlighting, autocomplete, error detection, and formatting across all 7 languages.
              Your template literals become first-class citizens in your editor.
            </p>
          </div>
          <div class="d-flex gap-3 flex-wrap">
            <a href="https://www.npmjs.com/package/@raven-js/beak" class="btn btn-dark btn-lg">
              <i class="bi bi-download me-2"></i>Install Beak
            </a>
            <a href="#" class="btn btn-outline-dark btn-lg">
              <i class="bi bi-puzzle me-2"></i>Try VS Code Plugin
            </a>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card border-0 shadow-lg">
            <div class="card-body p-0">
              <div class="bg-light text-dark p-4 border" style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;">
                <div class="d-flex align-items-center mb-3">
                  <div class="d-flex gap-2">
                    <div class="rounded-circle bg-secondary" style="width: 12px; height: 12px;"></div>
                    <div class="rounded-circle bg-secondary" style="width: 12px; height: 12px;"></div>
                    <div class="rounded-circle bg-secondary" style="width: 12px; height: 12px;"></div>
                  </div>
                  <div class="text-muted small ms-3">VS Code with Beak Plugin</div>
                </div>
                <div style="font-size: 14px;">
                  ${highlightJS('// HTML with full IntelliSense\nconst page = html`\n  <div class="container">\n    <h1>\\${title}</h1>\n  </div>\n`\n\n// CSS with object IntelliSense\nconst styles = css`\n  .button {\n    \\${{ backgroundColor: "#007bff" }}\n  }\n`\n\n// SQL with syntax validation\nconst query = sql`\n  SELECT * FROM users\n  WHERE name = \'\\${userName}\'\n`')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
