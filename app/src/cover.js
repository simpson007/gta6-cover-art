// Vice City Cover Studio — cover renderer.
// Draws a multi-panel GTA-style poster onto any 2d canvas at export resolution.
// Everything here is original: the sunset grade, skyline and palm silhouettes are
// drawn with canvas paths, and the lettering uses Anton (SIL OFL, vendored locally).

export const SIZES = {
  square: { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  landscape: { label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  triptych: { label: 'Triptych', hint: 'Three vertical panels' },
  hero: { label: 'Hero + strip', hint: 'Big hero panel over a 3-photo strip' },
  duo: { label: 'Duo', hint: 'Two tall panels side by side' },
  single: { label: 'Single', hint: 'One full-bleed photo' },
};

export const CAPTION_STYLES = {
  sunset: { label: 'Sunset', stops: ['#ffd166', '#ff7b54', '#ff2e88'] },
  neon: { label: 'Neon pink', stops: ['#ff5ce1', '#ff2e88', '#b537f2'] },
  gold: { label: 'Gold', stops: ['#fff3b0', '#ffd166', '#ff9f1c'] },
  vice: { label: 'Vice purple', stops: ['#e0aaff', '#9d4edd', '#5a189a'] },
  white: { label: 'White', stops: ['#ffffff', '#f8f9fa', '#dee2e6'] },
};

export const GRADES = {
  sunset: { label: 'Vice sunset', top: 'rgba(255,46,136,0.34)', mid: 'rgba(255,123,54,0.22)', bot: 'rgba(90,24,154,0.42)' },
  neon: { label: 'Neon night', top: 'rgba(181,55,242,0.38)', mid: 'rgba(255,46,136,0.20)', bot: 'rgba(20,10,60,0.45)' },
  dusk: { label: 'Dusk gold', top: 'rgba(255,159,28,0.26)', mid: 'rgba(255,94,98,0.18)', bot: 'rgba(60,10,90,0.40)' },
  none: { label: 'No grade', top: 'rgba(0,0,0,0)', mid: 'rgba(0,0,0,0)', bot: 'rgba(0,0,0,0)' },
};

// Panel rectangles for a layout, as fractions of the canvas (x, y, w, h).
export function layoutPanels(layout, W, H) {
  const gap = 0.008 * Math.min(W, H);
  const inset = 0.02 * Math.min(W, H);
  const x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset;
  const full = [{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
  if (layout === 'single') return full;
  if (layout === 'duo') {
    const half = (x1 - x0 - gap) / 2;
    return [
      { x: x0, y: y0, w: half, h: y1 - y0 },
      { x: x0 + half + gap, y: y0, w: half, h: y1 - y0 },
    ];
  }
  if (layout === 'triptych') {
    const third = (x1 - x0 - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: x0 + i * (third + gap), y: y0, w: third, h: y1 - y0 }));
  }
  // hero: big panel on top, three small panels in a strip below.
  const stripH = (y1 - y0) * 0.30;
  const heroH = y1 - y0 - stripH - gap;
  const third = (x1 - x0 - gap * 2) / 3;
  const strip = [0, 1, 2].map((i) => ({
    x: x0 + i * (third + gap), y: y0 + heroH + gap, w: third, h: stripH,
  }));
  return [{ x: x0, y: y0, w: x1 - x0, h: heroH }, ...strip];
}

export function panelCount(layout) {
  return { single: 1, duo: 2, triptych: 3, hero: 4 }[layout] ?? 1;
}

// Draw one photo into a panel rect, cover-fit, with pan (-1..1) and zoom (>=1).
export function drawPanelPhoto(ctx, img, rect, pan) {
  if (!img) return false;
  const zoom = pan?.zoom ?? 1;
  const px = pan?.x ?? 0;
  const py = pan?.y ?? 0;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 - px * (dw - rect.w) * 0.5;
  const dy = rect.y + (rect.h - dh) / 2 - py * (dh - rect.h) * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

// Deterministic pseudo-random so the grain looks the same every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Original skyline silhouette: jagged towers with lit windows, drawn along the bottom.
function drawSkyline(ctx, W, H, color) {
  const rand = mulberry32(20261119);
  const base = H * 0.965;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, base - H * 0.02);
  let x = 0;
  while (x < W) {
    const bw = W * (0.04 + rand() * 0.07);
    const bh = H * (0.05 + rand() * 0.13);
    ctx.lineTo(x, base - bh);
    ctx.lineTo(x + bw * 0.35, base - bh);
    // antenna on some towers
    if (rand() > 0.6) {
      ctx.lineTo(x + bw * 0.42, base - bh - H * 0.03);
      ctx.lineTo(x + bw * 0.48, base - bh);
    }
    ctx.lineTo(x + bw * 0.7, base - bh);
    ctx.lineTo(x + bw * 0.7, base - bh * 0.55);
    ctx.lineTo(x + bw, base - bh * 0.55);
    ctx.lineTo(x + bw, base - H * 0.015);
    x += bw;
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  // lit windows
  ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
  const wrand = mulberry32(77);
  for (let i = 0; i < 90; i++) {
    const wx = wrand() * W;
    const wy = base - H * 0.02 - wrand() * H * 0.14;
    ctx.fillRect(wx, wy, Math.max(2, W * 0.004), Math.max(2, H * 0.003));
  }
  ctx.restore();
}

// Original palm silhouette: curved trunk + fronds, drawn with quadratic curves.
function drawPalm(ctx, x, y, s, color, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  // trunk
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 30, -80, lean * 55, -150);
  ctx.stroke();
  // fronds: an upward fan, each arc drooping at the tip
  ctx.translate(lean * 55, -150);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i + 0.5) * (Math.PI / 7);
    const len = 85 + (i % 2) * 16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * len * 0.55, Math.sin(a) * len * 0.55 + 22, Math.cos(a) * len, Math.sin(a) * len + 52);
    ctx.stroke();
  }
  // coconuts
  ctx.beginPath();
  ctx.arc(-6, 6, 5, 0, Math.PI * 2);
  ctx.arc(7, 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGrain(ctx, W, H) {
  const rand = mulberry32(4242);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  const n = Math.floor((W * H) / 9000);
  for (let i = 0; i < n; i++) {
    ctx.fillRect(rand() * W, rand() * H, 1.4, 1.4);
  }
  ctx.restore();
}

function drawCaption(ctx, W, H, state) {
  const title = (state.title || '').trim();
  const sub = (state.subline || '').trim();
  if (!title && !sub) return;
  const style = CAPTION_STYLES[state.captionStyle] || CAPTION_STYLES.sunset;
  const top = state.captionPos === 'top';
  const baseSize = Math.min(W, H);
  const titleSize = baseSize * 0.115;
  const subSize = baseSize * 0.038;
  const cx = W / 2;
  const margin = baseSize * 0.055;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const grad = ctx.createLinearGradient(0, top ? margin : H - margin - titleSize, 0, top ? margin + titleSize : H - margin);
  style.stops.forEach((c, i) => grad.addColorStop(i / (style.stops.length - 1), c));

  const titleY = top ? margin + titleSize * 0.5 : H - margin - titleSize * 0.5 - (sub ? subSize * 1.1 : 0);
  ctx.font = `${titleSize}px Anton, 'Arial Narrow', sans-serif`;
  ctx.shadowColor = 'rgba(255, 46, 136, 0.85)';
  ctx.shadowBlur = titleSize * 0.22;
  ctx.shadowOffsetY = titleSize * 0.04;
  ctx.lineJoin = 'round';
  ctx.lineWidth = titleSize * 0.09;
  ctx.strokeStyle = 'rgba(20, 5, 40, 0.95)';
  ctx.fillStyle = grad;
  // wrap the title on two lines if it is long
  const words = title.toUpperCase().split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W * 0.92 && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const lineH = titleSize * 1.02;
  const totalH = lines.length * lineH;
  lines.forEach((ln, i) => {
    const y = titleY - totalH / 2 + lineH * (i + 0.5);
    ctx.strokeText(ln, cx, y);
    ctx.fillText(ln, cx, y);
  });

  if (sub) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = subSize * 0.5;
    ctx.font = `${subSize}px Anton, 'Arial Narrow', sans-serif`;
    ctx.lineWidth = subSize * 0.16;
    ctx.strokeStyle = 'rgba(20, 5, 40, 0.95)';
    ctx.fillStyle = '#ffffff';
    const subY = top
      ? margin + totalH + subSize * 0.9
      : H - margin - subSize * 0.5;
    ctx.strokeText(sub.toUpperCase(), cx, subY);
    ctx.fillText(sub.toUpperCase(), cx, subY);
  }
  ctx.restore();
}

// The whole cover. `images` is an array of HTMLImageElement|null, one per panel.
// `pans` is an array of {x, y, zoom} per panel. `state` holds layout/size/caption/grade.
export function drawCover(ctx, W, H, images, pans, state) {
  ctx.clearRect(0, 0, W, H);
  // backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b1055');
  bg.addColorStop(0.55, '#7597de');
  bg.addColorStop(1, '#ff7b54');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const panels = layoutPanels(state.layout, W, H);
  panels.forEach((rect, i) => {
    const img = images[i];
    if (img) {
      drawPanelPhoto(ctx, img, rect, pans[i]);
    } else {
      // empty panel: warm placeholder wash so the layout still reads
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      g.addColorStop(0, '#ff2e88');
      g.addColorStop(1, '#5a189a');
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.min(rect.w, rect.h) * 0.09}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PANEL ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // thin panel divider glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Vice City grade: sunset wash + vignette
  const grade = GRADES[state.grade] || GRADES.sunset;
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.5, grade.mid);
  wash.addColorStop(1, grade.bot);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,30,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  if (state.skyline) {
    drawSkyline(ctx, W, H, 'rgba(24, 4, 48, 0.92)');
    const s = Math.min(W, H) * 0.0011;
    drawPalm(ctx, W * 0.09, H * 0.97, s, 'rgba(16, 2, 32, 0.95)', 0.7);
    drawPalm(ctx, W * 0.91, H * 0.97, s * 0.85, 'rgba(16, 2, 32, 0.95)', -0.7);
  }

  if (state.grain) drawGrain(ctx, W, H);

  // neon accent frame
  if (state.frame) {
    const m = Math.min(W, H) * 0.012;
    ctx.save();
    ctx.strokeStyle = state.frameColor || '#ff2e88';
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.006);
    ctx.shadowColor = state.frameColor || '#ff2e88';
    ctx.shadowBlur = Math.min(W, H) * 0.02;
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
    ctx.restore();
  }

  drawCaption(ctx, W, H, state);
}

// Load a font file before drawing so canvas text uses it.
export async function ensureFont() {
  try {
    await document.fonts.load('64px Anton');
    await document.fonts.ready;
  } catch {
    // fall back to the system sans; the cover still draws.
  }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = src;
  });
}
