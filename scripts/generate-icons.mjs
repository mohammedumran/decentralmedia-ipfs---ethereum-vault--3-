import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function createPngBuffer(width, height) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 implementation
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.42;
  const rInner = width * 0.25;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter 0 (None)
    
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background (Dark Slate #020617 to #0f172a)
      const t = (x + y) / (width + height);
      let r = Math.round(2 + t * 13);
      let g = Math.round(6 + t * 17);
      let b = Math.round(23 + t * 19);
      let a = 255;

      // Outer ring (Cyan #06b6d4 to Violet #8b5cf6)
      if (Math.abs(dist - rOuter) < width * 0.04) {
        const ringT = (x / width);
        r = Math.round(6 + ringT * 133);
        g = Math.round(182 - ringT * 90);
        b = Math.round(212 + ringT * 34);
      } else if (dist <= rInner) {
        // Inner glowing core
        const coreT = 1 - (dist / rInner);
        r = Math.round(6 * (1 - coreT) + 34 * coreT);
        g = Math.round(182 * (1 - coreT) + 211 * coreT);
        b = Math.round(212 * (1 - coreT) + 238 * coreT);
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPngBuffer(192, 192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPngBuffer(512, 512));
console.log('Icons generated successfully: icon-192.png and icon-512.png');
