import fs from 'fs';
import url from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import { contentType } from './string.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_ROOT = path.join(__dirname, '..', 'public');
const IMG_ROOT = path.join(__dirname, '..', 'img');

function redirect(res, url) {
  res.writeHead(302, { 'Location': url });
  res.end();
}

function respondHtml(res, data) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(data);
}

function respondJson(res, data, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function staticFile(res, url, type = 'text/plain') {
  res.statusCode = 200;
  res.writeHead(200, {'Content-Type': contentType(url)});
  try {
    fs.accessSync(__dirname + url, fs.constants.R_OK);
  } catch(err) {
    res.statusCode = 404;
    return res.end('404 Not Found');
  }
  res.end(fs.readFileSync(__dirname + url));
}

function serverStatic(req, res) {
  try {
    let { pathname } = url.parse(req.url);
    res.writeHead(200, {'Content-Type': contentType(pathname)});

    if(pathname === '/') pathname = '/index.html';
    if(pathname === '/favicon.ico') return res.end();

    const fileContent = fs.readFileSync(STATIC_ROOT + pathname);
    
    if(fileContent === null) return res.end('not found');
    return res.end(fileContent);
  } catch (exception) {
    console.error('exception found..', exception);
  }
}

function serverIndex(req) {
  const file = fs.readFileSync(STATIC_ROOT + '/index.html');  
  return file.toString();
}

function isStaticRequest(req) {
  const { pathname } = url.parse(req.url);
  if (pathname === '/favicon.ico') return true;
  const staticFiles = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.map', '.wasm', '.json', '.svg', '.ico', '.html', '.webmanifest'];
  return staticFiles.some(ext => pathname.endsWith(ext));
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>404 Not Found</h1><p>The page you are looking for does not exist.</p>');
}

function notFoundJson(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
}

function notAuthorizedJson(res) {
  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Unauthorized' }));
}

function notAuthorizedHtml(res) {
  res.statusCode = 401;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>401 Unauthorized</h1><p>You are not authorized to access this resource.</p>');
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    const requestBody = [];
    req.on('data', (chunk) => {
      requestBody.push(chunk);
    }).on('end', () => {
      const rawBody = Buffer.concat(requestBody);
      const contentType = req.headers['content-type'] || '';
      if (contentType.startsWith('multipart/form-data')) {
        return resolve(rawBody);
      }
      const body = rawBody.toString().trim();
      const isJsonContentType = contentType.toLowerCase().includes('application/json');
      const isApiRoute = (req.url || '').toLowerCase().startsWith('/api/');
      const looksLikeJson = body.startsWith('{') || body.startsWith('[');

      if (isJsonContentType || (isApiRoute && looksLikeJson)) {
        if (!body) return resolve({});
        try {
          return resolve(JSON.parse(body));
        } catch (e) {
          return reject(new Error('Invalid JSON'));
        }
      }

      resolve(body);
    });
  });
}

function shouldBlockRequest(req) {
  const url = req.url.toLowerCase();
  if (url.includes('.php')) return true;
  if (url.includes('.aspx')) return true;
  if (url.includes('https://')) return true;
  if (url.includes('www.')) return true;
  if (url.includes('com.chrome.devtools.json')) return true;
  if (url.includes('chrome-devtools')) return true;
  const userAgent = req.headers['user-agent'] || '';
  const blockedAgents = [
    'curl', 
    'wget', 
    'python-requests', 
    'httpclient'
  ];
  return blockedAgents.some(agent => userAgent.toLowerCase().includes(agent));
}

function respondLocalImage(req, res) {
  const pathOnly = decodeURIComponent(req.url.split('?')[0] || '');
  const normalized = path.normalize(pathOnly).replace(/^(\.\.(\/|\\|$))+/, '');
  const relativePath = normalized.replace(/^[/\\]+/, '');
  const localPath = path.join(IMG_ROOT, relativePath.replace(/^img[\\/]/, ''));
  
  if (localPath.startsWith(IMG_ROOT) && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    res.writeHead(200, { 'Content-Type': contentType(localPath) });
    fs.createReadStream(localPath).pipe(res);
    return true;
  }

  return false;
}

function isImageRequest(req) {
  const url = req.url.toLowerCase();
  return url.startsWith('/img/') && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif'));
}

export {
  redirect,
  staticFile,
  notFound,
  notFoundJson,
  notAuthorizedJson,
  notAuthorizedHtml,
  contentType,
  isStaticRequest,
  serverStatic,
  serverIndex,
  respondJson,
  respondHtml,
  parseBody,
  shouldBlockRequest,
  respondLocalImage,
  isImageRequest
};
