
import { Eta } from 'eta';
import { generateTemplateData } from '../data.js';

const eta = new Eta();
const template = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title><%= it.site.name %> - Modern Web Development Blog</title>\n  <meta name=\"description\" content=\"<%= it.site.description %>\">\n</head>\n<body>\n  <header>\n    <h1><%= it.site.name %></h1>\n    <nav>\n      <ul>\n        <% it.site.navigation.forEach(function(item) { %>\n          <li><a href=\"<%= item.url %>\"><%= item.name %></a></li>\n        <% }); %>\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class=\"hero\">\n      <h2>Latest Blog Posts</h2>\n      <p><%= it.site.description %></p>\n    </section>\n\n    <section class=\"posts\">\n      <% it.posts.forEach(function(post) { %>\n        <article class=\"post <%= post.featured ? 'featured' : '' %>\">\n          <header>\n            <h3><a href=\"/blog/<%= post.slug %>\"><%= post.title %></a></h3>\n            <div class=\"meta\">\n              <span class=\"author\">By <%= post.author.name %></span>\n              <span class=\"date\"><%= post.publishedAt.toLocaleDateString() %></span>\n              <span class=\"category\"><%= post.category %></span>\n              <span class=\"read-time\"><%= post.readTime %> min read</span>\n            </div>\n          </header>\n\n          <div class=\"excerpt\">\n            <p><%= post.excerpt %></p>\n          </div>\n\n          <div class=\"tags\">\n            <% post.tags.forEach(function(tag) { %>\n              <span class=\"tag\">#<%= tag %></span>\n            <% }); %>\n          </div>\n\n          <footer class=\"stats\">\n            <span class=\"views\"><%= post.views.toLocaleString() %> views</span>\n            <span class=\"likes\"><%= post.likes.toLocaleString() %> likes</span>\n            <span class=\"comments\"><%= post.comments.toLocaleString() %> comments</span>\n          </footer>\n        </article>\n      <% }); %>\n    </section>\n\n    <nav class=\"pagination\">\n      <% if (it.hasPrevPage) { %>\n        <a href=\"/blog?page=<%= it.currentPage - 1 %>\">Previous</a>\n      <% } %>\n      <span>Page <%= it.currentPage %> of <%= it.totalPages %></span>\n      <% if (it.hasNextPage) { %>\n        <a href=\"/blog?page=<%= it.currentPage + 1 %>\">Next</a>\n      <% } %>\n    </nav>\n  </main>\n\n  <footer>\n    <p>&copy; <%= it.site.year %> <%= it.site.name %>. All rights reserved.</p>\n    <div class=\"social\">\n      <a href=\"https://twitter.com/<%= it.site.social.twitter %>\">Twitter</a>\n      <a href=\"https://github.com/<%= it.site.social.github %>\">GitHub</a>\n      <a href=\"https://linkedin.com/<%= it.site.social.linkedin %>\">LinkedIn</a>\n    </div>\n  </footer>\n</body>\n</html>\n";
const compiled = eta.compile(template);
const data = generateTemplateData();

// Export render function
export function render() {
  return compiled(data, eta);
}

// Ensure it runs
render();
