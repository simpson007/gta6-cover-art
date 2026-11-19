// Fixed scenes for screenshots, driven by ?shot= in the URL.
// ?shot=editor shows the editor with a sample photo loaded.
// ?shot=cover shows the cover alone at a chosen size/layout/caption:
//   ?shot=cover&photo=boulevard&photo2=pier&caption=VICE+CITY&sub=Sunset+Heist&size=landscape&layout=triptych
// ?shot=export runs the real Export PNG handler and reports the result.
// window.__shotReady is set once the scene has painted.

import { SIZES, panelCount } from './cover.js';

const $ = (sel) => document.querySelector(sel);

function applyParams(api, query) {
  const s = api.state;
  if (query.get('layout')) s.layout = query.get('layout');
  if (query.get('size') && SIZES[query.get('size')]) s.size = query.get('size');
  if (query.get('caption') !== null) s.title = query.get('caption');
  if (query.get('sub') !== null) s.subline = query.get('sub');
  if (query.get('captionStyle')) s.captionStyle = query.get('captionStyle');
  if (query.get('grade')) s.grade = query.get('grade');
  if (query.get('captionPos')) s.captionPos = query.get('captionPos');
  const titleInput = $('#title');
  const subInput = $('#subline');
  if (titleInput) titleInput.value = s.title;
  if (subInput) subInput.value = s.subline;
}

async function loadPhotos(api, query) {
  const first = query.get('photo') ?? 'boulevard';
  const second = query.get('photo2') ?? first;
  const a = await api.loadSampleInto(first);
  const b = second === first ? a : await api.loadSampleInto(second);
  const n = panelCount(api.state.layout);
  const imgs = api.images;
  for (let i = 0; i < n; i++) imgs[i] = i % 2 === 0 ? a : b;
  api.images = imgs;
}

// Size the preview canvas so the cover fills the screenshot window.
function fitCanvasToWindow(api) {
  const size = SIZES[api.state.size];
  const scale = Math.min(window.innerWidth / size.w, window.innerHeight / size.h);
  const canvas = $('#preview');
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, api) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    applyParams(api, query);
    await loadPhotos(api, query);
    fitCanvasToWindow(api);
    api.render();
    markReady();
    return;
  }
  if (shot === 'export') {
    document.body.classList.add('shot-cover');
    applyParams(api, query);
    await loadPhotos(api, query);
    fitCanvasToWindow(api);
    api.render();
    const ok = await api.exportPng();
    window.__exportOk = ok;
    markReady();
    return;
  }
  // editor (default shot scene)
  applyParams(api, query);
  await loadPhotos(api, query);
  api.render();
  markReady();
}
