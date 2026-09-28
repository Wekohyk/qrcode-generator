import QRCode from 'qrcode';
import type { EyeStyle, QrStyle } from '@/types/code';

const FINDER = 7;

type QrModules = {
  size: number;
  data: Uint8Array;
};

function moduleInk(style: QrStyle) {
  if (style.color) return style.color;
  return style.module === 'classic' ? '#14181F' : '#2F9B6A';
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('标记加载失败'));
    image.src = src;
  });
}

function createModules(text: string, level: QrStyle['ecc']) {
  const create = (
    QRCode as unknown as {
      create: (
        value: string,
        options: { errorCorrectionLevel: QrStyle['ecc'] },
      ) => { modules: QrModules };
    }
  ).create;
  return create(text, { errorCorrectionLevel: level }).modules;
}

function finderAt(size: number) {
  return [
    [0, 0],
    [0, size - FINDER],
    [size - FINDER, 0],
  ] as const;
}

function inFinder(row: number, col: number, size: number) {
  return finderAt(size).some(
    ([originRow, originCol]) =>
      row >= originRow &&
      row < originRow + FINDER &&
      col >= originCol &&
      col < originCol + FINDER,
  );
}

function cell(index: number, scale: number) {
  return Math.round(index * scale);
}

function traceRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
) {
  ctx.roundRect(x, y, size, size, Math.min(Math.max(radius, 0), size / 2));
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  module: number,
  eye: EyeStyle,
  color: string,
) {
  const outer = module * FINDER;
  const cx = x + outer / 2;
  const cy = y + outer / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (eye === 'circle') {
    ctx.arc(cx, cy, outer / 2, 0, Math.PI * 2);
    ctx.arc(cx, cy, outer / 2 - module, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.beginPath();
    ctx.arc(cx, cy, module * 1.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const outerRadius =
    eye === 'square' ? 0 : eye === 'dot' ? module * 2 : module;
  const holeRadius =
    eye === 'square' ? 0 : eye === 'dot' ? module * 1.15 : module * 0.5;
  const pupilRadius = eye === 'rounded' ? module * 0.45 : 0;
  traceRound(ctx, x, y, outer, outerRadius);
  traceRound(ctx, x + module, y + module, module * 5, holeRadius);
  ctx.fill('evenodd');
  ctx.beginPath();
  if (eye === 'dot') {
    ctx.arc(cx, cy, module * 1.5, 0, Math.PI * 2);
  } else {
    traceRound(ctx, x + module * 2, y + module * 2, module * 3, pupilRadius);
  }
  ctx.fill();
}

function drawModules(
  canvas: HTMLCanvasElement,
  modules: QrModules,
  style: QrStyle,
  width: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const margin = Math.max(0, style.margin);
  const scale = width / (modules.size + margin * 2);
  canvas.width = width;
  canvas.height = width;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, width);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = moduleInk(style);
  for (let row = 0; row < modules.size; row += 1) {
    for (let col = 0; col < modules.size; col += 1) {
      if (!modules.data[row * modules.size + col]) continue;
      if (inFinder(row, col, modules.size)) continue;
      const x = cell(margin + col, scale);
      const y = cell(margin + row, scale);
      ctx.fillRect(
        x,
        y,
        cell(margin + col + 1, scale) - x,
        cell(margin + row + 1, scale) - y,
      );
    }
  }
  ctx.imageSmoothingEnabled = true;
  const eye = style.eye || 'square';
  finderAt(modules.size).forEach(([row, col]) => {
    const x = cell(margin + col, scale);
    const y = cell(margin + row, scale);
    const size = cell(margin + col + FINDER, scale) - x;
    drawEye(ctx, x, y, size / FINDER, eye, moduleInk(style));
  });
}

function opaqueBounds(image: HTMLImageElement, width: number, height: number) {
  const sample = document.createElement('canvas');
  sample.width = width;
  sample.height = height;
  const sampleCtx = sample.getContext('2d');
  if (!sampleCtx) return null;
  sampleCtx.drawImage(image, 0, 0, width, height);
  const pixels = sampleCtx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= 16) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function drawLogo(canvas: HTMLCanvasElement, src: string) {
  const image = await loadImage(src);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const box = canvas.width * 0.22;
  const fit = Math.min(box / image.width, box / image.height);
  const dw = Math.max(1, Math.round(image.width * fit));
  const dh = Math.max(1, Math.round(image.height * fit));
  const drawX = Math.round((canvas.width - dw) / 2);
  const drawY = Math.round((canvas.height - dh) / 2);
  const bounds = opaqueBounds(image, dw, dh);
  if (bounds) {
    const gap = Math.round((5 * canvas.width) / 400);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      drawX + bounds.x - gap,
      drawY + bounds.y - gap,
      bounds.w + gap * 2,
      bounds.h + gap * 2,
    );
  }
  ctx.drawImage(image, drawX, drawY, dw, dh);
}

export async function paintQr(
  canvas: HTMLCanvasElement,
  text: string,
  style: QrStyle,
  width = 280,
) {
  const modules = createModules(text, style.logo ? 'H' : style.ecc);
  drawModules(canvas, modules, style, width);
  if (!style.logo) return;
  try {
    await drawLogo(canvas, style.logo);
  } catch {
    return;
  }
}

export async function qrToBlob(text: string, style: QrStyle, width = 1024) {
  const canvas = document.createElement('canvas');
  await paintQr(canvas, text, style, width);
  return new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

export async function downloadQr(
  text: string,
  style: QrStyle,
  filename: string,
) {
  const blob = await qrToBlob(text, style, style.exportSize || 1000);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
