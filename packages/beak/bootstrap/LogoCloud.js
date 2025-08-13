import { css, html } from "../core/index.js";

/**
 * Represents a single logo item.
 * @typedef {Object} LogoCloudItem
 * @property {string} src - The source URL of the logo image.
 * @property {string} alt - The alt text for the logo image.
 * @property {string} [url] - An optional URL to link the logo to.
 */

/**
 * Logo Cloud component for displaying partner or client logos.
 * @typedef {Object} LogoCloudProps
 * @property {LogoCloudItem[]} logos - An array of logo items to display.
 * @property {string} [title] - An optional title for the logo cloud section.
 * @property {string} [description] - An optional description for the logo cloud section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 * @property {number} [columns=4] - The number of columns to display logos in (2-6).
 * @property {boolean} [grayscale=false] - Whether to display logos in grayscale.
 *
 * @param {LogoCloudProps} props - The properties for the Logo Cloud component.
 * @returns {string} The HTML string for the Logo Cloud component.
 */
export const LogoCloud = ({
	logos,
	title,
	description,
	background = "white",
	columns = 4,
	grayscale = false,
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

	const logoStyle = css`
    max-width: 100%;
    height: auto;
    max-height: 80px;
    object-fit: contain;
    ${
			grayscale
				? `
      filter: grayscale(100%);
      opacity: 0.7;
      transition: all 0.3s ease;
      &:hover {
        filter: grayscale(0%);
        opacity: 1;
      }
    `
				: ""
		}
  `;

	const colClass = `col-6 col-md-${12 / Math.min(Math.max(columns, 2), 6)}`;

	return html`
    <section class="logo-cloud ${bgClass}" style="${sectionStyle}">
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
        <div class="row g-4 align-items-center justify-content-center">
          ${logos.map(
						(logo) => html`
            <div class="${colClass} text-center">
              ${
								logo.url
									? html`
                <a href="${logo.url}" target="_blank" rel="noopener noreferrer">
                  <img src="${logo.src}" alt="${logo.alt}" style="${logoStyle}">
                </a>
              `
									: html`
                <img src="${logo.src}" alt="${logo.alt}" style="${logoStyle}">
              `
							}
            </div>
          `,
					)}
        </div>
      </div>
    </section>
  `;
};
