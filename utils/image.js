import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { respondLocalImage } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLACEHOLDER_IMAGE_NAME = 'placeholder.jpg';
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
  if (respondLocalImage(req, res)) return;
  return respondPlaceholderImage(req, res);
}

export {
  respondImage
};
