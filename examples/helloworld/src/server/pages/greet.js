import { html } from "@raven-js/beak";

// Interactive greeting page with form handling and dynamic rendering
export const Greet = html`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Greeting - RavenJS Example</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
        max-width: 500px;
        margin: 2rem;
        width: 100%;
      }
      h1 {
        color: #2d3748;
        font-size: 2.5rem;
        margin-bottom: 1rem;
        font-weight: 700;
      }
      .subtitle {
        color: #4a5568;
        font-size: 1.1rem;
        margin-bottom: 2rem;
      }
      .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
      }
      label {
        display: block;
        color: #2d3748;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
      input[type="text"] {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        box-sizing: border-box;
      }
      input[type="text"]:focus {
        outline: none;
        border-color: #f093fb;
        box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
      }
      .submit-btn {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        border: none;
        padding: 0.875rem 2rem;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        width: 100%;
      }
      .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(240, 147, 251, 0.3);
      }
      .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      .result {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f7fafc;
        border-radius: 0.5rem;
        border-left: 4px solid #f093fb;
        text-align: left;
        min-height: 3rem;
        display: none;
      }
      .result.show {
        display: block;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .back-link {
        display: inline-block;
        margin-top: 2rem;
        color: #718096;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.2s ease;
      }
      .back-link:hover {
        color: #f5576c;
      }
      .loading {
        display: none;
        color: #718096;
        font-style: italic;
      }
      .loading.show {
        display: inline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>👋 Interactive Greeting</h1>
      <p class="subtitle">Enter your name to receive a personalized message using client-side ES modules!</p>

      <form id="greet-form">
        <div class="form-group">
          <label for="name">Your Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your name..."
            required
            autocomplete="given-name"
          />
        </div>

        <button type="submit" class="submit-btn">
          <span class="btn-text">Generate Greeting</span>
          <span class="loading">Processing...</span>
        </button>
      </form>

      <div id="result" class="result">
        <!-- Dynamic content will be rendered here -->
      </div>

      <a href="/" class="back-link">← Back to Home</a>
    </div>

    <!-- Load the client-side application using ES modules -->
    <script type="module" src="/client/greet.js"></script>
  </body>
  </html>
`;
