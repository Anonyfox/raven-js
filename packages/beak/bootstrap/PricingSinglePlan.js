import { css, html } from "../core/index.js";

/**
 * Represents a feature in the pricing plan.
 * @typedef {Object} PricingSinglePlanFeature
 * @property {string} text - The description of the feature.
 * @property {boolean} [included=true] - Whether the feature is included in the plan.
 */

/**
 * Pricing Single Plan component for displaying a detailed single pricing option.
 * @typedef {Object} PricingSinglePlanProps
 * @property {string} name - The name of the pricing plan.
 * @property {string} price - The price of the plan (e.g., "$29.99/mo").
 * @property {string} [description] - A short description of the plan.
 * @property {PricingSinglePlanFeature[]} features - An array of features included in the plan.
 * @property {string} ctaText - The text for the call-to-action button.
 * @property {string} ctaUrl - The URL for the call-to-action button.
 * @property {string} [title] - An optional title for the pricing section.
 * @property {string} [subtitle] - An optional subtitle for the pricing section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 *
 * @param {PricingSinglePlanProps} props - The properties for the Pricing Single Plan component.
 * @returns {string} The HTML string for the Pricing Single Plan component.
 */
export const PricingSinglePlan = ({
	name,
	price,
	description,
	features,
	ctaText,
	ctaUrl,
	title,
	subtitle,
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

	const planStyle = css`
    background-color: #fff;
    border-radius: 1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
    }
  `;

	const featureStyle = (/** @type {boolean} */ included) => css`
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    ${included ? "" : "opacity: 0.5;"}
  `;

	const checkIcon = (/** @type {boolean} */ included) =>
		included
			? html`<i class="bi bi-check-circle-fill text-success me-2"></i>`
			: html`<i class="bi bi-x-circle-fill text-danger me-2"></i>`;

	return html`
    <section class="pricing-single-plan ${bgClass}" style="${sectionStyle}">
      ${bgImage ? html`<div style="${bgImageStyle}"></div>` : ""}
      <div class="container" style="${contentStyle}">
        ${
					title || subtitle
						? html`
          <div class="row mb-5">
            <div class="col-lg-8 mx-auto text-center">
              ${title ? html`<h2 class="fw-bold mb-3">${title}</h2>` : ""}
              ${subtitle ? html`<p class="lead">${subtitle}</p>` : ""}
            </div>
          </div>
        `
						: ""
				}
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="card ${planStyle}" style="padding: 3rem;">
              <div class="card-body">
                <h3 class="card-title text-center mb-4">${name}</h3>
                <div class="display-4 text-center mb-4 fw-bold">${price}</div>
                ${description ? html`<p class="text-center mb-5">${description}</p>` : ""}
                <div class="row mb-5">
                  ${features
										.map(
											(feature) => html`
                    <div class="col-md-6">
                      <div style="${featureStyle(feature.included !== false)}">
                        ${checkIcon(feature.included !== false)}
                        ${feature.text}
                      </div>
                    </div>
                  `,
										)
										.join("")}
                </div>
                <div class="text-center">
                  <a href="${ctaUrl}" class="btn btn-primary btn-lg px-5">
                    ${ctaText}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
};
