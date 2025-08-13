import { css, html } from "../core/index.js";

/**
 * Simple CTA component for prompting user action.
 * @typedef {Object} CTAProps
 * @property {string} title - The main title or message of the CTA.
 * @property {string} [subtitle] - An optional subtitle or additional text.
 * @property {string} buttonText - The text to display on the CTA button.
 * @property {string} buttonUrl - The URL the button should link to.
 * @property {string} [background="primary"] - The background style. Can be a Bootstrap color class (e.g., "primary", "secondary"), "custom" for image background, or any valid color value.
 * @property {string} [backgroundImage] - The URL of the background image (only used if background is set to "custom").
 * @property {string} [textColor="white"] - The color of the text. Default is white for dark backgrounds.
 * @property {string} [buttonStyle="light"] - The Bootstrap button style to use (e.g., "light", "outline-light").
 *
 * @param {CTAProps} props - The properties for the Simple CTA component.
 * @returns {string} The HTML string for the Simple CTA component.
 */
export const CTA = ({
	title,
	subtitle,
	buttonText,
	buttonUrl,
	background = "primary",
	backgroundImage,
	textColor = "white",
	buttonStyle = "light",
}) => {
	const isCustomBg = background === "custom";
	const bgClass = isCustomBg ? "" : `bg-${background}`;

	const sectionStyle = css`
    padding: 5rem 0;
    ${
			isCustomBg
				? `
      background-image: url(${backgroundImage});
      background-size: cover;
      background-position: center;
      position: relative;
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
      }
    `
				: ""
		}
  `;

	const contentStyle = css`
    position: relative;
    z-index: 1;
    color: ${textColor};
  `;

	return html`
    <section class="simple-cta ${bgClass}" style="${sectionStyle}">
      <div class="container" style="${contentStyle}">
        <div class="row justify-content-center text-center">
          <div class="col-lg-8">
            <h2 class="display-4 fw-bold mb-3">${title}</h2>
            ${subtitle ? html`<p class="lead mb-4">${subtitle}</p>` : ""}
            <a href="${buttonUrl}" class="btn btn-${buttonStyle} btn-lg px-5 py-3 fw-bold">
              ${buttonText}
            </a>
          </div>
        </div>
      </div>
    </section>
  `;
};
