import { css, html } from "../core/index.js";

/**
 * Hero component for landing pages.
 * @typedef {Object} HeroCTAProps
 * @property {string} text - The text to display on the CTA button.
 * @property {string} url - The URL the CTA button should link to.
 *
 * @typedef {Object} HeroImageProps
 * @property {string} src - The source URL of the image.
 * @property {string} alt - The alt text for the image.
 *
 * @typedef {Object} HeroProps
 * @property {string} title - The main title of the hero section.
 * @property {string} description - A brief description or tagline.
 * @property {HeroCTAProps} primaryCTA - The primary call-to-action button.
 * @property {HeroCTAProps} [secondaryCTA] - An optional secondary call-to-action button.
 * @property {HeroImageProps} [image] - The main image to display in the hero section.
 * @property {string} [background="white"] - The background style. Can be "white", a Bootstrap bg class (e.g., "bg-light"), or an image URL.
 *
 * @param {HeroProps} props - The properties for the Hero component.
 * @returns {string} The HTML string for the Hero component.
 */
export const Hero = ({
	title,
	description,
	primaryCTA = { text: "Get Started", url: "#" },
	secondaryCTA,
	image = { src: "/path/to/default-image.jpg", alt: "Hero image" },
	background = "white",
}) => {
	const bgClass = background.startsWith("bg-") ? background : "";
	const bgImage = !bgClass && background !== "white" ? background : "";

	const sectionStyle = bgImage
		? css`background-color: #000; position: relative; overflow: hidden;`
		: "";

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

	return html`
    <section class="hero ${bgClass}" style="padding: 5rem 0; ${sectionStyle}">
      ${bgImage ? html`<div style="${bgImageStyle}"></div>` : ""}
      <div class="container" style="position: relative; z-index: 1;">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <h1 class="display-4 fw-bold mb-3">${title}</h1>
            <p class="lead mb-4">${description}</p>
            <div style="display: flex; gap: 1rem;">
              <a href="${primaryCTA.url}" class="btn btn-primary btn-lg">${primaryCTA.text}</a>
              ${
								secondaryCTA
									? html`<a href="${secondaryCTA.url}" class="btn btn-outline-secondary btn-lg">${secondaryCTA.text}</a>`
									: ""
							}
            </div>
          </div>
          <div class="col-lg-6 mt-5 mt-lg-0">
            <img src="${image.src}" alt="${image.alt}" class="img-fluid" style="
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            "/>
          </div>
        </div>
      </div>
    </section>
  `;
};
