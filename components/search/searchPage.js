import { page, navList, footerLinks } from '../shared.js';
import { searchApi } from '../../models/search.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const labels = require('../../config/cz.json');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resultItem(item) {
  const title = item?.title || labels.search.untitled;
  const link = item?.link || '#';
  const snippet = item?.snippet || '';
  const displayLink = item?.displayLink || '';
  const isInternalLink = String(link).startsWith('/');
  const linkAttrs = isInternalLink
    ? ''
    : ' target="_blank" rel="noopener noreferrer"';

  return `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title mb-1">
          <a href="${escapeHtml(link)}"${linkAttrs}>${escapeHtml(title)}</a>
        </h5>
        <p class="small text-muted mb-2">${escapeHtml(displayLink)}</p>
        <p class="card-text mb-0">${escapeHtml(snippet)}</p>
      </div>
    </div>
  `;
}

function searchForm(query = '') {
  return `
    <form method="GET" action="/search" class="row g-2 mb-4">
      <div class="col-md-10">
        <input class="form-control" type="search" name="q" value="${escapeHtml(query)}" placeholder="${labels.search.placeholder}" required />
      </div>
      <div class="col-md-2 d-grid">
        <button class="btn btn-primary" type="submit"><i class="bi bi-search me-1"></i>${labels.search.searchButton}</button>
      </div>
    </form>
  `;
}

async function searchPage({ queryParams, authUser }) {
  const q = String(queryParams?.q || '').trim();

  if (!q) {
    return page({
      title: labels.search.pageTitle,
      navList,
      footerLinks,
      authUser,
      content: `
        <h1>${labels.search.title}</h1>
        ${searchForm('')}
        <p class="text-muted">${labels.search.prompt}</p>
      `
    });
  }

  let data = {};
  try {
    data = await searchApi({ queryParams: { q } });
  } catch (error) {
    return page({
      title: `${labels.search.pageTitlePrefix}: ${escapeHtml(q)}`,
      navList,
      footerLinks,
      authUser,
      content: `
        <h1>${labels.search.title}</h1>
        ${searchForm(q)}
        <div class="alert alert-danger">${labels.search.failed}</div>
      `
    });
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const errorMessage = data?.error?.message ? String(data.error.message) : '';

  return page({
    title: `${labels.search.pageTitlePrefix}: ${escapeHtml(q)}`,
    navList,
    footerLinks,
    authUser,
    content: `
      <h1>${labels.search.title}</h1>
      ${searchForm(q)}
      <p class="text-muted">${labels.search.queryLabel}: <strong>${escapeHtml(q)}</strong> | ${labels.search.resultsLabel}: ${items.length}</p>
      ${errorMessage ? `<div class="alert alert-warning">${escapeHtml(errorMessage)}</div>` : ''}
      ${items.length ? items.map(resultItem).join('') : `<p>${labels.search.noResults}</p>`}
    `
  });
}

export { searchPage };
