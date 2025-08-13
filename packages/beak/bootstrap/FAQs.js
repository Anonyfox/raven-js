import { css, html } from "@raven-js/beak";

/**
 * Represents a single FAQ item.
 * @typedef {Object} FAQItem
 * @property {string} question - The question text.
 * @property {string} answer - The answer text.
 */

/**
 * FAQ Accordion component for displaying a list of frequently asked questions.
 * @typedef {Object} FAQProps
 * @property {FAQItem[]} items - An array of FAQ items to display.
 * @property {string} [title] - An optional title for the FAQ section.
 * @property {string} [subtitle] - An optional subtitle for the FAQ section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 *
 * @param {FAQProps} props - The properties for the FAQ Accordion component.
 * @returns {string} The HTML string for the FAQ Accordion component.
 */
export const FAQ = ({ items, title, subtitle, background = "white" }) => {
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
    <section class="faq-accordion ${bgClass}" style="${sectionStyle}">
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
            <div class="accordion" id="faq">
              ${items
								.map(
									(item, index) => html`
                <div class="accordion-item">
                  <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${index !== 0 ? "collapsed" : ""}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="${index === 0 ? "true" : "false"}" aria-controls="collapse${index}">
                      ${item.question}
                    </button>
                  </h2>
                  <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" aria-labelledby="heading${index}" data-bs-parent="#faq">
                    <div class="accordion-body">
                      ${item.answer}
                    </div>
                  </div>
                </div>
              `,
								)
								.join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
};
