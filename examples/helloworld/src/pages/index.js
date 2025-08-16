import { html } from "@raven-js/beak";

// Create a nice hello world HTML page using beak
export const Index = html`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World - RavenJS Example</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .container {
        text-align: center;
        background: rgba(255, 255, 255, 0.95);
        padding: 3rem;
        border-radius: 1rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        max-width: 600px;
        margin: 2rem;
      }
      h1 {
        color: #2d3748;
        font-size: 3rem;
        margin-bottom: 1rem;
        font-weight: 700;
      }
      .subtitle {
        color: #4a5568;
        font-size: 1.25rem;
        margin-bottom: 2rem;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
      }
      .feature {
        background: #f7fafc;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border-left: 4px solid #667eea;
      }
      .feature h3 {
        color: #2d3748;
        margin: 0 0 0.5rem 0;
      }
      .feature p {
        color: #4a5568;
        margin: 0;
        font-size: 0.9rem;
      }
      .raven-logo {
        font-size: 2rem;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="raven-logo">🦅</div>
      <h1>Hello World!</h1>
      <p class="subtitle">Welcome to your first RavenJS application</p>

      <div class="features">
        <div class="feature">
          <h3>Wings</h3>
          <p>Lightweight web server with routing and middleware</p>
        </div>
        <div class="feature">
          <h3>Beak</h3>
          <p>HTML templating and content processing utilities</p>
        </div>
        <div class="feature">
          <h3>Nest</h3>
          <p>Monorepo management and development tools</p>
        </div>
      </div>

      <p style="margin-top: 2rem; color: #718096; font-size: 0.9rem;">
        Built with RavenJS - Swift web development toolkit
      </p>
    </div>
  </body>
  </html>
`;
