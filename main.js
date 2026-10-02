// Everything is drawn into one low-resolution canvas that CSS scales up with
// nearest-neighbour sampling, so the whole scene shares a single pixel grid.

const NAME = 'ALESSANDRO SICA';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');

let PX = 4;          // size of one "pixel" in CSS px
let W = 0, H = 0;    // canvas size in low-res pixels
let nebula = null;   // pre-rendered background
let nameSprite = null;
let stars = [];

const heroEl = document.getElementById('hero');
const astronautEl = document.getElementById('astronaut');
const nameCanvas = document.getElementById('name');
const nameCtx = nameCanvas.getContext('2d');

// astronaut + name are drawn at this fraction of the background pixel size
let heroScale = 0.7;  // smaller on phones
const ASTRONAUT_SIZE = 96;   // sprite size in its own pixels
const GLITCH_MARGIN = 12;    // room for glitch slices to jump sideways

// ---------- noise ----------

function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y) {
  let sum = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < 5; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

// 4x4 Bayer matrix for ordered dithering
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const MAGENTA_RAMP = ['#07041a', '#140a33', '#280f4e', '#4a1563', '#7a1e74', '#b3307f'].map(hex);
const CYAN_RAMP = ['#07041a', '#0a1338', '#10275c', '#174d85', '#2486b0'].map(hex);

// ---------- background ----------

const PARALLAX_PAD = 24;

function buildNebula() {
  const w = W + PARALLAX_PAD * 2, h = H + PARALLAX_PAD * 2;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  const img = octx.createImageData(w, h);
  const scale = 1 / 70;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // domain warp for wispy gas clouds
      const wx = fbm(x * scale + 3.1, y * scale + 7.3) * 2.2;
      const wy = fbm(x * scale + 9.7, y * scale + 1.4) * 2.2;
      let m = fbm(x * scale + wx, y * scale + wy);
      let c = fbm(x * scale * 1.3 + 40 - wy, y * scale * 1.3 + 12 + wx);
      // concentrate the colour into bands, leave plenty of dark space
      m = Math.max(0, (m - 0.42) * 2.4);
      c = Math.max(0, (c - 0.5) * 2.6);

      const t = BAYER[(y & 3) * 4 + (x & 3)];
      const useCyan = c > m;
      const ramp = useCyan ? CYAN_RAMP : MAGENTA_RAMP;
      const v = Math.min(1, useCyan ? c : m);
      const level = Math.min(ramp.length - 1, Math.floor(v * (ramp.length - 1) + t));
      const col = ramp[level];

      const i = (y * w + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return off;
}

function buildStars() {
  const count = Math.round((W * H) / 260);
  stars = [];
  for (let i = 0; i < count; i++) {
    const layer = Math.random() < 0.7 ? 0 : Math.random() < 0.75 ? 1 : 2;
    stars.push({
      x: Math.random() * (W + PARALLAX_PAD * 2),
      y: Math.random() * (H + PARALLAX_PAD * 2),
      layer,
      sparkle: layer === 2 && Math.random() < 0.6, // plus-shaped star
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 2.2,
      tint: Math.random() < 0.15 ? '#ff7de9' : Math.random() < 0.2 ? '#7df4ff' : '#ffffff',
    });
  }
}

// ---------- neon name ----------

function buildNameSprite() {
  const maxWidth = Math.min(window.innerWidth * 0.8, 560) / (PX * heroScale);
  const probe = document.createElement('canvas').getContext('2d');
  let size = 40;
  probe.font = `800 ${size}px Orbitron, sans-serif`;
  size = Math.max(9, Math.floor(size * maxWidth / probe.measureText(NAME).width));

  const pad = 10;
  const font = `800 ${size}px Orbitron, sans-serif`;
  probe.font = font;
  const tw = Math.ceil(probe.measureText(NAME).width);
  const w = tw + pad * 2, h = Math.ceil(size * 1.2) + pad * 2;

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const o = off.getContext('2d');
  o.font = font;
  o.textBaseline = 'middle';
  o.lineJoin = 'miter';

  const grad = o.createLinearGradient(pad, 0, pad + tw, 0);
  grad.addColorStop(0, '#ff2bd6');
  grad.addColorStop(0.45, '#d14dff');
  grad.addColorStop(1, '#2be8ff');

  const cx = pad, cy = h / 2 + 1;

  // outer glow
  o.strokeStyle = grad;
  o.lineWidth = 2;
  o.shadowColor = '#c93cff';
  o.shadowBlur = 5;
  o.strokeText(NAME, cx, cy);
  o.shadowBlur = 4;
  o.strokeText(NAME, cx, cy);
  // hollow neon tube
  o.shadowBlur = 0;
  o.lineWidth = size > 20 ? 2 : 1;
  o.strokeText(NAME, cx, cy);
  // hot white-ish core
  o.globalCompositeOperation = 'lighter';
  o.lineWidth = 1;
  o.strokeStyle = 'rgba(255, 220, 255, 0.55)';
  o.strokeText(NAME, cx, cy);

  // quantise alpha into hard steps so the glow reads as chunky pixels
  const data = o.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    const q = a < 0.18 ? 0 : a < 0.4 ? 0.3 : a < 0.7 ? 0.6 : 1;
    d[i + 3] = Math.round(q * 255);
  }
  o.putImageData(data, 0, 0);
  return off;
}

// ---------- layout ----------

function resize() {
  PX = window.innerWidth < 700 ? 3 : 4;
  heroScale = window.innerWidth < 700 ? 0.5 : 0.7;
  W = Math.ceil(window.innerWidth / PX);
  H = Math.ceil(window.innerHeight / PX);

  // the background canvas carries the parallax padding and is moved with CSS
  canvas.width = W + PARALLAX_PAD * 2;
  canvas.height = H + PARALLAX_PAD * 2;
  canvas.style.width = canvas.width * PX + 'px';
  canvas.style.height = canvas.height * PX + 'px';
  document.documentElement.style.setProperty('--px', PX + 'px');
  ctx.imageSmoothingEnabled = false;
  nebula = buildNebula();
  buildStars();

  Planets.resize();

  const heroPx = PX * heroScale;
  astronautEl.style.width = ASTRONAUT_SIZE * heroPx + 'px';
  nameSprite = buildNameSprite();
  nameCanvas.width = nameSprite.width + GLITCH_MARGIN * 2;
  nameCanvas.height = nameSprite.height;
  nameCanvas.style.width = nameCanvas.width * heroPx + 'px';
  nameCanvas.style.marginTop = -16 * heroPx + 'px';
  nameCtx.imageSmoothingEnabled = false;
}

// ---------- input ----------

const mouse = { x: 0, y: 0 };   // -1..1 from centre
const follow = { x: 0, y: 0 };  // smoothed follower for the astronaut
const view = { x: 0, y: 0 };    // background parallax

window.addEventListener('pointermove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
});
document.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; });

// ---------- neon name + glitch ----------

let glitchUntil = 0;
let nextGlitch = 2.5;

function drawName(t) {
  const c = nameCtx;
  const sw = nameSprite.width, sh = nameSprite.height;
  const x = GLITCH_MARGIN;
  c.clearRect(0, 0, nameCanvas.width, nameCanvas.height);

  if (t > nextGlitch) {
    glitchUntil = t + 0.08 + Math.random() * 0.22;
    nextGlitch = t + 2 + Math.random() * 4;
  }
  const glitching = !reduceMotion && t < glitchUntil;

  if (!glitching) {
    // neon flicker: rare brief dips in brightness
    c.globalAlpha = !reduceMotion && Math.sin(t * 31) > 0.985 ? 0.55 : 1;
    c.drawImage(nameSprite, x, 0);
    c.globalAlpha = 1;
    return;
  }

  // chromatic split ghosts
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.45;
  c.drawImage(nameSprite, x - 2, 0);
  c.drawImage(nameSprite, x + 2, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';

  // horizontal slices jumping sideways
  let sy = 0;
  while (sy < sh) {
    const sliceH = 1 + Math.floor(Math.random() * 4);
    const shift = Math.random() < 0.3 ? Math.round((Math.random() - 0.5) * 14) : 0;
    c.drawImage(nameSprite, 0, sy, sw, sliceH, x + shift, sy, sw, sliceH);
    sy += sliceH;
  }

  // stray streak lines like the reference
  for (let i = 0; i < 4; i++) {
    const ly = 4 + Math.floor(Math.random() * (sh - 8));
    const lx = x + Math.floor(Math.random() * sw) - 10;
    c.fillStyle = Math.random() < 0.5 ? '#ff4fe1' : '#4ff0ff';
    c.fillRect(lx, ly, 6 + Math.floor(Math.random() * 22), 1);
  }
}

// ---------- background ----------

function drawSpace(t) {
  ctx.drawImage(nebula, 0, 0);

  // stars in three depth layers; the nebula's own parallax is applied via CSS,
  // so only each layer's extra depth is drawn here
  for (const s of stars) {
    const depth = [0, 5, 11][s.layer];
    const x = Math.round(s.x - view.x * depth);
    const y = Math.round(s.y - view.y * depth);
    const tw = reduceMotion ? 1 : 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
    ctx.fillStyle = s.tint;
    if (s.sparkle) {
      ctx.globalAlpha = 0.6 + tw * 0.4;
      ctx.fillRect(x, y, 1, 1);
      if (tw > 0.45) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
      if (tw > 0.9) {
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x - 2, y, 5, 1);
        ctx.fillRect(x, y - 2, 1, 5);
      }
    } else {
      ctx.globalAlpha = (s.layer === 0 ? 0.35 : 0.7) * (0.4 + tw * 0.6);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- main loop ----------

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  const vw = window.innerWidth, vh = window.innerHeight;

  // a section page fully covers the orbit scene: only animate the page
  if (Sections.covering()) {
    Sections.update(dt, t);
    requestAnimationFrame(frame);
    return;
  }

  // gentle, frame-rate independent easing toward the pointer
  const k = 1 - Math.exp(-dt * 2.2);
  follow.x += (mouse.x - follow.x) * k;
  follow.y += (mouse.y - follow.y) * k;
  const kv = 1 - Math.exp(-dt * 2.5);
  view.x += (mouse.x - view.x) * kv;
  view.y += (mouse.y - view.y) * kv;

  drawSpace(t);
  canvas.style.transform = `translate3d(${(-PARALLAX_PAD - view.x * 6) * PX}px, ${(-PARALLAX_PAD - view.y * 6) * PX}px, 0)`;

  // astronaut + name, floating together
  const floatX = reduceMotion ? 0 : Math.sin(t * 0.43) * 3 * PX;
  const floatY = reduceMotion ? 0 : Math.sin(t * 0.7) * 5 * PX;
  const hw = heroEl.offsetWidth, hh = heroEl.offsetHeight;
  const hx = vw / 2 - hw / 2 + follow.x * vw * 0.06 + floatX;
  const hy = vh / 2 - hh / 2 + follow.y * vh * 0.05 + floatY;
  heroEl.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
  Planets.update(t, view, PX, { x: hx + hw / 2, y: hy + hh / 2 });
  Ships.update(dt);
  Sections.update(dt, t);

  const tilt = reduceMotion ? 0 : Math.sin(t * 0.5) * 2 + follow.x * 3;
  astronautEl.style.transform = `rotate(${tilt}deg)`;

  drawName(t);
  requestAnimationFrame(frame);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 120);
});

// wait for the font so the name sprite is rendered with Orbitron
document.fonts.load('800 20px Orbitron').catch(() => {}).finally(() => {
  Planets.init();
  resize();
  Sections.syncHash();
  requestAnimationFrame(frame);
});
