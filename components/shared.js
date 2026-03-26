import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const labels = require('../config/cz.json');

const navList = [
  { text: 'home', url: '/', icon: 'bi-file-earmark-text' },
];

const defaultFooterLinks = [
  { name: 'about', url: '/o-nas' }
];

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function userAvatarUrl(authUser = {}) {
  const fromSession = String(authUser?.userImage || '').trim();
  if (fromSession) {
    if (fromSession.startsWith('http://') || fromSession.startsWith('https://') || fromSession.startsWith('/')) {
      return fromSession;
    }
    return `/img/${encodeURIComponent(fromSession)}`;
  }

  const sex = String(authUser?.userSex || '').trim().toLowerCase();
  return sex === 'z' || sex === 'f'
    ? '/images/placeholder-female.jpg'
    : '/images/placeholder-male.jpg';
}

function logo({ width = 40, color = '#000000' } = {}) {
  return `<img src="/images/javascript-logo-svgrepo-com.svg" alt="JavaScript logo" width="${width}" height="${width}" />`;
}

function footer(footerLinks) {
  const year = new Date().getFullYear();
  const companyName = 'WordPress JS';

  return `<footer class="d-flex flex-wrap justify-content-between align-items-center p-3 my-4 border-top container-fluid">
      <div class="col-md-6 d-flex align-items-center">
        <span class="mb-3 mb-md-0 text-body-secondary">© ${year} ${companyName}</span>
      </div>
      <ul class="nav col-md-6 justify-content-end list-unstyled d-flex">
        ${footerLinks.map((item, i) => `<li><a class="nav-link px-2 link-dark" href="${item.url}">${item.name}</a></li>`).join('')}
      </ul>
    </footer>`;
}

function user(authUser, { mobile = false } = {}) {
  if (mobile) {
    if (authUser?.userId) {
      return `
        <li>
          <a class="nav-link px-2 link-dark" href="/user/edit">
            <i class="bi bi-person-gear me-1"></i>Edit profile
          </a>
        </li>
        <li>
          <a class="nav-link px-2 link-dark" href="/user/${encodeURIComponent(authUser.userId)}/edit">
            <i class="bi bi-gear me-1"></i>Settings
          </a>
        </li>
        <li>
          <a class="nav-link px-2 link-dark" href="/user/logout">
            <i class="bi bi-box-arrow-right me-1"></i>${labels.shared.auth.logout}
          </a>
        </li>
      `;
    }

    return `
      <li>
        <a class="nav-link px-2 link-dark" href="/user/login">
          <i class="bi bi-box-arrow-in-right me-1"></i>Login
        </a>
      </li>
      <li>
        <a class="nav-link px-2 link-dark" href="/user/register">
          <i class="bi bi-person-plus me-1"></i>Register
        </a>
      </li>
    `;
  }

  if(authUser?.userId) {
    const avatarUrl = userAvatarUrl(authUser);
    const userId = escapeHtml(authUser.userId);
    return `<div class="d-flex align-items-center">
      <details class="user-menu-dropdown">
        <summary class="user-menu-trigger" title="User menu" aria-label="User menu">
          <img src="${escapeHtml(avatarUrl)}" alt="${userId}" style="width: 100%; height: 100%; object-fit: cover;" />
        </summary>
        <div class="user-menu-panel">
          <a href="/user/edit" class="user-menu-link">
            <i class="bi bi-person-gear me-2"></i>Edit profile
          </a>
          <a href="/user/${encodeURIComponent(authUser.userId)}/edit" class="user-menu-link">
            <i class="bi bi-gear me-2"></i>Settings
          </a>
          <a href="/user/logout" class="user-menu-link">
            <i class="bi bi-box-arrow-right me-2"></i>${labels.shared.auth.logout}
          </a>
        </div>
      </details>
    </div>`;
  } 
  return `<div class="d-flex align-items-center">
    <a href="/user/login" class="btn btn-outline-primary btn-sm">Login</a>
    <a href="/user/register" class="btn btn-primary btn-sm ms-2">Register</a>
  </div>`;
}

function nav(navList, authUser = {}) {
  return `
    <header class="site-header mb-3 p-md-3 border-bottom">
      <div class="container-fluid">
        <div class="mobile-header-row d-flex align-items-center justify-content-between mb-2 d-md-none">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm py-0 px-2"
            id="mobile-nav-toggle"
            aria-expanded="false"
            aria-controls="mobile-nav-menu"
            aria-label="Toggle navigation"
          >
            <i class="bi bi-list fs-5"></i>
          </button>
          <form class="mobile-header-search ms-3 flex-grow-1" role="search" action="/search" method="GET">
            <div class="input-group input-group-sm">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input name="q" type="search" class="form-control" 
                placeholder="Search..." aria-label="Search">
            </div>
          </form>
        </div>

        <div id="mobile-nav-menu" class="d-none d-md-none pb-2">
          <ul class="nav flex-column mb-2">
            ${navList.map((item) => `
              <li>
                <a class="nav-link px-2 link-dark" href="${item.url}">
                  ${item.icon ? `<i class="bi ${item.icon} me-1"></i>` : ''}${item.text}
                </a>
              </li>
            `).join('')}
            ${user(authUser, { mobile: true })}
          </ul>
        </div>

        <div class="d-none d-md-flex flex-wrap align-items-center justify-content-start">
          <a href="/" class="d-flex align-items-center mb-2 mb-sm-0 text-dark text-decoration-none me-3">
            ${logo()}
          </a>

          <ul class="nav col-auto me-auto justify-content-center mb-md-0">
            ${navList.map((item) => `
              <li>
                <a class="nav-link px-2 link-dark" href="${item.url}">
                  ${item.icon ? `<i class="bi ${item.icon} me-1"></i>` : ''}${item.text}
                </a>
              </li>
            `).join('')}
          </ul>
          
          <form class="col-12 col-md-auto mb-3 mb-md-0 me-md-3" role="search" action="/search" method="GET">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input name="q" type="search" class="form-control" placeholder="Search..." aria-label="Search">
            </div>
          </form>
          <div class="d-flex align-items-center">
            ${user(authUser, { mobile: false })}
          </div>
        </div>
      </div>
    </header>`;
}

function htmlTag(name, content, attributes = {}) {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${value}"`)
    .join('');
  return `<${name}${attrs}>${content}</${name}>`;
}

function cssLink({ href }) {
  const rel = 'stylesheet';
  const integrity = 'sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC';
  const crossorigin = 'anonymous';
  return htmlTag('link', '', { href, rel, integrity, crossorigin });
}

function plainCssLink({ href }) {
  return htmlTag('link', '', { href, rel: 'stylesheet' });
}

function javascriptLink({ src, type = 'module' }) {
  return htmlTag('script', '', { src, type });
}

function pwaHead() {
  return `
    <link rel="manifest" href="/manifest.webmanifest">
    <meta name="theme-color" content="#414141">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  `;
}

function camelToKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function styleString(styles = {}) {
  return Object.entries(styles)
    .map(([key, value]) => `${camelToKebabCase(key)}: ${value};`)
    .join(' ');
}

function style(selector, styles = {}) {
  return `${selector} { ${styleString(styles)} }`;
}

function page({ 
  title = 'title...', 
  content = 'content...', 
  footerLinks = defaultFooterLinks, 
  navList = [], 
  authUser = {}, 
  fullWidth = false,
  hideFooter = false,
  javascriptLinks = ['/js/pages/all.js']
}) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <title>${title}</title>
        ${pwaHead()}
        ${cssLink({ href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css' })}
        ${plainCssLink({ href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' })}
        ${htmlTag('style', `
          ${style('.page-wrapper', {
            minHeight: '80vh',
          })}
          ${style('.user-menu-dropdown', {
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          })}
          ${style('.user-menu-dropdown summary', {
            listStyle: 'none'
          })}
          .user-menu-dropdown summary::-webkit-details-marker { display: none; }
          ${style('.user-menu-trigger', {
            width: '36px',
            height: '36px',
            borderRadius: '999px',
            border: '1px solid #ced4da',
            overflow: 'hidden',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          })}
          ${style('.user-menu-panel', {
            position: 'absolute',
            right: '0',
            top: 'calc(100% + 8px)',
            minWidth: '180px',
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            padding: '.4rem 0',
            zIndex: '1050'
          })}
          ${style('.user-menu-link', {
            display: 'flex',
            alignItems: 'center',
            color: '#212529',
            textDecoration: 'none',
            padding: '.45rem .75rem',
            fontSize: '.95rem'
          })}
          ${style('.user-menu-link:hover', {
            backgroundColor: '#f8f9fa'
          })}
          @media (max-width: 767.98px) {
            .site-header {
              position: sticky;
              top: 0;
              z-index: 1030;
              background-color: #fff;
              padding-top: 0.5rem !important;
              padding-bottom: 0.5rem !important;
            }
            .mobile-header-row {
              margin-bottom: 0 !important;
            }
          }
        `)}
      </head>
      <body>
        ${nav(navList, authUser)}
        <main role="main" class="${fullWidth ? 'container-fluid' : 'container'} page-wrapper">
          <div class="row">
            <div class="col-md-12">
              ${content}
            </div>
          </div>
        </main>
        ${hideFooter ? '' : footer(footerLinks)}
        ${javascriptLinks.map(link => javascriptLink({ src: link })).join('')}
      </body>
    </html>`;
}

function simplePage({ title, content, styles = '' }) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <title>${title}</title>
        ${pwaHead()}
        ${cssLink({ href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css' })}
        ${plainCssLink({ href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css' })}
        <style type="text/css" media="all">${styles}</style>
      </head>
      <body>
        ${content}
      </body>
    </html>`;
}

export {
  navList,
  defaultFooterLinks as footerLinks,
  logo,
  page,
  simplePage
};
