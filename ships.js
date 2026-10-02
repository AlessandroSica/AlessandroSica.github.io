// Small pixel spaceships that occasionally fly across the screen. Far ships are
// smaller, dimmer and pass behind the planets; near ships pass in front.

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const farLayer = document.getElementById('ships-far');
  const nearLayer = document.getElementById('ships-near');

  // all designs face right; two frames each for engine flicker / blinking lights
  const HULL = { w: '#e8ecf4', g: '#8a90a0', d: '#4a5060', c: '#4ff0ff', m: '#ff4fe1', r: '#ff3b6b' };
  const FLAME_A = { F: '#ffcc33', f: '#ff7a1a' };
  const FLAME_B = { F: '#fff3b0', f: '#ffcc33' };

  const DESIGNS = {
    fighter: {
      body: [
        '....ww.......',
        '....wmw......',
        '..gwwwwccw...',
        '.gwwwwwwwwwwr',
        '..gwwwwwwww..',
        '....wmw......',
        '....ww.......',
      ],
      flames: [
        ['', '', '.F', 'fF', '.F', '', ''],
        ['', '', 'fF', 'FF', 'fF', '', ''],
      ],
    },
    rocket: {
      body: [
        'rr...........',
        'rrrwwwwwww...',
        '..wwwwwcwwwr.',
        '..wwwwcccwwrr',
        '..wwwwwcwwwr.',
        'rrrwwwwwww...',
        'rr...........',
      ],
      flames: [
        ['', '', '.f', 'fF', '.f', '', ''],
        ['', '', 'fF', 'FF', 'fF', '', ''],
      ],
    },
    ufo: {
      body: [
        '.....ccc.....',
        '....cwccc....',
        '..ggggggggg..',
        'ggggggggggggg',
        '.dAdBdAdBdAd.',
        '...ddddddd...',
      ],
      lights: true,
    },
  };

  function buildFrames(design) {
    const { makeSprite } = window.Planets;
    if (design.lights) {
      return [0, 1].map(k => makeSprite(
        [{ x: 0, y: 0, rows: design.body }],
        { ...HULL, A: k ? '#ff4fe1' : '#4ff0ff', B: k ? '#4ff0ff' : '#ffcc33' }));
    }
    return design.flames.map((flame, k) => makeSprite(
      [{ x: 0, y: 0, rows: flame }, { x: 2, y: 0, rows: design.body }],
      { ...HULL, ...(k ? FLAME_B : FLAME_A) }));
  }

  let frames = null;
  const ships = [];
  let nextSpawn = 3;
  let clock = 0;

  function ensureFrames() {
    if (!frames) {
      frames = Object.fromEntries(Object.entries(DESIGNS).map(([k, d]) => [k, buildFrames(d)]));
    }
  }

  function spawnShip(opts = {}) {
    ensureFrames();
    const vw = window.innerWidth, vh = window.innerHeight;
    const type = opts.type || ['fighter', 'fighter', 'rocket', 'ufo'][Math.floor(Math.random() * 4)];
    const near = opts.near ?? Math.random() < 0.45;
    const dir = opts.dir ?? (Math.random() < 0.5 ? 1 : -1);
    const px = window.Planets.getScale() * (near ? 1.15 : 0.7);

    const el = document.createElement('canvas');
    el.className = 'ship pixel';
    const f = frames[type][0];
    el.width = f.width;
    el.height = f.height;
    el.style.width = f.width * px + 'px';
    el.style.height = f.height * px + 'px';
    el.style.opacity = near ? 1 : 0.6;
    (near ? nearLayer : farLayer).appendChild(el);

    const w = f.width * px;
    const y0 = opts.y ?? vh * (0.08 + Math.random() * 0.84);
    const ship = {
      el, type, dir, w,
      ctx: el.getContext('2d'),
      frame: -1,
      x: dir > 0 ? -w - (opts.lag || 0) : vw + (opts.lag || 0),
      y: y0,
      speed: (near ? 150 : 80) * (0.8 + Math.random() * 0.5) * (type === 'ufo' ? 0.7 : 1),
      climb: (Math.random() - 0.5) * (near ? 40 : 20),
      wobble: { amp: type === 'ufo' ? 10 : 3, freq: 1 + Math.random() * 1.5, phase: Math.random() * 6.28 },
      tilt: 0,
    };
    ships.push(ship);
    return ship;
  }

  function spawn() {
    if (Math.random() < 0.2) {
      // small formation of fighters
      const dir = Math.random() < 0.5 ? 1 : -1;
      const y = window.innerHeight * (0.15 + Math.random() * 0.7);
      const near = Math.random() < 0.5;
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const s = spawnShip({ type: 'fighter', dir, near, y: y + (i % 2 ? 1 : -1) * i * 14, lag: i * 46 });
        s.speed = (near ? 165 : 90);
        s.climb = 0;
      }
    } else {
      spawnShip();
    }
  }

  function update(dt) {
    if (reduceMotion) return;
    clock += dt;

    nextSpawn -= dt;
    if (nextSpawn <= 0 && ships.length < 5) {
      spawn();
      nextSpawn = 5 + Math.random() * 8;
    }

    const vw = window.innerWidth;
    for (let i = ships.length - 1; i >= 0; i--) {
      const s = ships[i];
      s.x += s.dir * s.speed * dt;
      s.y += s.climb * dt;
      const wob = Math.sin(clock * s.wobble.freq + s.wobble.phase);
      const y = s.y + wob * s.wobble.amp;

      // flicker engines / blink lights
      const frame = Math.floor(clock * (s.type === 'ufo' ? 4 : 12)) % 2;
      if (frame !== s.frame) {
        const img = frames[s.type][frame];
        s.ctx.clearRect(0, 0, s.el.width, s.el.height);
        s.ctx.drawImage(img, 0, 0);
        s.frame = frame;
      }

      // ships bank slightly as they climb/dive; UFOs rock side to side
      const tilt = s.type === 'ufo' ? wob * 6 : (s.climb / s.speed) * 40 * s.dir;
      s.el.style.transform =
        `translate3d(${s.x}px, ${y}px, 0) scaleX(${s.dir}) rotate(${tilt}deg)`;

      if ((s.dir > 0 && s.x > vw + 40) || (s.dir < 0 && s.x < -s.w - 40)) {
        s.el.remove();
        ships.splice(i, 1);
      }
    }
  }

  window.Ships = { update, spawn: spawnShip };
})();
