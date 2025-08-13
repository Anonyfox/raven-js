import { css, html } from "../core/index.js";

/**
 * Represents a single testimonial.
 * @typedef {Object} TestimonialItem
 * @property {string} quote - The testimonial text.
 * @property {string} name - The name of the person giving the testimonial.
 * @property {string} [position] - The position or company of the person (optional).
 * @property {string} [avatar] - URL to the avatar image of the person (optional).
 */

/**
 * Testimonial component for displaying customer feedback.
 * @typedef {Object} TestimonialProps
 * @property {TestimonialItem[]} testimonials - An array of testimonial items to display.
 * @property {string} [title] - An optional title for the testimonial section.
 * @property {string} [description] - An optional description for the testimonial section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 * @property {number} [columns=1] - The number of columns to display testimonials in (1-3).
 *
 * @param {TestimonialProps} props - The properties for the Testimonial component.
 * @returns {string} The HTML string for the Testimonial component.
 */
export const Testimonial = ({
	testimonials,
	title,
	description,
	background = "white",
	columns = 1,
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

	const testimonialStyle = css`
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 0.5rem;
    padding: 2rem;
    height: 100%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  `;

	const avatarStyle = css`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 1rem;
  `;

	const quoteStyle = css`
    font-style: italic;
    margin-bottom: 1rem;
  `;

	const colClass = `col-md-${12 / Math.min(Math.max(columns, 1), 3)}`;

	return html`
    <section class="testimonials ${bgClass}" style="${sectionStyle}">
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
          ${testimonials.map(
						(testimonial) => html`
            <div class="${colClass}">
              <div style="${testimonialStyle}">
                <p style="${quoteStyle}">"${testimonial.quote}"</p>
                <div class="d-flex align-items-center">
                  ${
										testimonial.avatar
											? html`
                    <img src="${testimonial.avatar}" alt="${testimonial.name}" style="${avatarStyle}">
                  `
											: ""
									}
                  <div>
                    <strong>${testimonial.name}</strong>
                    ${testimonial.position ? html`<br><small>${testimonial.position}</small>` : ""}
                  </div>
                </div>
              </div>
            </div>
          `,
					)}
        </div>
      </div>
    </section>
  `;
};
