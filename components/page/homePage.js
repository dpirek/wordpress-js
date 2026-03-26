import { page, navList, footerLinks } from '../shared.js';
import { getPublishedBlogPosts, renderPostCard } from '../blog/homePage.js';

async function homePage({ authUser }) {
  const posts = getPublishedBlogPosts()
    .sort((a, b) => String(b.post_date || '').localeCompare(String(a.post_date || '')));

  return page({
    authUser,
    navList,
    footerLinks,
    title: 'Blog',
    javascriptLinks: [],
    content: `
      <h1 class="hr">Blog Posts</h1>
      <p class="text-muted">Published posts: ${posts.length}</p>
      ${posts.length ? posts.map(renderPostCard).join('') : '<p>No published posts found.</p>'}
    `
  });
}

export { homePage };
