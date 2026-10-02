// Section planets: each one is a small sphere rendered pixel-by-pixel from an
// equirectangular texture, so it rotates like a real planet while staying on a
// coarse pixel grid. Icons and orbiting logo-moons are hand-drawn pixel sprites.

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const TEX_W = 128, TEX_H = 64;
  const LIGHT = normalize([-0.55, -0.45, 0.7]);
  const OUTLINE = [11, 6, 24];

  // ---------- helpers ----------

  function normalize(v) {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash3(x, y, z, seed) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(seed, 144665);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  function noise3(x, y, z, seed) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const lerp = (a, b, t) => a + (b - a) * t;
    const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz, seed);
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
      w);
  }

  function fbm3(x, y, z, seed, octaves = 4) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise3(x * f, y * f, z * f, seed + i * 17);
      norm += amp;
      f *= 2;
      amp *= 0.5;
    }
    return sum / norm;
  }

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16 - 0.5);

  // ---------- pixel sprites (icons + logos) ----------

  // layers: [{ x, y, rows }]; rows use single-letter colour keys, '.' = empty
  function makeSprite(layers, colors, outline = true) {
    let w = 0, h = 0;
    for (const l of layers) {
      for (const r of l.rows) w = Math.max(w, l.x + r.length);
      h = Math.max(h, l.y + l.rows.length);
    }
    const grid = Array.from({ length: h }, () => new Array(w).fill(null));
    for (const l of layers) {
      l.rows.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (ch !== '.' && ch !== ' ') grid[l.y + y][l.x + x] = hex(colors[ch]);
        });
      });
    }
    const pad = outline ? 1 : 0;
    const c = document.createElement('canvas');
    c.width = w + pad * 2;
    c.height = h + pad * 2;
    const g = c.getContext('2d');
    const img = g.createImageData(c.width, c.height);
    const put = (x, y, col) => {
      const i = (y * c.width + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
    };
    if (outline) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!grid[y][x]) continue;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(x + dx + pad, y + dy + pad, OUTLINE);
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (grid[y][x]) put(x + pad, y + pad, grid[y][x]);
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  const ICONS = {
    temple: makeSprite([{ x: 0, y: 0, rows: [
      '........w........',
      '......wwmww......',
      '....wwmmmmmww....',
      '..wwmmmmmmmmmww..',
      'wwwwwwwwwwwwwwwww',
      'mmmmmmmmmmmmmmmmm',
      '.ws..ws...ws..ws.',
      '.ws..ws...ws..ws.',
      '.ws..ws...ws..ws.',
      '.ws..ws...ws..ws.',
      '.ws..ws...ws..ws.',
      '.ws..ws...ws..ws.',
      'mmmmmmmmmmmmmmmmm',
      'sssssssssssssssss',
    ] }], { w: '#fff6dc', m: '#e2c792', s: '#a8875a' }),

    chip: makeSprite([{ x: 0, y: 0, rows: [
      '...p.p.p.p.p...',
      '...p.p.p.p.p...',
      '.bbbbbbbbbbbbb.',
      'pbbbbbbbbbbbbbp',
      '.bbbbbbbbbbbbb.',
      'pbbbcbbbcbcbbbp',
      '.bbcbbbbcbbcbb.',
      'pbcbbbbcbbbbcbp',
      '.bbcbbcbbbbcbb.',
      'pbbbcbcbbbcbbbp',
      '.bbbbbbbbbbbbb.',
      'pbbbbbbbbbbbbbp',
      '.bbbbbbbbbbbbb.',
      '...p.p.p.p.p...',
      '...p.p.p.p.p...',
    ] }], { p: '#c9d3e0', b: '#1d2740', c: '#4ff0ff' }),

    rover: makeSprite([{ x: 0, y: 0, rows: [
      '...........cc.....',
      '...........gg.....',
      '..sssss.....g.....',
      '..sssss.....g.....',
      '.wwwwwwwwwwwwwww..',
      '.wyyywwwwwwwwwwwg.',
      '.gggggggggggggggg.',
      '..g....g.....g....',
      '.ttt..ttt...ttt...',
      '.tgt..tgt...tgt...',
      '.ttt..ttt...ttt...',
    ] }], { c: '#4ff0ff', g: '#8a90a0', s: '#3a6df0', w: '#eef0f6', y: '#ffcc33', t: '#2a2a35' }),

    robotArm: makeSprite([{ x: 0, y: 0, rows: [
      '.........dd.....',
      '........dlld....',
      '.......oddddoo..',
      '......ooo..oooo.',
      '.....ooo.....odd',
      '....ooo......dld',
      '...ooo.......l.l',
      '..ooo........c.c',
      '.dld............',
      '.dld............',
      'dddddd..........',
      'llllll..........',
    ] }], { o: '#ff8a3d', d: '#555c6e', l: '#c9d3e0', c: '#4ff0ff' }),

    microphone: makeSprite([{ x: 0, y: 0, rows: [
      '....wwwww....',
      '...wgwgwgw...',
      '...gwgwgwg...',
      '..rwgwgwgwr..',
      '..rgwgwgwgr..',
      '..r.wwwww.r..',
      '...r.ddd.r...',
      '....rrrrr....',
      '......d......',
      '......d......',
      '....ddddd....',
    ] }], { w: '#f2f2f8', g: '#9aa3b5', r: '#ff4fe1', d: '#6b7385' }),

    trophy: makeSprite([{ x: 0, y: 0, rows: [
      '..yyyyyyyyyyy..',
      'yyywyyyyyyyoyyy',
      'y.ywyyyyyyyoy.y',
      'y.ywyyyyyyyoy.y',
      '.yywyyyyyyyoyy.',
      '...ywyyyyyoy...',
      '....ywyyyoy....',
      '......yyy......',
      '......yoy......',
      '.....yyyyy.....',
      '....bbbbbbb....',
      '....byyyyyb....',
      '....bbbbbbb....',
    ] }], { y: '#ffd23f', o: '#e09a1a', w: '#fff6c2', b: '#8a5a2b' }),

    work: makeSprite([
      { x: 6, y: 0, rows: [
        'mmmmmmmmmmmmm',
        'msssssssssssm',
        'mslllllllsssm',
        'msssssssssssm',
        'msllllllssssm',
        'msssssssssssm',
        'mslllllllsssm',
        'msssssssssssm',
        'mslllllsssssm',
        'msssssssssssm',
        'mmmmmmmmmmmmm',
        '.....ddd.....',
        '...ddddddd...',
      ] },
      { x: 0, y: 7, rows: [
        '...yyyyy...',
        '..yywyyyo..',
        '.yywyyyyyo.',
        '.yywyyyyyo.',
        'ooooooooooo',
      ] },
    ], { m: '#4a5060', s: '#1b3a6b', l: '#4ff0ff', d: '#8a90a0', y: '#ffcc33', w: '#fff3b0', o: '#e08a1a' }),
  };

  const LOGOS = {
    Python: makeSprite([{ x: 0, y: 0, rows: [
      '....bbbbb....',
      '...bwbbbbb...',
      '...bbbbbbb...',
      '.......bbb...',
      '.bbbbbbbbb.y.',
      'bbbbbbbbbb.yy',
      'bbbb......yyy',
      'bbb.yyyyyyyyy',
      '.b.yyyyyyyyy.',
      '...yyy.......',
      '...yyyyyyy...',
      '...yyyyywy...',
      '....yyyyy....',
    ] }], { b: '#3776ab', y: '#ffd43b', w: '#ffffff' }),

    OpenCV: makeSprite([
      { x: 4, y: 0, rows: ['..rrr..', '.rrrrr.', 'rrr.rrr', 'rr...rr', 'rrr.rrr', '.rr.rr.'] },
      { x: 0, y: 7, rows: ['..g....', '.gg....', 'ggg.ggg', 'gg...gg', 'ggg.ggg', '.ggggg.', '..ggg..'] },
      { x: 8, y: 7, rows: ['.......', '.b...b.', 'bbb.bbb', 'bb...bb', 'bbb.bbb', '.bbbbb.', '..bbb..'] },
    ], { r: '#ff3b3b', g: '#33d16a', b: '#3b7bff' }),

    'C++': makeSprite([{ x: 0, y: 0, rows: [
      '....ddddd....',
      '..ddddddddd..',
      '.ddddddddddd.',
      'ddwwwwddddddd',
      'dwwddddwdddwd',
      'dwwdddwwwdwww',
      'dwwddddwdddwd',
      'ddwwwwddddddd',
      '.ddddddddddd.',
      '..ddddddddd..',
      '....ddddd....',
    ] }], { d: '#00599c', w: '#ffffff' }),

    'ROS 2': makeSprite([{ x: 0, y: 0, rows: [
      'www.www.www',
      'www.www.www',
      'www.www.www',
      '...........',
      'www.bbb.www',
      'www.bbb.www',
      'www.bbb.www',
      '...........',
      'www.www.www',
      'www.www.www',
      'www.www.www',
    ] }], { w: '#e6e9f0', b: '#22a7f0' }),

    MATLAB: makeSprite([{ x: 0, y: 0, rows: [
      '......r.....',
      '.....rro....',
      '....rrooo...',
      '...rroooo.b.',
      '..rroooooobb',
      '.rroooooobbb',
      'rrooooooobb.',
      '.oooooobbb..',
      '..ooooobb...',
      '...ooo......',
    ] }], { r: '#c4301c', o: '#f5a031', b: '#2f6fb3' }),

    Linux: makeSprite([{ x: 0, y: 0, rows: [
      '...kkkkk...',
      '..kkkkkkk..',
      '..kwkkwkk..',
      '..kkyykkk..',
      '.kkwwwwkkk.',
      '.kwwwwwwkk.',
      'kkwwwwwwwkk',
      'kkwwwwwwwkk',
      '.kwwwwwwwk.',
      '.yykwwwkyy.',
      'yyy.....yyy',
    ] }], { k: '#2a2a35', w: '#f2f2f8', y: '#ffcc33' }),

    GitHub: makeSprite([{ x: 0, y: 0, rows: [
      '....wwwww....',
      '..wwwwwwwww..',
      '.wwkwwwwwkww.',
      '.wwkkkkkkkww.',
      'wwkkkkkkkkkww',
      'wwkkwkkkwkkww',
      'wwkkkkkkkkkww',
      'wwwkkkkkkkwww',
      '.wwwkkkkkwww.',
      '.wkwwkkkwwww.',
      '..wwkkkkkww..',
      '....kkkkk....',
    ] }], { w: '#f2f2f8', k: '#24292f' }),

    Blender: makeSprite([{ x: 0, y: 0, rows: [
      '....oooo....',
      'o..oowwoo...',
      'oooowbbwoo..',
      '.oowbbbbwo..',
      '..owbbbbwo..',
      '.ooowbbwoo..',
      'oo..owwoo...',
      '.....oooo...',
    ] }], { o: '#f5792a', w: '#ffffff', b: '#265787' }),

    'VS Code': makeSprite([{ x: 0, y: 0, rows: [
      '........bb.',
      '......bbbb.',
      '.b...bbbbb.',
      '.bb.bbb.bb.',
      '..bbbb..bb.',
      '...bb...bb.',
      '..bbbb..bb.',
      '.bb.bbb.bb.',
      '.b...bbbbb.',
      '......bbbb.',
      '........bb.',
    ] }], { b: '#2b9af3' }),

    'Claude Code': makeSprite([{ x: 0, y: 0, rows: [
      '.....o.....',
      '.o...o...o.',
      '..o..o..o..',
      '...o.o.o...',
      '....ooo....',
      'ooooooooooo',
      '....ooo....',
      '...o.o.o...',
      '..o..o..o..',
      '.o...o...o.',
      '.....o.....',
    ] }], { o: '#d97757' }),

    Git: makeSprite([{ x: 0, y: 0, rows: [
      '......o......',
      '.....ooo.....',
      '....owooo....',
      '...oowwooo...',
      '..ooowowooo..',
      '.oooowoowooo.',
      'ooooowowwwooo',
      '.oooowoowooo.',
      '..ooowooooo..',
      '...owwwooo...',
      '....wwwoo....',
      '.....ooo.....',
      '......o......',
    ] }], { o: '#f05133', w: '#ffffff' }),
  };

  // ---------- planet styles ----------
  // Each texture function gets a point p on the unit sphere and returns
  // { r: ramp index, v: 0..1 value, e: emissive (ignores lighting) }.

  function craterList(seed, count) {
    const rand = rng(seed);
    return Array.from({ length: count }, () => {
      const z = rand() * 2 - 1, a = rand() * TAU, s = Math.sqrt(1 - z * z);
      return { c: [s * Math.cos(a), z, s * Math.sin(a)], r: 0.12 + rand() * 0.22 };
    });
  }

  function voronoiPoints(seed, count) {
    return craterList(seed, count).map(c => ({ c: c.c, k: rng(seed + Math.round(c.r * 1e4))() }));
  }

  const workCraters = craterList(71, 22);
  const iceCells = voronoiPoints(33, 46);

  const STYLES = {
    education: {
      ramps: [['#24102c', '#4f2338', '#86423a', '#bf7444', '#e4a95e', '#f6d898', '#fff4d6']],
      tex(p) {
        const warp = fbm3(p[0] * 2.2, p[1] * 2.2, p[2] * 2.2, 11);
        const bands = Math.sin(p[1] * 13 + warp * 5);
        return { r: 0, v: 0.45 + bands * 0.22 + (fbm3(p[0] * 6, p[1] * 6, p[2] * 6, 12) - 0.5) * 0.4 };
      },
      ring: { inner: 1.3, outer: 1.85, flat: 0.3, tilt: -0.32, ramp: ['#5a3044', '#a86a52', '#e4b878', '#fff0c8'], seed: 5 },
    },

    tech: {
      ramps: [
        ['#081420', '#0f2633', '#16404d', '#1f5f66', '#2f8a85', '#53b8a6'],
        ['#0a5a6a', '#2bc8e0', '#9ff8ff'],
      ],
      tex(p, tx, ty) {
        const base = 0.35 + (fbm3(p[0] * 3, p[1] * 3, p[2] * 3, 21) - 0.5) * 0.5;
        const cx = Math.floor(tx / 8), cy = Math.floor(ty / 6);
        const lx = tx % 8, ly = ty % 6;
        const h1 = hash3(cx, cy, 1, 22), h2 = hash3(cx, cy, 2, 22), h3 = hash3(cx, cy, 3, 22);
        const horiz = h1 < 0.55 && ly === 3;
        const vert = h2 < 0.45 && lx === 4;
        const node = h3 < 0.35 && lx >= 3 && lx <= 5 && ly >= 2 && ly <= 4;
        if (horiz || vert || node) return { r: 1, v: node ? 1 : 0.6, e: true };
        const seam = lx === 0 || ly === 0;
        return { r: 0, v: seam ? base - 0.18 : base };
      },
    },

    projects: {
      ramps: [
        ['#1e0a1a', '#4a1424', '#7a2228', '#b33a2a', '#e0602f', '#ff9a4a'],
        ['#0b3a5a', '#1f8ac0', '#3fd6ff'],
      ],
      tex(p) {
        const river = fbm3(p[0] * 1.2 + 4, p[1] * 1.2, p[2] * 1.2, 31, 3);
        if (Math.abs(river - 0.5) < 0.016) return { r: 1, v: 0.75 };
        const dust = fbm3(p[0] * 4, p[1] * 4, p[2] * 4, 32);
        const fuzz = noise3(p[0] * 40, p[1] * 40, p[2] * 40, 33);
        return { r: 0, v: 0.25 + dust * 0.55 + (fuzz - 0.5) * 0.35 };
      },
    },

    research: {
      ramps: [['#1a0626', '#3d0b45', '#6b1466', '#a32584', '#d94fa8', '#ff8fd0']],
      tex(p) {
        const w = fbm3(p[0] * 1.5, p[1] * 1.5, p[2] * 1.5, 41) * 2.5;
        const n = fbm3(p[0] * 1.6 + w, p[1] * 1.6 - w, p[2] * 1.6 + w, 42, 3);
        const fold = Math.abs(Math.sin(n * 14));
        return { r: 0, v: fold < 0.22 ? 0.1 : 0.4 + fold * 0.4 };
      },
    },

    positions: {
      ramps: [
        ['#06143a', '#0b2a6b', '#1550a0', '#2a86d0', '#5cc0f0'],
        ['#0c2a14', '#1a4d1e', '#2f7a2a', '#5aa83a', '#9ad65a'],
        ['#5a6a8a', '#c8d4ea', '#ffffff'],
      ],
      tex(p) {
        const cloud = fbm3(p[0] * 3 + 9, p[1] * 5, p[2] * 3, 51);
        if (cloud > 0.6) return { r: 2, v: 0.55 + (cloud - 0.6) * 2 };
        const land = fbm3(p[0] * 1.8, p[1] * 1.8, p[2] * 1.8, 52);
        if (land > 0.52) return { r: 1, v: 0.35 + (land - 0.52) * 2.5 };
        return { r: 0, v: 0.3 + land * 0.4 };
      },
    },

    awards: {
      ramps: [['#0a1640', '#16307a', '#2456b0', '#3f8ee0', '#7cc8ff', '#d8f4ff']],
      tex(p) {
        let d1 = 9, d2 = 9, k = 0;
        for (const c of iceCells) {
          const d = 1 - (p[0] * c.c[0] + p[1] * c.c[1] + p[2] * c.c[2]);
          if (d < d1) { d2 = d1; d1 = d; k = c.k; } else if (d < d2) d2 = d;
        }
        if (d2 - d1 < 0.012) return { r: 0, v: 1 };
        return { r: 0, v: 0.3 + k * 0.45 };
      },
      jagged: { spikes: 11, depth: 0.2, seed: 7 },
    },

    work: {
      ramps: [['#060a26', '#0d1a4d', '#163080', '#2650b0', '#4a7fd8', '#86b6f0']],
      tex(p) {
        let v = 0.42 + (fbm3(p[0] * 3, p[1] * 3, p[2] * 3, 61) - 0.5) * 0.5;
        for (const c of workCraters) {
          const d = Math.acos(Math.min(1, p[0] * c.c[0] + p[1] * c.c[1] + p[2] * c.c[2]));
          if (d < c.r) {
            const t = d / c.r;
            v += t > 0.78 ? 0.22 : -0.22;
            break;
          }
        }
        return { r: 0, v };
      },
    },

    rock: {
      ramps: [['#16121f', '#3a3346', '#6a6377', '#a29bb0', '#d8d2e4']],
      tex(p) {
        return { r: 0, v: 0.25 + fbm3(p[0] * 4, p[1] * 4, p[2] * 4, 81) * 0.6 };
      },
    },
  };

  // ---------- planet renderer ----------

  function buildTexture(style) {
    const n = TEX_W * TEX_H;
    const ramp = new Uint8Array(n), val = new Float32Array(n), emit = new Uint8Array(n);
    for (let ty = 0; ty < TEX_H; ty++) {
      const lat = ((ty + 0.5) / TEX_H - 0.5) * Math.PI;
      for (let tx = 0; tx < TEX_W; tx++) {
        const lon = (tx / TEX_W) * TAU;
        const p = [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
        const s = style.tex(p, tx, ty);
        const i = ty * TEX_W + tx;
        ramp[i] = s.r;
        val[i] = Math.max(0, Math.min(1, s.v));
        emit[i] = s.e ? 1 : 0;
      }
    }
    return { ramp, val, emit };
  }

  function jagRadius(angle, j) {
    const k = j.spikes;
    const f = ((angle / TAU) * k + 10) % 1;
    const spike = Math.floor(((angle / TAU) * k + 10)) % k;
    const tri = 1 - Math.abs(f - 0.5) * 2;
    return 1 - j.depth + j.depth * tri * (0.4 + 0.6 * hash3(spike, 0, 0, j.seed));
  }

  class PlanetSprite {
    constructor(styleName, diameter, rotSpeed, icon) {
      this.style = STYLES[styleName];
      this.ramps = this.style.ramps.map(r => r.map(hex));
      this.D = diameter;
      this.R = diameter / 2;
      this.rotSpeed = rotSpeed;
      this.icon = icon;
      this.tex = buildTexture(this.style);

      const ring = this.style.ring;
      this.size = ring ? Math.ceil(diameter * ring.outer + 4) : diameter + 2;
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.canvas.height = this.size;
      this.ctx = this.canvas.getContext('2d');
      this.img = this.ctx.createImageData(this.size, this.size);
      this.precompute();
    }

    precompute() {
      const { size, R } = this;
      const c = size / 2;
      const sphere = [];
      const ringBack = [], ringFront = [];
      const ring = this.style.ring;
      const jag = this.style.jagged;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x + 0.5 - c, dy = y + 0.5 - c;
          const dist = Math.hypot(dx, dy);
          const limit = jag ? R * jagRadius(Math.atan2(dy, dx), jag) : R;
          const pix = y * size + x;

          if (dist <= limit) {
            const nx = dx / R, ny = dy / R;
            const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
            const lon = Math.atan2(nx, nz);
            const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
            const light = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
            sphere.push({
              pix, lon,
              ty: Math.min(TEX_H - 1, Math.floor((lat / Math.PI + 0.5) * TEX_H)),
              light,
              rim: nz < 0.35 && light > 0.25,
              dither: BAYER[(y & 3) * 4 + (x & 3)],
            });
            continue;
          }

          if (ring) {
            const rx = dx * Math.cos(ring.tilt) + dy * Math.sin(ring.tilt);
            const ry = -dx * Math.sin(ring.tilt) + dy * Math.cos(ring.tilt);
            const e = Math.hypot(rx, ry / ring.flat) / R;
            if (e >= ring.inner && e <= ring.outer) {
              const band = noise3(e * 9, 0.5, 0.5, ring.seed);
              if (band < 0.3) continue; // gaps between ring bands
              const v = band * 0.8 - rx / R * 0.12 + BAYER[(y & 3) * 4 + (x & 3)] * 0.4;
              const col = ring.ramp[Math.max(0, Math.min(ring.ramp.length - 1, Math.floor(v * ring.ramp.length)))];
              (ry < 0 ? ringBack : ringFront).push({ pix, col: hex(col) });
            }
          }
        }
      }
      // pixels of the front ring half that overlap the sphere still need drawing
      if (ring) {
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const dx = x + 0.5 - c, dy = y + 0.5 - c;
          if (Math.hypot(dx, dy) > R) continue;
          const rx = dx * Math.cos(ring.tilt) + dy * Math.sin(ring.tilt);
          const ry = -dx * Math.sin(ring.tilt) + dy * Math.cos(ring.tilt);
          const e = Math.hypot(rx, ry / ring.flat) / R;
          if (ry > 0 && e >= ring.inner && e <= ring.outer) {
            const band = noise3(e * 9, 0.5, 0.5, ring.seed);
            if (band < 0.3) continue;
            const v = band * 0.8 - rx / R * 0.12 + BAYER[(y & 3) * 4 + (x & 3)] * 0.4;
            const col = ring.ramp[Math.max(0, Math.min(ring.ramp.length - 1, Math.floor(v * ring.ramp.length)))];
            ringFront.push({ pix: y * size + x, col: hex(col) });
          }
        }
      }
      this.sphere = sphere;
      this.ringBack = ringBack;
      this.ringFront = ringFront;
    }

    render(t) {
      const d = this.img.data;
      d.fill(0);
      const put = (pix, col) => {
        const i = pix * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      };
      for (const p of this.ringBack) put(p.pix, p.col);

      const rot = reduceMotion ? 0 : t * this.rotSpeed;
      const pulse = reduceMotion ? 0 : Math.sin(t * 2.4) * 0.15;
      const { ramp, val, emit } = this.tex;
      for (const s of this.sphere) {
        let u = ((s.lon + rot) / TAU) % 1;
        if (u < 0) u += 1;
        const ti = s.ty * TEX_W + Math.floor(u * TEX_W);
        const r = this.ramps[ramp[ti]];
        const n = r.length;
        let level;
        if (emit[ti]) {
          level = (val[ti] + pulse) * (n - 1) + s.dither;
        } else {
          level = (val[ti] * 0.55 + s.light * 0.8 - 0.22) * (n - 1) + s.dither * 1.2;
          if (s.rim) level += 1;
        }
        put(s.pix, r[Math.max(0, Math.min(n - 1, Math.round(level)))]);
      }

      for (const p of this.ringFront) put(p.pix, p.col);
      this.ctx.putImageData(this.img, 0, 0);

      if (this.icon) {
        const ic = this.icon;
        this.ctx.drawImage(ic, Math.round((this.size - ic.width) / 2), Math.round((this.size - ic.height) / 2));
      }
    }
  }

  // ---------- section definitions ----------

  const SECTIONS = [
    { id: 'education', title: 'Education', style: 'education', d: 56, rot: 0.18, icon: 'temple', accent: '#ffcf6b' },
    { id: 'skills', title: 'Technical Skills', style: 'tech', d: 44, rot: 0.25, icon: 'chip', accent: '#4ff0ff',
      logos: ['Python', 'OpenCV', 'C++', 'ROS 2', 'Git'] },
    { id: 'projects', title: 'Projects', style: 'projects', d: 60, rot: 0.15, icon: 'rover', accent: '#ff8a4a' },
    { id: 'research', title: 'Research', style: 'research', d: 62, rot: 0.12, icon: 'robotArm', accent: '#ff6ad5' },
    { id: 'positions', title: 'Positions of\nResponsibility', style: 'positions', d: 56, rot: 0.22, icon: 'microphone', accent: '#7dff9a' },
    { id: 'awards', title: 'Awards &\nPrizes', style: 'awards', d: 42, rot: 0.2, icon: 'trophy', accent: '#8fd8ff' },
    { id: 'work', title: 'Work\nExperience', style: 'work', d: 68, rot: 0.1, icon: 'work', accent: '#6fa8ff', moon: true },
  ];

  // clockwise order around the astronaut, starting top-left
  const ORBIT_ORDER = ['education', 'skills', 'projects', 'positions', 'work', 'awards', 'research'];
  const ORBIT_PERIOD = 150;       // seconds for one full lap
  const ORBIT_START = -2.25;      // ellipse angle of the first planet (top-left)
  const FAR_SCALE = 0.75, NEAR_SCALE = 0.95; // planet size at the back / front of the orbit

  // arc-length lookup so planets stay evenly spaced along the ellipse
  const orbit = { rx: 0, ryTop: 0, ryBottom: 0, table: null, length: 0 };
  const ORBIT_STEPS = 720;

  // the lower half is flatter than the upper half: the name sits below the astronaut
  const orbitY = (a, ryTop, ryBottom) => Math.sin(a) * (Math.sin(a) < 0 ? ryTop : ryBottom);

  function buildOrbit(rx, ryTop, ryBottom) {
    if (orbit.table && orbit.rx === rx && orbit.ryTop === ryTop && orbit.ryBottom === ryBottom) return;
    const table = new Float32Array(ORBIT_STEPS + 1);
    let len = 0, px = rx, py = 0;
    for (let i = 1; i <= ORBIT_STEPS; i++) {
      const a = (i / ORBIT_STEPS) * TAU;
      const x = rx * Math.cos(a), y = orbitY(a, ryTop, ryBottom);
      len += Math.hypot(x - px, y - py);
      table[i] = len;
      px = x; py = y;
    }
    Object.assign(orbit, { rx, ryTop, ryBottom, table, length: len });
  }

  // ellipse angle at a given distance along the orbit
  function angleAt(dist) {
    const { table, length } = orbit;
    let s = dist % length;
    if (s < 0) s += length;
    let lo = 0, hi = ORBIT_STEPS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (table[mid] < s) lo = mid; else hi = mid;
    }
    const f = (s - table[lo]) / (table[hi] - table[lo] || 1);
    return ((lo + f) / ORBIT_STEPS) * TAU;
  }

  function distAt(angle) {
    const a = ((angle % TAU) + TAU) % TAU;
    const i = Math.floor((a / TAU) * ORBIT_STEPS);
    return orbit.table[i];
  }

  const layer = document.getElementById('planets');
  const planets = [];
  let scale = 3; // css px per planet pixel

  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    e.className = cls;
    parent.appendChild(e);
    return e;
  }

  function init() {
    SECTIONS.forEach((sec, i) => {
      const rand = rng(i * 97 + 13);
      const root = el('div', 'planet', layer);
      root.dataset.section = sec.id;
      root.style.setProperty('--accent', sec.accent);

      const body = el('div', 'planet-body', root);
      const sprite = new PlanetSprite(sec.style, sec.d, sec.rot, ICONS[sec.icon]);
      sprite.canvas.className = 'planet-canvas pixel';
      body.appendChild(sprite.canvas);

      const moons = [];
      (sec.logos || []).forEach((name, k, all) => {
        const logo = LOGOS[name];
        const m = el('canvas', 'moon pixel', body);
        m.width = logo.width;
        m.height = logo.height;
        m.getContext('2d').drawImage(logo, 0, 0);
        m.title = name;
        moons.push({ el: m, w: logo.width, h: logo.height, phase: (k / all.length) * TAU, speed: 0.28, a: 2.0, b: 0.36, tilt: -0.18 });
      });
      if (sec.moon) {
        const rock = new PlanetSprite('rock', 12, 0.4, null);
        rock.canvas.className = 'moon pixel';
        body.appendChild(rock.canvas);
        moons.push({ el: rock.canvas, sprite: rock, w: rock.size, h: rock.size, phase: 1, speed: 0.35, a: 1.45, b: 0.5, tilt: 0.3 });
      }

      const label = el('div', 'planet-label', root);
      label.textContent = sec.title;

      body.tabIndex = 0;
      body.setAttribute('role', 'button');
      body.setAttribute('aria-label', 'Open ' + sec.title.replace(/\n/g, ' '));
      const open = () => window.Sections && window.Sections.open(sec.id, body);
      body.addEventListener('click', open);
      body.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });

      planets.push({
        sec, root, body, sprite, moons, label,
        slot: ORBIT_ORDER.indexOf(sec.id),
        bob: { amp: 4 + rand() * 6, freq: 0.3 + rand() * 0.3, phase: rand() * TAU },
        depth: 3 + rand() * 4,
      });
    });
    resize();
  }

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.max(0.45, Math.min(1.25, Math.min(vw / 1500, vh / 760)));
    // snap to whole device pixels so every planet pixel is the same size
    scale = Math.max(1, Math.round(3.3 * fit * dpr)) / dpr;
    document.documentElement.style.setProperty('--planet-px', scale + 'px');

    for (const p of planets) {
      const s = p.sprite;
      p.body.style.width = p.body.style.height = s.D * scale + 'px';
      s.canvas.style.width = s.canvas.style.height = s.size * scale + 'px';
      s.canvas.style.left = s.canvas.style.top = (s.D - s.size) / 2 * scale + 'px';
      for (const m of p.moons) {
        m.el.style.width = m.w * scale + 'px';
        m.el.style.height = m.h * scale + 'px';
      }
    }
  }

  function update(t, view, PX, center) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const tall = vw / vh < 0.9;
    // fit the orbit so the biggest planet + its label never leave the screen
    let below = 0, above = 0;
    for (const p of planets) {
      const r = p.sprite.D * scale / 2;
      below = Math.max(below, (p.label.offsetTop + p.label.offsetHeight - r) * NEAR_SCALE);
      above = Math.max(above, r * FAR_SCALE);
    }
    const margin = 14;
    buildOrbit(
      Math.round(vw * (tall ? 0.34 : 0.4)),
      Math.round(Math.min(vh * (tall ? 0.4 : 0.38), vh / 2 - above - margin)),
      Math.round(Math.min(vh * (tall ? 0.36 : 0.32), vh / 2 - below - margin)));

    // the orbit follows the drifting astronaut, damped so planets stay on screen
    const cx = vw / 2 + (center.x - vw / 2) * 0.6;
    const cy = vh / 2 + (center.y - vh / 2) * 0.6;
    const travel = reduceMotion ? 0 : (t / ORBIT_PERIOD) * orbit.length;
    const start = distAt(ORBIT_START);
    const fit = scale / 3.3;

    for (const p of planets) {
      const ang = angleAt(start + travel + (p.slot / ORBIT_ORDER.length) * orbit.length);
      const sin = Math.sin(ang);
      const bob = reduceMotion ? 0 : Math.sin(t * p.bob.freq + p.bob.phase) * p.bob.amp * fit;
      const x = cx + Math.cos(ang) * orbit.rx - view.x * p.depth * PX;
      const y = cy + orbitY(ang, orbit.ryTop, orbit.ryBottom) + bob - view.y * p.depth * PX;

      // far side of the orbit (top) is smaller and dimmer, near side larger
      const near = (sin + 1) / 2;
      const depthScale = FAR_SCALE + near * (NEAR_SCALE - FAR_SCALE);
      const size = p.sprite.D * scale;
      p.root.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) scale(${depthScale})`;
      p.root.style.zIndex = Math.round(near * 100);
      p.root.style.filter = `brightness(${0.75 + near * 0.3})`;

      p.sprite.render(t);

      for (const m of p.moons) {
        if (m.sprite) m.sprite.render(t);
        const ang = m.phase + (reduceMotion ? 0 : t * m.speed);
        const R = p.sprite.R * scale;
        const ox = Math.cos(ang) * R * m.a, oy = Math.sin(ang) * R * m.a * m.b;
        const rx = ox * Math.cos(m.tilt) - oy * Math.sin(m.tilt);
        const ry = ox * Math.sin(m.tilt) + oy * Math.cos(m.tilt);
        const front = Math.sin(ang) > 0;
        const moonScale = 0.85 + 0.15 * Math.sin(ang);
        m.el.style.zIndex = front ? 3 : 1;
        m.el.style.transform =
          `translate3d(${size / 2 + rx - (m.w * scale) / 2}px, ${size / 2 + ry - (m.h * scale) / 2}px, 0) scale(${moonScale})`;
      }
    }
  }

  window.Planets = {
    init, resize, update, makeSprite, PlanetSprite, ICONS, LOGOS, SECTIONS,
    getScale: () => scale,
  };
})();
