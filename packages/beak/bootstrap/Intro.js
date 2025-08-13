import { css, html } from "../core/index.js";

/**
 * Intro component for concise section introductions.
 * @typedef {Object} IntroCTAProps
 * @property {string} text - The text to display on the CTA button.
 * @property {string} url - The URL the CTA button should link to.
 *
 * @typedef {Object} IntroImageProps
 * @property {string} src - The source URL of the image.
 * @property {string} alt - The alt text for the image.
 *
 * @typedef {Object} IntroProps
 * @property {string} title - The main title of the intro section.
 * @property {string} description - A brief description or tagline.
 * @property {IntroCTAProps} [cta] - An optional call-to-action button.
 * @property {IntroImageProps} [image] - An optional image to display in the intro section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 * @property {string} [align="left"] - The alignment of the content. Can be "left" or "center".
 *
 * @param {IntroProps} props - The properties for the Intro component.
 * @returns {string} The HTML string for the Intro component.
 */
export const Intro = ({
	title,
	description,
	cta,
	image,
	background = "white",
	align = "left",
}) => {
	const bgClass = background.startsWith("bg-") ? background : "";
	const bgImage = !bgClass && background !== "white" ? background : "";

	const sectionStyle = css`
    padding: 3rem 0;
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
    text-align: ${align};
  `;

	const imageStyle = css`
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  `;

	return html`
    <section class="intro ${bgClass}" style="${sectionStyle}">
      ${bgImage ? html`<div style="${bgImageStyle}"></div>` : ""}
      <div class="container">
        <div class="row align-items-center">
          <div class="${image ? "col-lg-7" : "col-12"}" style="${contentStyle}">
            <h2 class="fw-bold mb-3">${title}</h2>
            <p class="lead mb-4">${description}</p>
            ${
							cta
								? html`
              <a href="${cta.url}" class="btn btn-primary">${cta.text}</a>
            `
								: ""
						}
          </div>
          ${
						image
							? html`
            <div class="col-lg-5 mt-4 mt-lg-0">
              <img src="${image.src}" alt="${image.alt}" style="${imageStyle}" />
            </div>
          `
							: ""
					}
        </div>
      </div>
    </section>
  `;
};
