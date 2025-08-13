import { css, html } from "../core/index.js";

/**
 * Represents a single pricing plan.
 * @typedef {Object} PricingTablePlan
 * @property {string} name - The name of the pricing plan.
 * @property {string} price - The price of the plan (e.g., "$9.99/mo").
 * @property {string} [description] - A short description of the plan.
 * @property {string[]} features - An array of features included in the plan.
 * @property {string} ctaText - The text for the call-to-action button.
 * @property {string} ctaUrl - The URL for the call-to-action button.
 * @property {boolean} [highlighted=false] - Whether this plan should be visually highlighted.
 */

/**
 * Pricing Table component for displaying multiple pricing plans.
 * @typedef {Object} PricingTableProps
 * @property {PricingTablePlan[]} plans - An array of pricing plans to display.
 * @property {string} [title] - An optional title for the pricing table section.
 * @property {string} [description] - An optional description for the pricing table section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 *
 * @param {PricingTableProps} props - The properties for the Pricing Table component.
 * @returns {string} The HTML string for the Pricing Table component.
 */
export const PricingTable = ({
	plans,
	title,
	description,
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
    height: 100%;
    background-color: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
  `;

	const highlightedPlanStyle = css`
    ${planStyle}
    border: 2px solid var(--bs-primary);
    transform: scale(1.05);
    &:hover {
      transform: scale(1.05) translateY(-5px);
    }
  `;

	const renderPlan = (/** @type {PricingTablePlan} */ plan) => html`
    <div class="col-md-${12 / plans.length} mb-4">
      <div class="card ${plan.highlighted ? highlightedPlanStyle : planStyle}" style="padding: 2rem;">
        ${plan.highlighted ? html`<div class="card-header text-center bg-primary text-white py-2">Most Popular</div>` : ""}
        <div class="card-body d-flex flex-column">
          <h3 class="card-title text-center mb-4">${plan.name}</h3>
          <div class="display-4 text-center mb-4 fw-bold">${plan.price}</div>
          ${plan.description ? html`<p class="text-center mb-4">${plan.description}</p>` : ""}
          <ul class="list-unstyled mb-5">
            ${plan.features
							.map(
								(feature) => html`
              <li class="mb-2">
                <i class="bi bi-check-circle-fill text-success me-2"></i>${feature}
              </li>
            `,
							)
							.join("")}
          </ul>
          <a href="${plan.ctaUrl}" class="btn btn-primary mt-auto">
            ${plan.ctaText}
          </a>
        </div>
      </div>
    </div>
  `;

	return html`
    <section class="pricing-table ${bgClass}" style="${sectionStyle}">
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
        <div class="row">
          ${plans.map(renderPlan).join("")}
        </div>
      </div>
    </section>
  `;
};
