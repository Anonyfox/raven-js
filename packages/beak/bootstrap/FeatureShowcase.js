import { css, html } from "../core/index.js";

/**
 * Feature Showcase component for highlighting a single feature with more detail.
 * @typedef {Object} FeatureShowcaseCTAProps
 * @property {string} text - The text to display on the CTA button.
 * @property {string} url - The URL the CTA button should link to.
 *
 * @typedef {Object} FeatureShowcaseImageProps
 * @property {string} src - The source URL of the image.
 * @property {string} alt - The alt text for the image.
 *
 * @typedef {Object} FeatureShowcaseProps
 * @property {string} title - The title of the featured item.
 * @property {string} description - A detailed description of the feature.
 * @property {FeatureShowcaseImageProps} [image] - An optional image or screenshot of the feature.
 * @property {FeatureShowcaseCTAProps} [cta] - An optional call-to-action button.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 * @property {boolean} [imageOnRight=true] - Whether to display the image on the right side (true) or left side (false).
 * @property {string[]} [bulletPoints] - An optional array of bullet points highlighting key aspects of the feature.
 *
 * @param {FeatureShowcaseProps} props - The properties for the Feature Showcase component.
 * @returns {string} The HTML string for the Feature Showcase component.
 */
export const FeatureShowcase = ({
	title,
	description,
	image,
	cta,
	background = "white",
	imageOnRight = true,
	bulletPoints = [],
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

	const imageStyle = css`
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  `;

	const bulletListStyle = css`
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  `;

	const contentOrder = imageOnRight ? "order-md-1" : "order-md-2";
	const imageOrder = imageOnRight ? "order-md-2" : "order-md-1";

	return html`
    <section class="feature-showcase ${bgClass}" style="${sectionStyle}">
      ${bgImage ? html`<div style="${bgImageStyle}"></div>` : ""}
      <div class="container" style="${contentStyle}">
        <div class="row align-items-center">
          <div class="col-md-6 ${contentOrder}">
            <h2 class="fw-bold mb-4">${title}</h2>
            <p class="lead mb-4">${description}</p>
            ${
							bulletPoints.length > 0
								? html`
              <ul style="${bulletListStyle}">
                ${bulletPoints.map((point) => html`<li>${point}</li>`).join("")}
              </ul>
            `
								: ""
						}
            ${
							cta
								? html`
              <a href="${cta.url}" class="btn btn-primary btn-lg">${cta.text}</a>
            `
								: ""
						}
          </div>
          ${
						image
							? html`
            <div class="col-md-6 ${imageOrder} mt-4 mt-md-0">
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
