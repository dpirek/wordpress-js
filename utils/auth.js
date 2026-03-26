import crypto from 'crypto';
import { redirect } from './response.js';

const SECRET = process.env.SECRET || '3828aaf8ba32fe3006d37c7f3ac46bcb';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'wordpress_js_auth';

function encryptCookie(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET), iv);
  let encrypted = cipher.update(JSON.stringify(value));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptCookie(cookie) {
  try {
    const [iv, encrypted] = cookie.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (e) {
    return null;
  }
}

function getCookie(req, key) {
  const cookies = {};
  req.headers.cookie && req.headers.cookie.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    cookies[parts[0].trim()] = (parts[1] || '').trim();
  });
  return cookies[key];
}

function setCookie(res, key, value, options = {}) {
  const cookieParts = [`${key}=${value}`];
  if(options.httpOnly) cookieParts.push('HttpOnly');
  if(options.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`);
  if(options.path) cookieParts.push(`Path=${options.path}`);
  if(options.domain) cookieParts.push(`Domain=${options.domain}`);
  if(options.secure) cookieParts.push('Secure');
  if(options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function removeCookie(res, key) {
  // Must match original cookie path; otherwise the browser keeps the old cookie.
  res.setHeader('Set-Cookie', `${key}=; Max-Age=0; Path=/; HttpOnly`);
}

function getUserFromRequest(req) {
  const cookie = getCookie(req, AUTH_COOKIE_NAME);
  if (!cookie) return null;
  return decryptCookie(cookie);
}

function login(res, userId, userRole = 'user', userSex = null, userDistrict = null, userImage = null, referer = '/') {
  startSession(res, userId, userRole, userSex, userDistrict, userImage);
  redirect(res, referer);
}

function startSession(res, userId, userRole = 'user', userSex = null, userDistrict = null, userImage = null) {
  const authData = { 
    userId,
    userSex,
    userDistrict,
    userImage,
    userRole, 
    date: new Date().toISOString() 
  };
  const encrypted = encryptCookie(authData);
  setCookie(res, AUTH_COOKIE_NAME, encrypted, { httpOnly: true, maxAge: 3600, path: '/' });
}

function logout(req, res) {
  removeCookie(res, AUTH_COOKIE_NAME);
  redirect(res, req.headers.referer || '/');
}

export {
  encryptCookie,
  decryptCookie,
  getCookie,
  setCookie,
  removeCookie,
  login,
  startSession,
  logout,
  getUserFromRequest
};
