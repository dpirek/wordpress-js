import fs from 'fs';
import path from 'path';

function minify(html) {
  return html
    .replace(/\>[\r\n ]+\</g, "><")
    .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ')
    .trim();
}

function createUrl(text) {
  return text.toLowerCase().replace(/[|&;$%@"<>()+,-]/g, '').replace(/ /g, '-').replace(/--/g, '-');
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    const requestBody = [];
    req.on('data', (chunk) => {
      requestBody.push(chunk);
    }).on('end', () => {
      const body = Buffer.concat(requestBody).toString();
      resolve(JSON.parse(body));
    });
  });
}

function json(res, obj) {
  res.statusCode = 200;

  // CORS
  res.setHeader(`Access-Control-Allow-Origin`, `*`);
  res.setHeader(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE`);
  res.setHeader(`Access-Control-Allow-Headers`, `Content-Type`);

  // JSON
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function formatStateName(text, states) {
  if(text.length === 2) {
    if(states[text.toUpperCase()]) {
      return states[text.toUpperCase()]  + ' ' + text.toUpperCase() + '';
    } else {
      return text.toUpperCase();
    }
  } else {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

function listWithUrl(list) {
  return list.map(item => {
    item.url = createUrl(item.name);
    return item;
  });
}

function trim(text, length){
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function isStaticRequest(url) {
  return url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif');
}

function isLocalRequest(req) {
  return req.headers.host.includes('localhost');
}

function contentType(url) {
  const contentTypes = {
    js: 'application/javascript',
    html: 'text/html',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    json: 'application/json',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    wasm: 'application/wasm',
    map: 'application/json',
    webmanifest: 'application/manifest+json',
    woff: 'font/woff',
    '/': 'text/html',
    '': 'text/plain'
  };

  return contentTypes[url.split('.').pop()];
}

function loadJson(path) {
  try {
    const contentString = fs.readFileSync(path, 'utf8');
    return JSON.parse(contentString);
  } catch (err) {
    console.error(err);
    return null;
  } 
}

function loadText(path) {
  try {
    return fs.readFileSync(path, 'utf8');;
  } catch (err) {
    console.error(err);
    return null;
  } 
}

function parseEnv() {
  const env = {};
  const envString = fs.readFileSync('.env', 'utf8');
  const envArray = envString.split('\n');
  envArray.forEach(item => {
    const key = item.split('=')[0];
    const value = item.split('=')[1];
    env[key] = value;
  });
  return env;
}

function htmlToText (html) {
  return html
  .replace(/<[^>]+>/g, ' ') // remove html tags
  .replace(/  +/g, '') // remove extra spaces
  .replace(/Job Post Details/g, ' ') // remove header
  .replace(/Return to Search Result/g, ' ') // remove nav txt
  .replace(/\n\s*\n/g, '\n') // remove empty lines
  .replace(/^\s+|\s+$/g, ''); // trim lines
}

function textToHtml (text) {  
  return text.split('\n').map(line => {
    if(line.trim() === '') return '';
    if(line.includes('#')) return `<h3>${line.replace('#', '')}</h3>`;
    return `<p>${line}</p>`;
  }).join(''); 
}

function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: 'rk', seconds: 31536000 },
    { label: 'měs', seconds: 2592000 },
    { label: 'dn', seconds: 86400 },
    { label: 'hod', seconds: 3600 },
    { label: 'min', seconds: 60 },
    { label: 'sek', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? '' : ''}`;
    }
  }
  return 'právě teď';
}

function isTextOnly(text) {

  // has sql injection patterns
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))(\s)*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // has japanese, chinese, arabic, cyrillic characters
  if (/[一-龥ぁ-ゔァ-ヴー々〆〤ء-يЀ-ӿ]/.test(text)) {
    return false;
  }

  // has html tags
  return !/<[a-z][\s\S]*>/i.test(text);
}

function dbDate(date) {
  return date.getUTCFullYear() + '-' +
    ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
    ('00' + date.getUTCDate()).slice(-2) + ' ' +
    ('00' + date.getUTCHours()).slice(-2) + ':' +
    ('00' + date.getUTCMinutes()).slice(-2) + ':' +
    ('00' + date.getUTCSeconds()).slice(-2);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeBody(body) {
  if (typeof body === 'string') return new URLSearchParams(body);
  if (body && typeof body === 'object') return body;
  return {};
}

function field(source, key) {
  if (source?.get) return source.get(key) || '';
  return source?.[key] || '';
}

function fileExtension(filename, mimeType) {
  const ext = (path.extname(filename || '').toLowerCase() || '').replace('.', '');
  const allowed = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
  if (allowed.has(ext)) return ext === 'jpeg' ? 'jpg' : ext;

  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };

  return mimeMap[(mimeType || '').toLowerCase()] || '';
}

function tag(tagName, content = '', attributes = {}) {
  const attrs = Object.entries(attributes).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join('');
  return `<${tagName}${attrs}>${content}</${tagName}>`;
}

function date(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export {
  minify,
  createUrl,
  parseBody,
  json,
  formatStateName,
  listWithUrl,
  trim,
  isStaticRequest,
  isLocalRequest,
  contentType,
  loadJson,
  parseEnv,
  htmlToText,
  textToHtml,
  loadText,
  timeAgo,
  isTextOnly,
  dbDate,
  escapeHtml,
  normalizeBody,
  field,
  fileExtension,
  date,
  tag
};
