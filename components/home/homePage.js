import { page, navList, footerLinks } from '../shared.js';
import { escapeHtml, date } from '../../utils/string.js';
import wpPostsModel from '../../models/wp_posts.js';

function toPreviewText(postContent = '', postExcerpt = '') {
  const fromExcerpt = String(postExcerpt || '').trim();
  if (fromExcerpt) {
    return fromExcerpt;
  }

  const plainContent = String(postContent || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainContent) {
    return '';
  }

  return plainContent.length > 180 ? `${plainContent.slice(0, 180)}...` : plainContent;
}

function renderPostCard(post) {
  const title = escapeHtml(post.post_title || 'Untitled');
  const preview = escapeHtml(toPreviewText(post.post_content, post.post_excerpt));
  const slug = escapeHtml(post.post_name || '');
  const postDate = escapeHtml(date(post.post_date) || post.post_date || '');
  const status = escapeHtml(post.post_status || '');
  const detailUrl = `/blog/${encodeURIComponent(post.post_name || '')}`;

  return `
    <article class="card mb-3">
      <div class="card-body">
        <h2 class="h5 mb-1"><a href="${detailUrl}" class="text-decoration-none">${title}</a></h2>
        <p class="small text-muted mb-2">
          <span>${postDate}</span>
          ${slug ? `<span class="ms-2">/${slug}</span>` : ''}
          <span class="badge bg-light text-dark border ms-2">${status}</span>
        </p>
        ${preview ? `<p class="card-text mb-3">${preview}</p>` : ''}
        <a class="btn btn-sm btn-outline-primary" href="${detailUrl}">Read Post</a>
      </div>
    </article>
  `;
}

function getPublishedBlogPosts() {
  return wpPostsModel
    .getAll()
    .filter(post => post.post_type === 'post' && post.post_status === 'publish');
}

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

async function blogDetailPage({ authUser, params }) {
  const blurb = String(params?.blurb || '').trim();
  const post = getPublishedBlogPosts().find(item => item.post_name === blurb);

  if (!post) {
    return page({
      authUser,
      navList,
      footerLinks,
      title: 'Post Not Found',
      content: `
        <h1 class="hr">Post Not Found</h1>
        <p class="text-muted">No published post found for this URL.</p>
        <a class="btn btn-outline-primary btn-sm" href="/">Back to Blog</a>
      `
    });
  }

  const title = escapeHtml(post.post_title || 'Untitled');
  const postDate = escapeHtml(date(post.post_date) || post.post_date || '');
  const slug = escapeHtml(post.post_name || '');
  const content = String(post.post_content || '').trim();
  const safeContent = content ? content : '<p class="text-muted">No content.</p>';

  return page({
    authUser,
    navList,
    footerLinks,
    title,
    content: `
      <article class="card">
        <div class="card-body">
          <a class="btn btn-outline-secondary btn-sm mb-3" href="/">Back</a>
          <h1 class="mb-2">${title}</h1>
          <p class="small text-muted mb-4">
            <span>${postDate}</span>
            ${slug ? `<span class="ms-2">/${slug}</span>` : ''}
          </p>
          <div class="blog-post-content">${safeContent}</div>
        </div>
      </article>
    `
  });
}

async function aboutPage({ authUser }) {
  return page({
    authUser: authUser,
    navList: navList,
    footerLinks,
    title: 'about',
    content: `
      <h1 class="hr">About us</h1>
    `
  });
}

export { homePage, blogDetailPage, aboutPage };
