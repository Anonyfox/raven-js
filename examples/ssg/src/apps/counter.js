/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Interactive counter component using Reflex signals
 */

import { html } from "@raven-js/beak";
import { signal } from "@raven-js/reflex";

/**
 * Create interactive counter component with reactive state
 * @param {Object} props - Component properties
 * @param {number} [props.initial=0] - Initial counter value
 * @returns {string} HTML string with reactive functionality
 */
export const Counter = ({ initial = 0 } = {}) => {
  // Create reactive signal for counter state
  const count = signal(initial);

  // Event handlers
  const increment = () => count.update((n) => n + 1);
  const decrement = () => count.update((n) => n - 1);

  return html`
		<div class="counter">
			<button
				class="counter__btn counter__btn--decrement"
				onclick=${decrement}
				aria-label="Decrease counter"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
			</button>

			<div class="counter__display">
				${count()}
			</div>

			<button
				class="counter__btn counter__btn--increment"
				onclick=${increment}
				aria-label="Increase counter"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
			</button>
		</div>

		<style>
			.counter {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 1.5rem;
				padding: 2rem;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				border-radius: 16px;
				box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
				max-width: 300px;
				margin: 0 auto;
			}

			.counter__display {
				font-size: 3rem;
				font-weight: 700;
				color: white;
				min-width: 4rem;
				text-align: center;
				text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
				transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
			}

			.counter__btn {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 60px;
				height: 60px;
				border: none;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.2);
				backdrop-filter: blur(10px);
				color: white;
				cursor: pointer;
				transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
				box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
			}

			.counter__btn:hover {
				background: rgba(255, 255, 255, 0.3);
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
			}

			.counter__btn:active {
				transform: translateY(0);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
			}

			.counter__btn svg {
				width: 24px;
				height: 24px;
			}

			@media (max-width: 480px) {
				.counter {
					gap: 1rem;
					padding: 1.5rem;
				}

				.counter__display {
					font-size: 2.5rem;
					min-width: 3rem;
				}

				.counter__btn {
					width: 50px;
					height: 50px;
				}
			}
		</style>
	`;
};
