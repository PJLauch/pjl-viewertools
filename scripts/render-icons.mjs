import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const sizes = [16, 32, 48, 96, 128];
const scale = 4;
const purple = [145, 71, 255, 255];
const white = [255, 255, 255, 255];
const mint = [125, 226, 184, 255];

for (const size of sizes) {
  const width = size * scale;
  const pixels = new Uint8Array(width * width * 4);
  const sx = width / 128;
  const insideRounded = (x, y, left, top, right, bottom, radius) => {
    const cx = Math.max(left + radius, Math.min(x, right - radius));
    const cy = Math.max(top + radius, Math.min(y, bottom - radius));
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
  };
  const insidePolygon = (x, y, points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const shapes = [
    { color: purple, contains: (x, y) => insideRounded(x, y, 8, 8, 120, 114, 12) || insidePolygon(x, y, [[25, 108], [49, 108], [25, 124]]) },
    { color: white, contains: (x, y) => (x >= 24 && x <= 35 && y >= 34 && y <= 82) || (x >= 35 && x <= 48 && y >= 34 && y <= 44) || (x >= 35 && x <= 48 && y >= 52 && y <= 62) || (x >= 48 && x <= 58 && y >= 42 && y <= 54) },
    { color: mint, contains: (x, y) => insidePolygon(x, y, [[61, 34], [75, 34], [75, 82], [45, 82], [45, 64], [56, 64], [56, 71], [64, 71], [64, 44], [61, 44]]) },
    { color: white, contains: (x, y) => (x >= 82 && x <= 93 && y >= 34 && y <= 82) || (x >= 92 && x <= 108 && y >= 71 && y <= 82) }
  ];
  for (let py = 0; py < width; py++) {
    for (let px = 0; px < width; px++) {
      const x = (px + 0.5) / sx;
      const y = (py + 0.5) / sx;
      for (const shape of shapes) {
        if (!shape.contains(x, y)) continue;
        pixels.set(shape.color, (py * width + px) * 4);
      }
    }
  }
  const output = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      for (let channel = 0; channel < 4; channel++) {
        let total = 0;
        for (let sy = 0; sy < scale; sy++) for (let sx2 = 0; sx2 < scale; sx2++) {
          total += pixels[(((y * scale + sy) * width + x * scale + sx2) * 4) + channel];
        }
        output[(y * size + x) * 4 + channel] = Math.round(total / (scale * scale));
      }
    }
  }
  mkdirSync("public/icon", { recursive: true });
  writeFileSync(`public/icon/${size}.png`, encodePng(size, size, output));
}

function encodePng(width, height, rgba) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const offset = y * (width * 4 + 1);
    scanlines[offset] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(scanlines, offset + 1);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(scanlines)), chunk("IEND", Buffer.alloc(0))]);
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const body = Buffer.concat([name, data]);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  body.copy(result, 4);
  result.writeUInt32BE(crc32(body), data.length + 8);
  return result;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
