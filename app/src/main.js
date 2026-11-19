// Vice City Cover Studio — editor wiring.
// Live preview canvas, photo uploads, per-panel pan/zoom, layout/size/caption/grade
// controls, and one-click PNG export. Photos are read on this machine only.

import { SIZES, LAYOUTS, CAPTION_STYLES, GRADES, layoutPanels, panelCount, drawCover, ensureFont, loadImage } from './cover.js';
import { runShot } from './shots.js';

const $ = (sel) => document.querySelector(sel);
const preview = $('#preview');
const pctx = preview.getContext('2d');
const exportCanvas = document.createElement('canvas');

const state = {
  layout: 'triptych',
  size: 'landscape',
  title: 'VICE CITY',
  subline: 'Sunset Heist',
  captionStyle: 'sunset',
  captionPos: 'bottom',
  grade: 'sunset',
  skyline: true,
  grain: true,
  frame: true,
  frameColor: '#ff2e88',
};

// images[i] and pans[i] line up with the current layout's panels.
let images = [null, null, null, null];
let pans = [{ x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }];
let activePanel = 0;
let fontReady = false;

function currentSize() {
  return SIZES[state.size];
}

function render() {
  const { w, h } = currentSize();
  exportCanvas.width = w;
  exportCanvas.height = h;
  const ctx = exportCanvas.getContext('2d');
  drawCover(ctx, w, h, images.slice(0, panelCount(state.layout)), pans, state);
  // scale the export-resolution drawing down into the preview canvas
  const scale = Math.min(preview.width / w, preview.height / h);
  pctx.clearRect(0, 0, preview.width, preview.height);
  pctx.drawImage(exportCanvas, 0, 0, w * scale, h * scale);
  updatePanelList();
}

function fitPreviewCanvas() {
  const { w, h } = currentSize();
  const maxW = 860;
  const scale = Math.min(maxW / w, 620 / h, 1);
  preview.width = Math.round(w * scale);
  preview.height = Math.round(h * scale);
  preview.style.width = `${preview.width}px`;
  preview.style.height = `${preview.height}px`;
}

function updatePanelList() {
  const list = $('#panels');
  const n = panelCount(state.layout);
  list.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.className = `panel-row${i === activePanel ? ' active' : ''}`;
    row.innerHTML = `
      <button class="panel-name" data-i="${i}">Panel ${i + 1}${images[i] ? ' · photo loaded' : ' · empty'}</button>
      <label>Zoom <input type="range" min="1" max="2.5" step="0.05" value="${pans[i].zoom}" data-zoom="${i}"></label>
      <button class="mini" data-fill="${i}">Use first photo</button>`;
    list.appendChild(row);
  }
  list.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { activePanel = Number(b.dataset.i); render(); }));
  list.querySelectorAll('[data-zoom]').forEach((r) => r.addEventListener('input', () => {
    pans[Number(r.dataset.zoom)].zoom = Number(r.value);
    render();
  }));
  list.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => {
    const first = images.find((im) => im);
    if (first) { images[Number(b.dataset.fill)] = first; render(); }
  }));
}

function setPhoto(index, img) {
  images[index] = img;
  activePanel = index;
  render();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  setPhoto(activePanel, img);
  return img;
}

async function loadSampleInto(name) {
  return loadImage(`samples/${name}.jpg`);
}

function readFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  let slot = activePanel;
  list.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result).then((img) => setPhoto(slot, img)).catch(() => {});
    };
    reader.readAsDataURL(file);
    slot = (slot + 1) % panelCount(state.layout);
  });
}

function buildControlGroups() {
  const layoutBox = $('#layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = def.label;
    b.title = def.hint;
    b.dataset.layout = key;
    b.addEventListener('click', () => {
      state.layout = key;
      layoutBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.layout === key));
      fitPreviewCanvas();
      render();
    });
    layoutBox.appendChild(b);
  });
  layoutBox.querySelector('[data-layout="triptych"]').classList.add('on');

  const sizeBox = $('#sizes');
  Object.entries(SIZES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = def.label;
    b.dataset.size = key;
    b.addEventListener('click', () => {
      state.size = key;
      sizeBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.size === key));
      fitPreviewCanvas();
      render();
    });
    sizeBox.appendChild(b);
  });
  sizeBox.querySelector('[data-size="landscape"]').classList.add('on');

  const styleBox = $('#captionStyles');
  Object.entries(CAPTION_STYLES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.textContent = def.label;
    b.style.background = `linear-gradient(135deg, ${def.stops.join(', ')})`;
    b.dataset.style = key;
    b.addEventListener('click', () => {
      state.captionStyle = key;
      styleBox.querySelectorAll('.swatch').forEach((c) => c.classList.toggle('on', c.dataset.style === key));
      render();
    });
    styleBox.appendChild(b);
  });
  styleBox.querySelector('[data-style="sunset"]').classList.add('on');

  const gradeBox = $('#grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = def.label;
    b.dataset.grade = key;
    b.addEventListener('click', () => {
      state.grade = key;
      gradeBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.grade === key));
      render();
    });
    gradeBox.appendChild(b);
  });
  gradeBox.querySelector('[data-grade="sunset"]').classList.add('on');

  const posBox = $('#captionPos');
  ['top', 'bottom'].forEach((pos) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = pos === 'top' ? 'Caption on top' : 'Caption at bottom';
    b.dataset.pos = pos;
    b.addEventListener('click', () => {
      state.captionPos = pos;
      posBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.pos === pos));
      render();
    });
    posBox.appendChild(b);
  });
  posBox.querySelector('[data-pos="bottom"]').classList.add('on');
}

function bindInputs() {
  $('#title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('#subline').addEventListener('input', (e) => { state.subline = e.target.value; render(); });
  $('#skyline').addEventListener('change', (e) => { state.skyline = e.target.checked; render(); });
  $('#grain').addEventListener('change', (e) => { state.grain = e.target.checked; render(); });
  $('#frame').addEventListener('change', (e) => { state.frame = e.target.checked; render(); });
  $('#frameColor').addEventListener('input', (e) => { state.frameColor = e.target.value; render(); });

  $('#upload').addEventListener('change', (e) => { readFiles(e.target.files); e.target.value = ''; });
  $('#sampleBoulevard').addEventListener('click', () => loadSample('boulevard').catch(() => {}));
  $('#samplePier').addEventListener('click', () => loadSample('pier').catch(() => {}));
  $('#fillAll').addEventListener('click', () => {
    const first = images.find((im) => im);
    if (!first) return;
    const n = panelCount(state.layout);
    for (let i = 0; i < n; i++) images[i] = first;
    render();
  });
  $('#clearAll').addEventListener('click', () => {
    images = [null, null, null, null];
    pans = pans.map(() => ({ x: 0, y: 0, zoom: 1 }));
    render();
  });

  // drag on the preview to pan the active panel's photo
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging || !images[activePanel]) return;
    const rect = preview.getBoundingClientRect();
    const panels = layoutPanels(state.layout, currentSize().w, currentSize().h);
    const pr = panels[activePanel];
    const scale = rect.width / currentSize().w;
    const dx = (e.clientX - lastX) / scale / Math.max(1, pr.w * (pans[activePanel].zoom - 0.2));
    const dy = (e.clientY - lastY) / scale / Math.max(1, pr.h * (pans[activePanel].zoom - 0.2));
    pans[activePanel].x = Math.max(-1, Math.min(1, pans[activePanel].x + dx));
    pans[activePanel].y = Math.max(-1, Math.min(1, pans[activePanel].y + dy));
    lastX = e.clientX;
    lastY = e.clientY;
    render();
  });
  preview.addEventListener('pointerup', () => { dragging = false; });

  $('#exportBtn').addEventListener('click', exportPng);
}

export function exportPng() {
  const { w, h } = currentSize();
  render();
  return new Promise((resolve) => {
    exportCanvas.toBlob((blob) => {
      if (!blob) { resolve(false); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-city-cover-${state.layout}-${w}x${h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      window.__exported = true;
      resolve(true);
    }, 'image/png');
  });
}

// Exposed for the ?shot= scenes.
export const api = {
  state,
  get images() { return images; },
  set images(v) { images = v; },
  get pans() { return pans; },
  setPhoto,
  loadSample,
  loadSampleInto,
  render,
  fitPreviewCanvas,
  exportPng,
  setFontReady() { fontReady = true; },
};

async function init() {
  buildControlGroups();
  bindInputs();
  fitPreviewCanvas();
  await ensureFont();
  fontReady = true;
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, api);
  } else {
    // default: load the boulevard sample so the editor opens with a photo
    try { await loadSample('boulevard'); } catch { render(); }
  }
  render();
}

init();
