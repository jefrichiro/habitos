import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SPRITE = [
  "................",
  ".......##.......",
  "......####......",
  "......####......",
  ".....######.....",
  ".....######.....",
  "....########....",
  "....###**###....",
  "...###****###...",
  "...##******##...",
  "..###******###..",
  "..##********##..",
  "..###******###..",
  "...##########...",
  "....########....",
  ".....######.....",
];

const PALETTE = {
  ".": [13, 11, 26, 255], // #0d0b1a
  "#": [255, 122, 26, 255], // orange
  "*": [255, 209, 102, 255], // yellow
};

const X_IN_BYTES = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (none)
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    X_IN_BYTES,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function renderSprite(size, coverage) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = PALETTE["."];
  const span = size * coverage;
  const offset = (size - span) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = bg;
      if (x >= offset && x < offset + span && y >= offset && y < offset + span) {
        const sx = Math.min(15, Math.floor(((x - offset) * 16) / span));
        const sy = Math.min(15, Math.floor(((y - offset) * 16) / span));
        color = PALETTE[SPRITE[sy][sx]];
      }
      const i = (y * size + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = color[3];
    }
  }
  return rgba;
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "icons");
fs.mkdirSync(OUT, { recursive: true });

const JOBS = [
  { file: "icon-192.png", size: 192, coverage: 1 },
  { file: "icon-512.png", size: 512, coverage: 1 },
  { file: "icon-maskable-512.png", size: 512, coverage: 0.8 },
  { file: "apple-touch-icon.png", size: 180, coverage: 1 },
];

for (const { file, size, coverage } of JOBS) {
  const png = encodePNG(size, size, renderSprite(size, coverage));
  fs.writeFileSync(path.join(OUT, file), png);
  console.log(`wrote ${file} (${size}x${size}, ${png.length} bytes)`);
}
