import { page, navList, footerLinks } from '../shared.js';
import { escapeHtml, date, dbDate } from '../../utils/string.js';
import wpPostsModel from '../../models/wp_posts.js';
import wpCommentsModel from '../../models/wp_comments.js';
import { db } from '../../models/wordpressDb.js';
import { redirect } from '../../utils/response.js';

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

function getCommentsForPost(postId) {
  return wpCommentsModel
    .getAll()
    .filter(comment => Number(comment.comment_post_ID) === Number(postId) && String(comment.comment_type || 'comment') === 'comment')
    .sort((a, b) => String(a.comment_date || '').localeCompare(String(b.comment_date || '')));
}

function renderCommentItem(comment) {
  const author = escapeHtml(comment.comment_author || 'Anonymous');
  const when = escapeHtml(date(comment.comment_date) || comment.comment_date || '');
  const content = escapeHtml(comment.comment_content || '').replaceAll('\n', '<br>');

  return `
    <article class="border rounded p-3 mb-2">
      <p class="mb-1"><strong>${author}</strong></p>
      <p class="small text-muted mb-2">${when}</p>
      <p class="mb-0">${content}</p>
    </article>
  `;
}

function renderCommentForm(post, values = {}, error = '', success = false) {
  const detailUrl = `/blog/${encodeURIComponent(post.post_name || '')}`;
  const isClosed = String(post.comment_status || 'open') !== 'open';
  const author = escapeHtml(values.author || '');
  const email = escapeHtml(values.email || '');
  const content = escapeHtml(values.content || '');

  if (isClosed) {
    return `<p class="text-muted mb-0">Comments are closed for this post.</p>`;
  }

  return `
    ${success ? '<div class="alert alert-success">Comment added.</div>' : ''}
    ${error ? `<div class="alert alert-danger">${escapeHtml(error)}</div>` : ''}
    <form method="POST" action="${detailUrl}/comments">
      <div class="mb-2">
        <label class="form-label mb-1" for="comment-author">Name</label>
        <input class="form-control" id="comment-author" name="author" value="${author}" maxlength="100" required />
      </div>
      <div class="mb-2">
        <label class="form-label mb-1" for="comment-email">Email (optional)</label>
        <input class="form-control" id="comment-email" name="email" type="email" value="${email}" maxlength="150" />
      </div>
      <div class="mb-3">
        <label class="form-label mb-1" for="comment-content">Comment</label>
        <textarea class="form-control" id="comment-content" name="content" rows="4" maxlength="4000" required>${content}</textarea>
      </div>
      <button class="btn btn-primary btn-sm" type="submit">Post Comment</button>
    </form>
  `;
}

async function blogDetailPage({ authUser, params, queryParams }) {
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
  const comments = getCommentsForPost(post.ID);
  const commentError = String(queryParams?.error || '').trim();
  const commentSuccess = String(queryParams?.comment || '') === 'added';

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
      <section class="card mt-3" id="comments">
        <div class="card-body">
          <h2 class="h4">Comments (${comments.length})</h2>
          <div class="mb-3">
            ${comments.length ? comments.map(renderCommentItem).join('') : '<p class="text-muted mb-0">No comments yet.</p>'}
          </div>
          <h3 class="h5">Leave a Comment</h3>
          ${renderCommentForm(post, {}, commentError, commentSuccess)}
        </div>
      </section>
    `
  });
}

async function blogCommentSubmitPage({ params, body, req, res }) {
  const blurb = String(params?.blurb || '').trim();
  const post = getPublishedBlogPosts().find(item => item.post_name === blurb);
  const detailUrl = `/blog/${encodeURIComponent(blurb)}`;

  if (!post) {
    redirect(res, '/');
    return '';
  }

  if (String(post.comment_status || 'open') !== 'open') {
    redirect(res, `${detailUrl}?error=${encodeURIComponent('Comments are closed')}#comments`);
    return '';
  }

  const form = new URLSearchParams(typeof body === 'string' ? body : '');
  const author = String(form.get('author') || '').trim();
  const email = String(form.get('email') || '').trim();
  const commentContent = String(form.get('content') || '').trim();

  if (!author || !commentContent) {
    redirect(res, `${detailUrl}?error=${encodeURIComponent('Name and comment are required')}#comments`);
    return '';
  }

  const now = dbDate(new Date());
  const commentAuthorIp = String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '').slice(0, 100);
  const commentAgent = String(req?.headers?.['user-agent'] || '').slice(0, 255);
  const nextCommentId = db.prepare(`
    SELECT COALESCE(MAX(comment_ID), 0) + 1 AS next_id
    FROM wp_comments
  `).get().next_id;

  const insertCommentStmt = db.prepare(`
    INSERT INTO wp_comments (
      comment_ID,
      comment_post_ID,
      comment_author,
      comment_author_email,
      comment_author_url,
      comment_author_IP,
      comment_date,
      comment_date_gmt,
      comment_content,
      comment_karma,
      comment_approved,
      comment_agent,
      comment_type,
      comment_parent,
      user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCommentStmt.run(
    nextCommentId,
    post.ID,
    author,
    email,
    '',
    commentAuthorIp,
    now,
    now,
    commentContent,
    0,
    '1',
    commentAgent,
    'comment',
    nextCommentId,
    Number(post.post_author) || 10001
  );

  const newCommentCount = getCommentsForPost(post.ID).length;
  wpPostsModel.update(post.ID, {
    comment_count: newCommentCount,
    post_modified: now,
    post_modified_gmt: now
  });

  redirect(res, `${detailUrl}?comment=added#comments`);
  return '';
}
export { getPublishedBlogPosts, renderPostCard, blogDetailPage, blogCommentSubmitPage };
