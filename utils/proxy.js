import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const isDev = process.env.NODE_ENV === 'DEVELOPMENT';
const remoteServer = isDev ? 'derkova.davidpirek.com:8081' : '192.168.1.251:8081';
const LEGACY_SERVER_URL = `http://${remoteServer}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMG_ROOT = path.join(__dirname, '..', 'img');
const IMG_SIZE = 550;

function saveImageFromUrl(req) {
  const fileName = req.url.split('/').pop().split('?')[0];
  const imageUrl = `${LEGACY_SERVER_URL}/img/?f=${fileName}&w=${IMG_SIZE}&h=${IMG_SIZE}`;

  http.get(imageUrl, (imageRes) => {
    if (imageRes.statusCode === 200) {
      const filePath = path.join(IMG_ROOT, fileName);
      const fileStream = fs.createWriteStream(filePath);

      imageRes.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
      });
    } else {
      console.error(`Failed to fetch image: ${imageUrl} - Status Code: ${imageRes.statusCode}`);
    }
  }).on('error', (e) => {
    console.error(`Error fetching image: ${e.message}`);
  });
}

function proxyImageRequest(req, res) {
  const fileName = req.url.split('/').pop().split('?')[0];
  const url = `/img/?f=${fileName}&w=${IMG_SIZE}&h=${IMG_SIZE}`;
  const imageUrl = `${LEGACY_SERVER_URL}${url}`;

  http.get(imageUrl, (imageRes) => {
    res.writeHead(imageRes.statusCode, imageRes.headers);
    imageRes.pipe(res);
  }).on('error', (e) => {
    res.writeHead(500);
    res.end(`Error fetching image: ${e.message}`);
  });
}

export { proxyImageRequest, saveImageFromUrl };
