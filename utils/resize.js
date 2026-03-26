#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);

function printHelp() {
  console.log(`
resize-image - zero-dependency Node.js + WASM image resize utility

Usage:
  resize-image --input <file> --output <file> [options]

Required:
  --input, -i     Input image path (.bmp, .ppm, .jpg, .jpeg, .png)
  --output, -o    Output image path (.bmp, .ppm, .jpg, .jpeg, .png)

Resize options:
  --width, -w     Target width (number)
  --height, -h    Target height (number)

Examples:
  resize-image -i ./photo.bmp -o ./photo-small.bmp -w 1200
  resize-image -i ./photo.ppm -o ./thumb.ppm -h 480
  resize-image -i ./photo.jpg -o ./photo-small.jpg -w 1200
  resize-image -i ./photo.png -o ./photo-small.png -w 1200
`);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === '--help' || token === '-?' || token === 'help') {
      args.help = true;
      continue;
    }

    if (token.startsWith('--')) {
      const key = token.slice(2);
      if (!next || next.startsWith('-')) throw new Error(`Missing value for --${key}`);
      args[key] = next;
      i += 1;
      continue;
    }

    if (token.startsWith('-')) {
      const short = token.slice(1);
      if (!next || next.startsWith('-')) throw new Error(`Missing value for -${short}`);
      const map = { i: 'input', o: 'output', w: 'width', h: 'height' };
      const key = map[short];
      if (!key) throw new Error(`Unknown flag: -${short}`);
      args[key] = next;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function parsePositiveInt(value, name) {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be a positive integer`);
  return n;
}

function extensionOf(filePath) {
  return path.extname(filePath).toLowerCase();
}

function sipsFormatForExt(ext) {
  if (ext === '.jpg' || ext === '.jpeg') return 'jpeg';
  if (ext === '.png') return 'png';
  return null;
}

function isWhitespace(byte) {
  return byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d;
}

function parsePpm(buffer) {
  let i = 0;

  function readToken() {
    while (i < buffer.length) {
      if (buffer[i] === 0x23) {
        while (i < buffer.length && buffer[i] !== 0x0a) i += 1;
      } else if (isWhitespace(buffer[i])) {
        i += 1;
      } else {
        break;
      }
    }

    if (i >= buffer.length) return null;

    const start = i;
    while (i < buffer.length && !isWhitespace(buffer[i])) i += 1;
    return buffer.subarray(start, i).toString('ascii');
  }

  const magic = readToken();
  if (magic !== 'P6') throw new Error('Unsupported PPM format. Only binary P6 is supported.');

  const width = Number.parseInt(readToken(), 10);
  const height = Number.parseInt(readToken(), 10);
  const maxVal = Number.parseInt(readToken(), 10);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid PPM dimensions');
  }
  if (maxVal !== 255) {
    throw new Error('Unsupported PPM max value. Only 255 is supported.');
  }

  while (i < buffer.length && isWhitespace(buffer[i])) i += 1;

  const rgbSize = width * height * 3;
  if (buffer.length - i < rgbSize) {
    throw new Error('PPM pixel data is truncated');
  }

  const rgba = new Uint8Array(width * height * 4);
  const rgb = buffer.subarray(i, i + rgbSize);

  for (let p = 0, q = 0; p < rgb.length; p += 3, q += 4) {
    rgba[q] = rgb[p];
    rgba[q + 1] = rgb[p + 1];
    rgba[q + 2] = rgb[p + 2];
    rgba[q + 3] = 255;
  }

  return { width, height, data: rgba };
}

function encodePpm({ width, height, data }) {
  const header = Buffer.from(`P6\n${width} ${height}\n255\n`, 'ascii');
  const rgb = Buffer.alloc(width * height * 3);

  for (let p = 0, q = 0; q < data.length; p += 3, q += 4) {
    rgb[p] = data[q];
    rgb[p + 1] = data[q + 1];
    rgb[p + 2] = data[q + 2];
  }

  return Buffer.concat([header, rgb]);
}

function parseBmp(buffer) {
  if (buffer.length < 54) throw new Error('Invalid BMP: file too small');
  if (buffer[0] !== 0x42 || buffer[1] !== 0x4d) throw new Error('Invalid BMP signature');

  const pixelOffset = buffer.readUInt32LE(10);
  const dibHeaderSize = buffer.readUInt32LE(14);
  if (dibHeaderSize < 40) throw new Error('Unsupported BMP DIB header');

  const width = buffer.readInt32LE(18);
  const rawHeight = buffer.readInt32LE(22);
  const planes = buffer.readUInt16LE(26);
  const bpp = buffer.readUInt16LE(28);
  const compression = buffer.readUInt32LE(30);

  if (planes !== 1) throw new Error('Unsupported BMP: planes must be 1');
  if (compression !== 0) throw new Error('Unsupported BMP compression');
  if (width <= 0 || rawHeight === 0) throw new Error('Invalid BMP dimensions');
  if (bpp !== 24 && bpp !== 32) throw new Error('Only 24-bit and 32-bit BMP are supported');

  const height = Math.abs(rawHeight);
  const topDown = rawHeight < 0;
  const bytesPerPixel = bpp / 8;
  const rowStride = Math.floor((bpp * width + 31) / 32) * 4;

  if (pixelOffset + rowStride * height > buffer.length) {
    throw new Error('BMP pixel data is truncated');
  }

  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const srcY = topDown ? y : height - 1 - y;
    const srcRow = pixelOffset + srcY * rowStride;

    for (let x = 0; x < width; x += 1) {
      const src = srcRow + x * bytesPerPixel;
      const dst = (y * width + x) * 4;
      data[dst] = buffer[src + 2];
      data[dst + 1] = buffer[src + 1];
      data[dst + 2] = buffer[src];
      data[dst + 3] = bpp === 32 ? buffer[src + 3] : 255;
    }
  }

  return { width, height, data };
}

function encodeBmp({ width, height, data }) {
  const bpp = 24;
  const rowStride = Math.floor((bpp * width + 31) / 32) * 4;
  const pixelBytes = rowStride * height;
  const fileSize = 54 + pixelBytes;

  const out = Buffer.alloc(fileSize);

  out.writeUInt16LE(0x4d42, 0);
  out.writeUInt32LE(fileSize, 2);
  out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14);
  out.writeInt32LE(width, 18);
  out.writeInt32LE(height, 22);
  out.writeUInt16LE(1, 26);
  out.writeUInt16LE(bpp, 28);
  out.writeUInt32LE(0, 30);
  out.writeUInt32LE(pixelBytes, 34);
  out.writeInt32LE(2835, 38);
  out.writeInt32LE(2835, 42);
  out.writeUInt32LE(0, 46);
  out.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y += 1) {
    const dstY = height - 1 - y;
    const row = 54 + dstY * rowStride;

    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4;
      const dst = row + x * 3;
      out[dst] = data[src + 2];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src];
    }
  }

  return out;
}

function decodeImage(inputPath, buffer) {
  const ext = extensionOf(inputPath);
  if (ext === '.ppm') return parsePpm(buffer);
  if (ext === '.bmp') return parseBmp(buffer);
  throw new Error(`Unsupported input format: ${ext || 'unknown'}. Use .bmp, .ppm, .jpg, .jpeg, or .png`);
}

function encodeImage(outputPath, image) {
  const ext = extensionOf(outputPath);
  if (ext === '.ppm') return encodePpm(image);
  if (ext === '.bmp') return encodeBmp(image);
  throw new Error(`Unsupported output format: ${ext || 'unknown'}. Use .bmp, .ppm, .jpg, .jpeg, or .png`);
}

async function convertWithSips(inputPath, outputPath, format) {
  try {
    await execFileAsync('sips', ['-s', 'format', format, inputPath, '--out', outputPath]);
  } catch (error) {
    const stderr = error?.stderr ? ` ${String(error.stderr).trim()}` : '';
    throw new Error(`Failed to convert image with sips.${stderr}`);
  }
}

function resolveTargetSize(srcW, srcH, wantedW, wantedH) {
  if (!wantedW && !wantedH) {
    throw new Error('At least one of --width or --height is required');
  }

  if (wantedW && wantedH) {
    return { width: wantedW, height: wantedH };
  }

  if (wantedW) {
    return { width: wantedW, height: Math.max(1, Math.round((srcH * wantedW) / srcW)) };
  }

  return { width: Math.max(1, Math.round((srcW * wantedH) / srcH)), height: wantedH };
}

const RESIZE_WASM = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x0b, 0x01, 0x60, 0x06, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x01, 0x7f,
  0x03, 0x02, 0x01, 0x00,
  0x07, 0x0c, 0x01, 0x08, 0x6e, 0x6e, 0x5f, 0x69, 0x6e, 0x64, 0x65, 0x78, 0x00, 0x00,
  0x0a, 0x18, 0x01, 0x16, 0x00,
  0x20, 0x01, 0x20, 0x03, 0x6c, 0x20, 0x05, 0x6e, 0x20, 0x02, 0x6c,
  0x20, 0x00, 0x20, 0x02, 0x6c, 0x20, 0x04, 0x6e, 0x6a, 0x0b
]);

let wasmInstancePromise;

async function getWasm() {
  if (!wasmInstancePromise) {
    wasmInstancePromise = WebAssembly.instantiate(RESIZE_WASM).then(({ instance }) => instance);
  }
  return wasmInstancePromise;
}

async function resizeRgbaWasm(src, srcW, srcH, dstW, dstH) {
  const wasm = await getWasm();
  const nnIndex = wasm.exports.nn_index;

  const dst = new Uint8Array(dstW * dstH * 4);

  for (let y = 0; y < dstH; y += 1) {
    for (let x = 0; x < dstW; x += 1) {
      const srcIndexPx = nnIndex(x, y, srcW, srcH, dstW, dstH);
      const srcIndex = srcIndexPx * 4;
      const dstIndex = (y * dstW + x) * 4;

      dst[dstIndex] = src[srcIndex];
      dst[dstIndex + 1] = src[srcIndex + 1];
      dst[dstIndex + 2] = src[srcIndex + 2];
      dst[dstIndex + 3] = src[srcIndex + 3];
    }
  }

  return dst;
}

async function resizeImage({ inputPath, outputPath, width, height, quiet = false }) {
  if (!inputPath || !outputPath) {
    throw new Error('Both inputPath and outputPath are required');
  }

  const wantedW = parsePositiveInt(width, 'width');
  const wantedH = parsePositiveInt(height, 'height');

  const inputExt = extensionOf(inputPath);
  const outputExt = extensionOf(outputPath);
  const supported = new Set(['.bmp', '.ppm', '.jpg', '.jpeg', '.png']);

  if (!supported.has(inputExt)) {
    throw new Error(`Unsupported input format: ${inputExt || 'unknown'}. Use .bmp, .ppm, .jpg, .jpeg, or .png`);
  }
  if (!supported.has(outputExt)) {
    throw new Error(`Unsupported output format: ${outputExt || 'unknown'}. Use .bmp, .ppm, .jpg, .jpeg, or .png`);
  }

  let tempDir;
  const ensureTempDir = async () => {
    if (!tempDir) {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resize-image-'));
    }
    return tempDir;
  };

  try {
    const inputSipsFormat = sipsFormatForExt(inputExt);
    const outputSipsFormat = sipsFormatForExt(outputExt);

    let workingInputPath = inputPath;
    if (inputSipsFormat) {
      const dir = await ensureTempDir();
      workingInputPath = path.join(dir, `input-${randomUUID()}.bmp`);
      await convertWithSips(inputPath, workingInputPath, 'bmp');
    }

    const inputBuffer = await fs.readFile(workingInputPath);
    const decoded = decodeImage(workingInputPath, inputBuffer);
    const target = resolveTargetSize(decoded.width, decoded.height, wantedW, wantedH);

    const resized = await resizeRgbaWasm(decoded.data, decoded.width, decoded.height, target.width, target.height);

    let workingOutputPath = outputPath;
    if (outputSipsFormat) {
      const dir = await ensureTempDir();
      workingOutputPath = path.join(dir, `output-${randomUUID()}.bmp`);
    }

    const encoded = encodeImage(workingOutputPath, {
      width: target.width,
      height: target.height,
      data: resized
    });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(workingOutputPath, encoded);

    if (outputSipsFormat) {
      await convertWithSips(workingOutputPath, outputPath, outputSipsFormat);
    }

    if (!quiet) {
      console.log(`Resized image written to ${outputPath} (${target.width}x${target.height})`);
    }
    return {
      outputPath,
      width: target.width,
      height: target.height
    };
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const inputPath = args.input;
  const outputPath = args.output;

  if (!inputPath || !outputPath) {
    printHelp();
    throw new Error('Both --input and --output are required');
  }

  await resizeImage({
    inputPath,
    outputPath,
    width: args.width,
    height: args.height
  });
}

export {
  resizeImage,
  parseArgs,
  parsePositiveInt,
  resolveTargetSize,
  decodeImage,
  encodeImage,
  resizeRgbaWasm
};

const isCliEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntry) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
