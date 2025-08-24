
import pug from 'pug';
import { generateTemplateData } from '../data.js';

const template = "doctype html\nhtml(lang=\"en\")\n  head\n    meta(charset=\"UTF-8\")\n    meta(name=\"viewport\" content=\"width=device-width, initial-scale=1.0\")\n    title #{site.name} - Modern Web Development Blog\n    meta(name=\"description\" content=site.description)\n  body\n    header\n      h1= site.name\n      nav\n        ul\n          each item in site.navigation\n            li\n              a(href=item.url)= item.name\n\n    main\n      section.hero\n        h2 Latest Blog Posts\n        p= site.description\n\n      section.posts\n        each post in posts\n          article.post(class=post.featured ? 'featured' : '')\n            header\n              h3\n                a(href=`/blog/${post.slug}`)= post.title\n              .meta\n                span.author By #{post.author.name}\n                span.date= post.publishedAt.toLocaleDateString()\n                span.category= post.category\n                span.read-time #{post.readTime} min read\n\n            .excerpt\n              p= post.excerpt\n\n            .tags\n              each tag in post.tags\n                span.tag ##{tag}\n\n            footer.stats\n              span.views #{post.views.toLocaleString()} views\n              span.likes #{post.likes.toLocaleString()} likes\n              span.comments #{post.comments.toLocaleString()} comments\n\n      nav.pagination\n        if hasPrevPage\n          a(href=`/blog?page=${currentPage - 1}`) Previous\n        span Page #{currentPage} of #{totalPages}\n        if hasNextPage\n          a(href=`/blog?page=${currentPage + 1}`) Next\n\n    footer\n      p &copy; #{site.year} #{site.name}. All rights reserved.\n      .social\n        a(href=`https://twitter.com/${site.social.twitter}`) Twitter\n        a(href=`https://github.com/${site.social.github}`) GitHub\n        a(href=`https://linkedin.com/${site.social.linkedin}`) LinkedIn\n";
const compiled = pug.compile(template);
const data = generateTemplateData();

// Export render function
export function render() {
  return compiled(data);
}

// Ensure it runs
render();
