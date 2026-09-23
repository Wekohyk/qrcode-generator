import QRCode from 'qrcode';
import type { QrStyle } from '@/types/code';

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

async function drawLogo(canvas: HTMLCanvasElement, src: string) {
  const image = await loadImage(src);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width * 0.22;
  const pad = size * 0.14;
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - size) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - pad, y - pad, size + pad * 2, size + pad * 2, 8);
  ctx.fill();
  ctx.drawImage(image, x, y, size, size);
}

export async function paintQr(
  canvas: HTMLCanvasElement,
  text: string,
  style: QrStyle,
  width = 280,
) {
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: style.logo ? 'H' : style.ecc,
    margin: style.margin,
    width,
    color: {
      dark: moduleInk(style),
      light: '#FFFFFF',
    },
  });
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
