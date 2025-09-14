/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Weather widget component with SSR and data fetching
 */

import { html } from "@raven-js/beak";
import { mount } from "@raven-js/reflex/dom";

/**
 * Weather widget that fetches data and demonstrates SSR caching
 * @param {Object} props - Component properties
 * @param {string} [props.city="London"] - City to show weather for
 * @returns {Promise<string>} HTML string with weather data
 */
export const Weather = async ({ city = "London" } = {}) => {
  // Simulate API call (in real app, use actual weather API)
  const weatherData = await fetchWeatherData(city);

  return html`
		<div class="weather-widget">
			<h3>${city}</h3>
			<div class="weather-info">
				<span class="temp">${weatherData.temp}°C</span>
				<span class="desc">${weatherData.description}</span>
			</div>
			<div class="details">
				<div>Humidity: ${weatherData.humidity}%</div>
				<div>Wind: ${weatherData.wind} km/h</div>
			</div>
		</div>

		<style>
			.weather-widget {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				border-radius: 16px;
				padding: 1.5rem;
				color: white;
				max-width: 300px;
				margin: 1rem auto;
			}

			.weather-widget h3 {
				margin: 0 0 1rem 0;
				font-size: 1.5rem;
			}

			.weather-info {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 1rem;
			}

			.temp {
				font-size: 2rem;
				font-weight: bold;
			}

			.desc {
				font-size: 1.1rem;
				opacity: 0.9;
			}

			.details {
				display: flex;
				justify-content: space-between;
				font-size: 0.9rem;
				opacity: 0.8;
			}
		</style>
	`;
};

/**
 * Simulate weather API call
 * @param {string} city
 * @returns {Promise<{temp: number, description: string, humidity: number, wind: number}>}
 */
async function fetchWeatherData(city) {
  // Use a real API endpoint that will be cached by SSR
  // Using a mock JSON endpoint for demo
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/1`);
    const data = await response.json();

    // Transform the data to look like weather (for demo purposes)
    return {
      temp: data.id * 10 + 5, // Consistent temp based on ID
      description: city === "London" ? "Rainy" : "Sunny",
      humidity: 65,
      wind: 12,
    };
  } catch {
    // Fallback for offline/error cases
    return {
      temp: 15,
      description: "Unknown",
      humidity: 50,
      wind: 10,
    };
  }
}

/**
 * Hydrate weather widget (for client-side updates)
 * @param {string} selector - CSS selector for target element
 * @param {Object} [props={}] - Component props
 */
export const hydrate = (selector, props = {}) => {
  mount(() => Weather(props), selector, { replace: true });
};
