import { css, html } from "../core/index.js";

/**
 * Feature item for the Feature Grid component.
 * @typedef {Object} FeatureGridItem
 * @property {string} name - The name of the feature.
 * @property {string} description - A brief description of the feature.
 * @property {string} [emoji] - An optional emoji to represent the feature visually.
 */

/**
 * Feature Grid component for displaying multiple features in a grid layout.
 * @typedef {Object} FeatureGridProps
 * @property {FeatureGridItem[]} features - An array of feature items to display.
 * @property {number} [columns=3] - The number of columns in the grid (1-4).
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 * @property {string} [title] - An optional title for the feature grid section.
 * @property {string} [description] - An optional description for the feature grid section.
 *
 * @param {FeatureGridProps} props - The properties for the Feature Grid component.
 * @returns {string} The HTML string for the Feature Grid component.
 */
export const FeatureGrid = ({
	features,
	columns = 3,
	background = "white",
	title,
	description,
}) => {
	const bgClass = background.startsWith("bg-") ? background : "";
	const bgImage = !bgClass && background !== "white" ? background : "";

	const sectionStyle = css`
    padding: 4rem 0;
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

	const emojiStyle = css`
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
  `;

	const colClass = `col-md-${12 / Math.min(Math.max(columns, 1), 4)}`;

	return html`
    <section class="feature-grid ${bgClass}" style="${sectionStyle}">
      ${bgImage ? html`<div style="${bgImageStyle}"></div>` : ""}
      <div class="container" style="${contentStyle}">
        ${
					title || description
						? html`
          <div class="row mb-5">
            <div class="col-lg-8 mx-auto text-center">
              ${title ? html`<h2 class="fw-bold mb-3">${title}</h2>` : ""}
              ${description ? html`<p class="lead">${description}</p>` : ""}
            </div>
          </div>
        `
						: ""
				}
        <div class="row g-4">
          ${features.map(
						(feature) => html`
            <div class="${colClass}">
              <div class="feature-item text-center">
                ${feature.emoji ? html`<span style="${emojiStyle}">${feature.emoji}</span>` : ""}
                <h3 class="h5 mb-2">${feature.name}</h3>
                <p class="mb-0">${feature.description}</p>
              </div>
            </div>
          `,
					)}
        </div>
      </div>
    </section>
  `;
};
