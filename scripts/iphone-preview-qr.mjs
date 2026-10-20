import { mkdirSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { toQR } from 'toqr';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function writeIphonePreviewQr(port) {
  const address = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || Object.values(networkInterfaces()).flat().find((entry) => entry?.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.'))?.address;
  if (!address) return null;
  const url = `exp://${address}:${port}`;
  const matrix = toQR(url);
  const extent = Math.sqrt(matrix.byteLength);
  const quiet = 4, scale = 9;
  const size = (extent + quiet * 2) * scale;
  const pixels = Buffer.alloc((size * 3 + 1) * size, 255);
  for (let y = 0; y < size; y++) {
    pixels[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / scale) - quiet, column = Math.floor(x / scale) - quiet;
      if (row >= 0 && row < extent && column >= 0 && column < extent && matrix[row * extent + column]) {
        const offset = y * (size * 3 + 1) + 1 + x * 3;
        pixels.fill(0, offset, offset + 3);
      }
    }
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const head = Buffer.alloc(4), tail = Buffer.alloc(4);
    head.writeUInt32BE(data.length); tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
  const path = resolve('.expo', 'iphone-preview-qr.png');
  mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, png);
  return { url, path };
}
