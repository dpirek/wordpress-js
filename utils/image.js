import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { respondLocalImage } from '../utils/response.js';
import { saveImageFromUrl } from '../utils/proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLACEHOLDER_IMAGE_NAME = 'placeholder-male.jpg';
const IMG_ROOT = path.join(__dirname, '..', 'public/images');
const PLACEHOLDER_IMAGE_PATH = path.join(IMG_ROOT, PLACEHOLDER_IMAGE_NAME);

function respondPlaceholderImage(req, res) {
  if (fs.existsSync(PLACEHOLDER_IMAGE_PATH)) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.createReadStream(PLACEHOLDER_IMAGE_PATH).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Placeholder image not found');
  }
}

function respondImage(req, res) {
  // First serve files uploaded to /img from local storage.
  if (respondLocalImage(req, res)) return;

  // save from server and respond with placeholder
  saveImageFromUrl(req);
  return respondPlaceholderImage(req, res);

  // // Proxy if not local.
  // return proxyImageRequest(req, res);
}

export {
  respondImage
};
