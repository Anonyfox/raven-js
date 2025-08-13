import { css, html, safeHtml } from "../core/index.js";

/**
 * Code Example component for displaying formatted code snippets with title, description, and outro.
 * @typedef {Object} CodeExampleProps
 * @property {string} title - The title of the code example section.
 * @property {string} description - The description text of the code example.
 * @property {string} code - The code snippet to be displayed.
 * @property {string} language - The programming language of the code snippet (for syntax highlighting).
 * @property {string} [outro] - Optional outro text to display after the code snippet.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 *
 * @param {CodeExampleProps} props - The properties for the Code Example component.
 * @returns {string} The HTML string for the Code Example component.
 */
export const CodeExample = ({
	title,
	description,
	code,
	language,
	outro,
	background = "white",
}) => {
	const bgClass = background.startsWith("bg-") ? background : "";
	const bgImage = !bgClass && background !== "white" ? background : "";

	const sectionStyle = css`
    padding: 5rem 0;
    ${
			bgImage
				? `
      background-color: #000;
      position: relative;
      overflow: hidden;
    `
				: ""
		}
  `;

	const bgImageStyle = bgImage
		? css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url(${bgImage});
    background-size: cover;
    background-position: center;
    opacity: 0.7;
  `
		: "";

	const contentStyle = css`
    position: relative;
    z-index: 1;
  `;

	return html`
    <section class="code-example ${bgClass}" style="${sectionStyle}">
      ${bgImage ? html`<div style="${bgImageStyle}"></div>` : ""}
      <div class="container" style="${contentStyle}">
        <h2 class="text-center mb-4">${title}</h2>
        <p class="lead text-center mb-4">${description}</p>
        <div class="code-block mb-4">
          <pre><code class="language-${language}">${safeHtml`${code}`}</code></pre>
        </div>
        ${outro ? html`<p class="text-center">${outro}</p>` : ""}
      </div>
    </section>
  `;
};
