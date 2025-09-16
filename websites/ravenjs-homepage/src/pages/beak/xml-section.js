import { html } from "@raven-js/beak";
import { highlightJS, highlightXML } from "@raven-js/beak/highlight";
import { js } from "@raven-js/beak/js";

/**
 * XML language section for Beak showcase
 */
export const XmlSection = () => {
  // XML Examples with narrative flow
  const xmlImport = js`import { xml, cdata, feed, sitemap } from "@raven-js/beak/xml";`;

  const xmlEntityEscaping = js`// Complete entity escaping - all five XML entities
const userContent = xml\`
  <user id="\${userId}" active="\${isActive}">
    <name>\${userName}</name>
    <bio>\${userBio}</bio>
  </user>
\`;`;

  const xmlObjectMagic = js`// Objects become attributes with kebab-case conversion
const config = { bindHost: "0.0.0.0", maxConnections: 100, enableSsl: true };
const serverXml = xml\`<server \${config}/>\`;`;

  const xmlCdataProtection = js`// CDATA sections with automatic termination protection
const htmlContent = "<script>alert('Hello & goodbye');</script>";
const rssItem = xml\`
  <item>
    <title>\${title}</title>
    <description>\${cdata(htmlContent)}</description>
  </item>
\`;`;

  const xmlProgressiveFeeds = js`// Progressive feed generation - basic to enterprise
const blogFeed = feed({
  title: 'Technical Blog',
  description: 'Deep dives into web development',
  link: 'https://blog.example.com',
  items: [{
    title: 'Advanced Performance',
    url: '/posts/performance',
    content: '<p>Full HTML content</p>',
    enclosure: {  // Podcast support
      url: 'https://cdn.example.com/ep1.mp3',
      type: 'audio/mpeg',
      length: 12345678
    }
  }]
});`;

  const xmlSitemapGeneration = js`// XML sitemap with SEO optimization
const seoSitemap = sitemap({
  domain: 'example.com',
  pages: [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/blog', priority: 0.8, changefreq: 'weekly', lastmod: '2024-01-15T10:00:00Z' }
  ]
});`;

  const xmlOutput = js`<server bind-host="0.0.0.0" max-connections="100" enable-ssl="true"/>`;
  const xmlCdataOutput = js`<![CDATA[<script>alert('Hello & goodbye');</script>]]>`;

  return html`
    <div class="accordion-item border-0 mb-3 shadow-lg" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed text-dark fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#xmlCollapse" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border: 1px solid #dee2e6;">
          <span class="badge bg-dark text-white me-3 shadow-sm">XML</span>
          <span class="text-dark">Progressive Content Ecosystems</span>
          <span class="text-muted ms-2">• Entity Escaping & Feed Generation</span>
        </button>
      </h2>
      <div id="xmlCollapse" class="accordion-collapse collapse" data-bs-parent="#languageAccordion">
        <div class="accordion-body p-4" style="background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
          <div class="row">
            <div class="col-lg-8">
              <!-- Opening Hook -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="small text-muted">
                    <a href="https://docs.ravenjs.dev/beak/modules/xml/" class="text-muted me-2" target="_blank" rel="noopener">📖 Docs</a>
                    <a href="https://github.com/Anonyfox/raven-js/tree/main/packages/beak/xml" class="text-muted" target="_blank" rel="noopener">🔗 Source</a>
                  </div>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(xmlImport)}</code></pre>
                </div>
                <p class="text-dark mb-4 fw-medium">XML generation usually means manual escaping nightmares and content ecosystem fragmentation. <span class="text-dark fw-bold">Beak gives you complete entity escaping plus progressive content generators.</span></p>
              </div>

              <!-- Entity Escaping Mastery -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(xmlEntityEscaping)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">All five XML entities handled surgically.</span> Fast-path optimization with regex probe + character-level escaping.</p>
              </div>

              <!-- Object Magic -->
              <div class="mb-4">
                <div class="border-start border-success border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Objects become XML attributes automatically.</p>
                  <p class="text-muted mb-0">camelCase converts to kebab-case with proper quoting:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(xmlObjectMagic)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">Result:</div>
                  <pre><code>${highlightXML(xmlOutput)}</code></pre>
                </div>
                <p class="text-muted small mb-0">Zero build step, maximum convenience.</p>
              </div>

              <!-- CDATA Intelligence -->
              <div class="mb-4">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(xmlCdataProtection)}</code></pre>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <div class="text-muted small mb-2 fw-semibold">CDATA Output:</div>
                  <pre><code>${highlightXML(xmlCdataOutput)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">CDATA termination protection.</span> Only \`]]\>\` needs handling, automatic boundary splitting.</p>
              </div>

              <!-- Progressive Generators -->
              <div class="mb-4">
                <div class="border-start border-primary border-3 ps-3 mb-3">
                  <p class="text-dark fw-bold mb-2">Beyond XML generation: content ecosystems.</p>
                  <p class="text-muted mb-0">RSS/Atom feeds with progressive enhancement:</p>
                </div>
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(xmlProgressiveFeeds)}</code></pre>
                </div>
                <p class="text-muted small mb-0">Four tiers: basic → enriched → multi-format → enterprise (podcast enclosures).</p>
              </div>

              <!-- SEO Sitemap Power -->
              <div class="mb-0">
                <div class="bg-light rounded p-3 mb-3 border shadow-sm">
                  <pre><code>${highlightJS(xmlSitemapGeneration)}</code></pre>
                </div>
                <p class="text-muted mb-0"><span class="text-dark fw-semibold">SEO-optimized XML sitemaps.</span> Priority, change frequency, last modification - all handled progressively.</p>
              </div>
            </div>

            <div class="col-lg-4">
              <!-- Entity Escaping -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    🛡️ 5 XML Entities
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Ampersand</span>
                      <code class="text-muted">& → &amp;</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Less than</span>
                      <code class="text-muted">< → &lt;</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Greater than</span>
                      <code class="text-muted">> → &gt;</code>
                    </li>
                    <li class="mb-2 d-flex justify-content-between">
                      <span class="text-dark fw-medium">Double quote</span>
                      <code class="text-muted">" → &quot;</code>
                    </li>
                    <li class="d-flex justify-content-between">
                      <span class="text-dark fw-medium">Apostrophe</span>
                      <code class="text-muted">' → &apos;</code>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Progressive Generators -->
              <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #212529 0%, #343a40 100%);">
                <div class="card-body">
                  <h6 class="text-white mb-3 fw-bold d-flex align-items-center">
                    📋 Content Ecosystems
                  </h6>
                  <ul class="list-unstyled mb-0 small">
                    <li class="mb-2 d-flex align-items-center">
                      📰
                      <span class="text-white fw-medium">RSS/Atom Feeds</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      📊
                      <span class="text-white fw-medium">XML Sitemaps</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                      🎤
                      <span class="text-white fw-medium">Podcast Enclosures</span>
                    </li>
                    <li class="d-flex align-items-center">
                      🔍
                      <span class="text-white fw-medium">SEO Optimization</span>
                    </li>
                  </ul>
                  <hr class="border-secondary my-3">
                  <p class="text-light small mb-0">↗️ Progressive enhancement: basic → enterprise</p>
                </div>
              </div>

              <!-- Technical Excellence -->
              <div class="card border-0 shadow-sm" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="card-body">
                  <h6 class="text-dark mb-3 fw-bold d-flex align-items-center">
                    🚀 Performance Engine
                  </h6>
                  <ul class="list-unstyled mb-3 small">
                    <li class="mb-2">⚡ <span class="text-dark fw-medium">Fast-path escaping</span> (regex probe)</li>
                    <li class="mb-2">📦 <span class="text-dark fw-medium">WeakMap caching</span> (template identity)</li>
                    <li class="mb-2">📋 <span class="text-dark fw-medium">4-tier optimization</span> (0,1,2-3,4+ values)</li>
                    <li class="mb-2">✂️ <span class="text-dark fw-medium">Slice builder</span> (first hit start)</li>
                    <li class="mb-2">🛡️ <span class="text-dark fw-medium">CDATA protection</span> (]]> splitting)</li>
                    <li>↔️ <span class="text-dark fw-medium">Object attributes</span> (kebab-case)</li>
                  </ul>
                  <div class="border-top border-secondary pt-3">
                    <p class="text-muted small mb-0 fst-italic">
                      <span class="text-dark fw-semibold">"Complete XML compliance</span> with progressive content ecosystem generators."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
