import { html } from "@raven-js/beak";

/**
 * Component benchmark template for Beak2 (HTML2)
 * Single product list component with loops, conditionals, and data processing
 */
export const renderProductList = (data) => {
	const { products, user, config } = data;

	return html`
		<div class="product-grid">
			<h2>Featured Products (${products.length})</h2>
			${user.isPremium ? html`<div class="premium-badge">Premium Member</div>` : ""}

			<div class="products">
				${products.map(
					(product) => html`
					<div class="product-card ${product.featured ? "featured" : ""} ${!product.inStock ? "out-of-stock" : ""}">
						<div class="product-image">
							<img src="${product.imageUrl}" alt="${product.name}" />
							${product.discount > 0 ? html`<span class="discount-badge">-${product.discount}%</span>` : ""}
						</div>

						<div class="product-info">
							<h3 class="product-name">${product.name}</h3>
							<p class="product-description">${product.description}</p>

							<div class="product-categories">
								${product.categories.map(
									(category) => html`
									<span class="category-tag">${category}</span>
								`,
								)}
							</div>

							<div class="product-price">
								${
									product.discount > 0
										? html`
									<span class="original-price">$${product.price.toFixed(2)}</span>
									<span class="sale-price">$${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
								`
										: html`
									<span class="current-price">$${product.price.toFixed(2)}</span>
								`
								}
							</div>

							<div class="product-stats">
								<div class="rating">
									${Array.from(
										{ length: 5 },
										(_, i) => html`
										<span class="star ${i < Math.floor(product.rating) ? "filled" : ""}">★</span>
									`,
									)}
									<span class="rating-text">(${product.reviews})</span>
								</div>
							</div>

							<div class="product-actions">
								${
									product.inStock
										? html`
									<button class="btn-primary" ${!user.isLoggedIn ? "disabled" : ""}>
										Add to Cart
									</button>
									${product.quantity < 5 ? html`<span class="low-stock">Only ${product.quantity} left!</span>` : ""}
								`
										: html`
									<button class="btn-secondary" disabled>Out of Stock</button>
								`
								}
							</div>

							${
								config.showAttributes
									? html`
								<div class="product-attributes">
									${Object.entries(product.attributes).map(
										([key, value]) => html`
										<div class="attribute">
											<span class="attr-name">${key}:</span>
											<span class="attr-value">${value}</span>
										</div>
									`,
									)}
								</div>
							`
									: ""
							}
						</div>
					</div>
				`,
				)}
			</div>
		</div>
	`;
};
