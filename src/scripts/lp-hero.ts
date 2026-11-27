// A dark, glowing jungle at night: the camera drifts slowly down a path between
// palms, broad leaves, ferns and reeds whose veins glow softly, under hanging
// strands of light, with spores and fireflies in the air and a warm light far
// ahead. Original scene for the ads landing (three.js, no post-processing).
// Plants are drawn once on a canvas atlas at load, so nothing is downloaded.
// The cursor makes nearby leaves and lights glow; hovering the arrow slows the
// walk and lifts the fireflies; sound is opt-in (wind, crickets).
import * as THREE from 'three';

const FIELD_LEN = 150; // depth of the looping jungle, in scene units
const NEAR_Z = 12; // where the loop wraps behind the camera
const SKY_LOW = 1.0; // mist is thickest below this height...
const SKY_HIGH = 16.0; // ...and gone into the dark canopy above this one

const commonVertex = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform vec2 uMouse;
  uniform float uAspect;
  uniform float uPx;
  uniform float uDisperse;
  varying float vGlow;
  varying float vFade;

  float wrapZ(float z, float speed) {
    return mod(z + uTravel * speed, ${FIELD_LEN.toFixed(1)}) - ${(FIELD_LEN - NEAR_Z).toFixed(1)};
  }

  vec4 pushFromMouse(vec4 clip, float strength) {
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    d.x *= uAspect;
    float dist = length(d);
    float f = 1.0 - smoothstep(0.0, 0.45, dist);
    vGlow = f;
    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
    dir.x /= uAspect;
    ndc += dir * f * f * strength;
    clip.xy = ndc * clip.w;
    return clip;
  }
`;

const discFragment = /* glsl */ `
  uniform vec3 uGlowColor;
  varying vec3 vColor;
  varying float vGlow;
  varying float vFade;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.0, r);
    a = a * a;
    vec3 col = mix(vColor, uGlowColor, vGlow * 0.6);
    gl_FragColor = vec4(col * (1.0 + vGlow * 1.4), a * vAlpha * vFade);
  }
`;

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function ground(x: number, z: number) {
  return 0.25 * Math.sin(x * 0.21 + z * 0.05) + 0.18 * Math.sin(z * 0.13 - x * 0.07);
}

// ---------- Plant atlas: 2x2 cells (palm, broad leaves, fern, reeds) ----------
// One canvas holds the silhouettes (mask), the other the glowing veins.
function drawAtlas(cell: number) {
  const size = cell * 2;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d')!;
    x.fillStyle = '#000';
    x.fillRect(0, 0, size, size);
    return { c, x };
  };
  const mask = mk();
  const glow = mk();
  const k = cell / 512; // all drawing is written for a 512 px cell
  let seed = 1;
  const r = () => rand(seed++ * 1.37);

  type Pt = [number, number];
  function spine(bx: number, by: number, ang: number, len: number, droop: number, n = 26): Pt[] {
    const pts: Pt[] = [];
    const dx = Math.sin(ang);
    const dy = -Math.cos(ang);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([bx + dx * len * t, by + dy * len * t + droop * len * t * t]);
    }
    return pts;
  }
  function normals(pts: Pt[]): Pt[] {
    return pts.map((p, i) => {
      const a = pts[Math.max(i - 1, 0)];
      const b = pts[Math.min(i + 1, pts.length - 1)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1;
      return [-ty / l, tx / l];
    });
  }
  // A lens-shaped leaf along a bent spine. veins: midrib + side veins glow.
  function leaf(ox: number, oy: number, bx: number, by: number, ang: number, len: number, w: number, droop: number, veins: 0 | 1 | 2) {
    const pts = spine(bx, by, ang, len, droop);
    const nm = normals(pts);
    const wt = (t: number) => w * Math.pow(Math.sin(Math.PI * Math.min(t * 1.05, 1)), 0.75);
    const L = pts.map((p, i) => [p[0] + nm[i][0] * wt(i / (pts.length - 1)), p[1] + nm[i][1] * wt(i / (pts.length - 1))] as Pt);
    const R = pts.map((p, i) => [p[0] - nm[i][0] * wt(i / (pts.length - 1)), p[1] - nm[i][1] * wt(i / (pts.length - 1))] as Pt);
    const m = mask.x;
    m.fillStyle = '#fff';
    m.beginPath();
    m.moveTo(ox + L[0][0] * k, oy + L[0][1] * k);
    L.forEach((p) => m.lineTo(ox + p[0] * k, oy + p[1] * k));
    [...R].reverse().forEach((p) => m.lineTo(ox + p[0] * k, oy + p[1] * k));
    m.closePath();
    m.fill();
    if (!veins) return;
    const g = glow.x;
    g.strokeStyle = '#fff';
    g.lineCap = 'round';
    g.lineWidth = 2.4 * k;
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(ox + p[0] * k, oy + p[1] * k) : g.moveTo(ox + p[0] * k, oy + p[1] * k)));
    g.stroke();
    if (veins === 2) {
      g.lineWidth = 1.3 * k;
      for (let i = 2; i < pts.length - 3; i += 2) {
        const j = Math.min(i + 3, pts.length - 1);
        g.beginPath();
        g.moveTo(ox + pts[i][0] * k, oy + pts[i][1] * k);
        g.lineTo(ox + (pts[j][0] * 0.35 + L[j][0] * 0.65) * k, oy + (pts[j][1] * 0.35 + L[j][1] * 0.65) * k);
        g.moveTo(ox + pts[i][0] * k, oy + pts[i][1] * k);
        g.lineTo(ox + (pts[j][0] * 0.35 + R[j][0] * 0.65) * k, oy + (pts[j][1] * 0.35 + R[j][1] * 0.65) * k);
        g.stroke();
      }
    }
  }
  // A frond: a spine with small leaflets on both sides (fern, palm).
  function frond(ox: number, oy: number, bx: number, by: number, ang: number, len: number, lw: number, droop: number) {
    const pts = spine(bx, by, ang, len, droop, 34);
    const nm = normals(pts);
    for (let i = 3; i < pts.length - 1; i++) {
      const t = i / (pts.length - 1);
      const ll = lw * (1 - t * 0.75);
      for (const s of [1, -1]) {
        const a = Math.atan2(nm[i][0] * s, -nm[i][1] * s) + s * 0.55 * (i % 2 ? 1 : 0.9);
        leaf(ox, oy, pts[i][0], pts[i][1], a, ll, ll * 0.16, 0.25, 0);
      }
    }
    const m = mask.x;
    m.strokeStyle = '#fff';
    m.lineWidth = 3 * k;
    m.beginPath();
    pts.forEach((p, i) => (i ? m.lineTo(ox + p[0] * k, oy + p[1] * k) : m.moveTo(ox + p[0] * k, oy + p[1] * k)));
    m.stroke();
    const g = glow.x;
    g.strokeStyle = '#fff';
    g.lineWidth = 2 * k;
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(ox + p[0] * k, oy + p[1] * k) : g.moveTo(ox + p[0] * k, oy + p[1] * k)));
    g.stroke();
  }
  function orb(ox: number, oy: number, x: number, y: number, rad: number) {
    for (const t of [mask.x, glow.x]) {
      t.fillStyle = '#fff';
      t.beginPath();
      t.arc(ox + x * k, oy + y * k, rad * k, 0, Math.PI * 2);
      t.fill();
    }
  }

  glow.x.shadowColor = '#fff';
  glow.x.shadowBlur = 10 * k;

  // Cell 0: a palm with a slender trunk and drooping fronds
  {
    const ox = 0;
    const oy = 0;
    const top: [number, number] = [262, 250];
    const m = mask.x;
    m.fillStyle = '#fff';
    m.beginPath();
    m.moveTo(248 * k, 512 * k);
    m.quadraticCurveTo(236 * k, 380 * k, (top[0] - 5) * k, top[1] * k);
    m.lineTo((top[0] + 5) * k, top[1] * k);
    m.quadraticCurveTo(252 * k, 380 * k, 266 * k, 512 * k);
    m.fill();
    for (let i = 0; i < 12; i++) {
      const a = -2.3 + (4.6 * i) / 11 + (r() - 0.5) * 0.2;
      frond(ox, oy, top[0], top[1], a, 170 + r() * 60, 46 + r() * 14, 0.35 + r() * 0.35);
    }
  }
  // Cell 1: broad banana and elephant-ear leaves
  {
    const ox = cell;
    const oy = 0;
    for (let i = 0; i < 7; i++) {
      const a = -1.15 + (2.3 * i) / 6 + (r() - 0.5) * 0.25;
      const len = 250 + r() * 170;
      leaf(ox, oy, 256 + (r() - 0.5) * 30, 505, a, len, 52 + r() * 42, 0.18 + r() * 0.3, 2);
    }
  }
  // Cell 2: a fern with arching fronds
  {
    const ox = 0;
    const oy = cell;
    for (let i = 0; i < 9; i++) {
      const a = -1.35 + (2.7 * i) / 8 + (r() - 0.5) * 0.2;
      frond(ox, oy, 256, 505, a, 230 + r() * 150, 34 + r() * 12, 0.45 + r() * 0.4);
    }
  }
  // Cell 3: reeds and grasses with small glowing bulbs at the tips
  {
    const ox = cell;
    const oy = cell;
    for (let i = 0; i < 34; i++) {
      const bx = 150 + r() * 212;
      const a = (r() - 0.5) * 0.9;
      const len = 180 + r() * 300;
      const droop = (r() - 0.5) * 0.5;
      leaf(ox, oy, bx, 508, a, len, 3 + r() * 4, droop, i % 4 === 0 ? 1 : 0);
      if (i % 3 === 0) {
        const p = spine(bx, 508, a, len, droop).pop()!;
        orb(ox, oy, p[0], p[1], 5 + r() * 5);
      }
    }
  }

  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    return t;
  };
  return { mask: tex(mask.c), glow: tex(glow.c) };
}

export function startHero(container: HTMLElement, opts: { onLoaded: () => void; onIntroDone: () => void }) {
  const small = window.matchMedia('(max-width: 820px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scale = small ? 0.55 : 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
  renderer.setClearColor(0x03110f, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
  const camBase = new THREE.Vector3(0, 1.75, 10);
  const camStart = new THREE.Vector3(0, 5.5, 15);
  camera.position.copy(camStart);

  const fogColor = new THREE.Color('#145247');
  const uniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uAspect: { value: 1 },
    uPx: { value: renderer.getPixelRatio() },
    uDisperse: { value: 0 },
    uGlowColor: { value: new THREE.Color('#bfffe9') },
    uFog: { value: fogColor },
    uSky: { value: new THREE.Color('#020a09') },
  };

  // ---------- Sky: mist near the ground fading up into the dark canopy,
  // with a warm light far down the path ----------
  {
    const m = new THREE.ShaderMaterial({
      uniforms,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uFog;
        uniform vec3 uSky;
        varying vec3 vWorld;
        void main() {
          vec3 col = mix(uFog, uSky, smoothstep(${SKY_LOW.toFixed(1)}, ${(SKY_HIGH * 1.25).toFixed(1)}, vWorld.y));
          vec2 p = vec2(vWorld.x / 70.0, (vWorld.y - 7.0) / 34.0);
          float d = length(p);
          float breathe = 0.9 + 0.1 * sin(uTime * 0.35);
          col += vec3(1.0, 0.8, 0.5) * exp(-d * d * 40.0) * 0.9 * breathe;
          col += vec3(0.2, 0.7, 0.58) * exp(-d * d * 5.0) * 0.5 * breathe;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), m);
    plane.position.set(0, 120, -170);
    plane.renderOrder = -3;
    scene.add(plane);
  }

  // ---------- Ground with mist ----------
  {
    const m = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying float vDepth;
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          vec4 mv = viewMatrix * w;
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uFog;
        varying float vDepth;
        varying vec3 vWorld;
        void main() {
          float fog = 1.0 - exp(-vDepth * 0.045);
          float path = 1.0 - smoothstep(0.6, 2.4, abs(vWorld.x));
          vec3 base = mix(vec3(0.01, 0.04, 0.034), vec3(0.05, 0.14, 0.11), path);
          gl_FragColor = vec4(mix(base, uFog, fog), 1.0);
        }
      `,
    });
    const g = new THREE.PlaneGeometry(200, 300);
    g.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(0, -0.05, -120);
    mesh.renderOrder = -1;
    scene.add(mesh);
  }

  // ---------- Plants ----------
  {
    const atlas = drawAtlas(small ? 256 : 512);
    const n = Math.round(1100 * scale);
    const off = new Float32Array(n * 3);
    const scl = new Float32Array(n * 2);
    const typ = new Float32Array(n);
    const sd = new Float32Array(n);
    const rot = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const side = rand(i + 101) < 0.5 ? -1 : 1;
      const spread = Math.pow(rand(i + 102), 1.25);
      const ax = 1.9 + spread * 17;
      const x = side * ax;
      const z = rand(i + 103) * FIELD_LEN;
      // near the path: ferns, reeds and broad leaves; further out: palms
      const pick = rand(i + 104);
      let t: number;
      if (ax < 4.5) t = pick < 0.45 ? 2 : pick < 0.8 ? 3 : 1;
      else if (ax < 9) t = pick < 0.25 ? 0 : pick < 0.6 ? 1 : pick < 0.85 ? 2 : 3;
      else t = pick < 0.6 ? 0 : pick < 0.85 ? 1 : 2;
      const hBase = [5.5, 2.6, 1.9, 1.5][t];
      const hVar = [4.5, 2.0, 1.2, 1.0][t];
      const h = hBase + rand(i + 105) * hVar + (t === 0 ? ax * 0.12 : 0);
      off.set([x, ground(x, z) - 0.05, z], i * 3);
      scl.set([h * (t === 3 ? 0.8 : 1.05), h], i * 2);
      typ[i] = t;
      sd[i] = rand(i + 106);
      rot[i] = (rand(i + 107) - 0.5) * 1.1 - side * 0.35;
    }
    const base = new THREE.PlaneGeometry(1, 1, 1, 6);
    base.translate(0, 0.5, 0);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(scl, 2));
    g.setAttribute('aType', new THREE.InstancedBufferAttribute(typ, 1));
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1));
    g.setAttribute('aRot', new THREE.InstancedBufferAttribute(rot, 1));
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({
      uniforms: {
        ...uniforms,
        uMask: { value: atlas.mask },
        uVeins: { value: atlas.glow },
        uGlowA: { value: new THREE.Color('#3dffc8') },
        uGlowB: { value: new THREE.Color('#9a7bff') },
      },
      side: THREE.DoubleSide,
      vertexShader: commonVertex + /* glsl */ `
        attribute vec3 aOffset;
        attribute vec2 aScale;
        attribute float aType;
        attribute float aSeed;
        attribute float aRot;
        varying vec2 vAtlas;
        varying vec2 vUv;
        varying float vDepth;
        varying float vSeed;
        varying float vY;
        void main() {
          vec3 p = position;
          p.x *= aScale.x;
          p.y *= aScale.y;
          float bend = uv.y * uv.y;
          p.x += (sin(uTime * 0.55 + aSeed * 23.0 + aOffset.z * 0.15) * 0.07 + sin(uTime * 1.3 + aSeed * 9.0) * 0.02) * bend * aScale.y;
          float c = cos(aRot);
          float s = sin(aRot);
          p = vec3(p.x * c, p.y, p.x * s);
          vec3 o = aOffset;
          o.z = wrapZ(o.z, 1.0);
          vec4 mv = modelViewMatrix * vec4(o + p, 1.0);
          vDepth = -mv.z;
          vY = o.y + p.y;
          vFade = smoothstep(0.6, 2.2, vDepth);
          vSeed = aSeed;
          vUv = uv;
          float cx = mod(aType, 2.0);
          float cy = floor(aType / 2.0);
          vAtlas = vec2((cx + uv.x) * 0.5, (1.0 - cy + uv.y) * 0.5);
          gl_Position = pushFromMouse(projectionMatrix * mv, 0.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMask;
        uniform sampler2D uVeins;
        uniform vec3 uFog;
        uniform vec3 uSky;
        uniform vec3 uGlowA;
        uniform vec3 uGlowB;
        uniform float uTime;
        varying vec2 vAtlas;
        varying vec2 vUv;
        varying float vDepth;
        varying float vSeed;
        varying float vY;
        varying float vGlow;
        varying float vFade;
        void main() {
          float m = texture2D(uMask, vAtlas).r;
          if (m < 0.5 || vFade < 0.02) discard;
          float v = texture2D(uVeins, vAtlas).r;
          float fog = 1.0 - exp(-vDepth * 0.04);
          vec3 fogCol = mix(uFog, uSky, smoothstep(${SKY_LOW.toFixed(1)}, ${SKY_HIGH.toFixed(1)}, vY));
          vec3 body = mix(vec3(0.008, 0.03, 0.024), vec3(0.03, 0.1, 0.08), vUv.y);
          vec3 glowCol = mix(uGlowA, uGlowB, smoothstep(0.55, 1.0, vSeed));
          float pulse = 0.5 + 0.5 * sin(uTime * 0.8 + vSeed * 31.0 + vDepth * 0.12);
          float lit = v * (0.45 + 0.75 * pulse) * (1.0 + vGlow * 2.2);
          vec3 col = body + glowCol * lit;
          col = mix(col, fogCol, fog * (1.0 - lit * 0.25));
          gl_FragColor = vec4(col * vFade, 1.0);
        }
      `,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    scene.add(mesh);
  }

  // ---------- Glowing moss on the ground ----------
  {
    const n = Math.round(5200 * scale);
    const pos: number[] = [];
    const col: number[] = [];
    const size: number[] = [];
    const seed: number[] = [];
    const a = new THREE.Color('#2ee6b0');
    const b = new THREE.Color('#5fb8ff');
    const c = new THREE.Color('#b08cff');
    for (let i = 0; i < n; i++) {
      const x = (rand(i + 201) - 0.5) * 40;
      const z = rand(i + 202) * FIELD_LEN;
      pos.push(x, ground(x, z) + 0.03 + rand(i + 203) * 0.25, z);
      const k = rand(i + 204);
      const cc = k < 0.6 ? a.clone().lerp(b, rand(i + 205)) : b.clone().lerp(c, rand(i + 206));
      col.push(cc.r, cc.g, cc.b);
      size.push(0.4 + rand(i + 207) * 0.9);
      seed.push(rand(i + 208));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: commonVertex + /* glsl */ `
        attribute vec3 color;
        attribute float aSize;
        attribute float aSeed;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.z = wrapZ(p.z, 1.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float depth = -mv.z;
          vFade = smoothstep(110.0, 20.0, depth) * smoothstep(0.8, 4.0, depth);
          vColor = color;
          vAlpha = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (0.4 + aSeed) + aSeed * 40.0), 2.0);
          gl_PointSize = min(aSize * uPx * (90.0 / depth), 7.0 * uPx);
          gl_Position = pushFromMouse(projectionMatrix * mv, 0.02);
        }
      `,
      fragmentShader: discFragment,
    });
    scene.add(new THREE.Points(g, m));
  }

  // ---------- Hanging strands of light ----------
  {
    const strands = Math.round(170 * scale);
    const pos: number[] = [];
    const seed: number[] = [];
    const drop: number[] = [];
    for (let s = 0; s < strands; s++) {
      const side = rand(s + 301) < 0.5 ? -1 : 1;
      const x = side * (1.2 + rand(s + 302) * 9);
      const z = rand(s + 303) * FIELD_LEN;
      const top = 7 + rand(s + 304) * 5;
      const len = 1.5 + rand(s + 305) * 4.5;
      const sdv = rand(s + 306);
      const beads = Math.round(len / 0.16);
      for (let i = 0; i < beads; i++) {
        const t = i / beads;
        pos.push(x, top - t * len, z);
        seed.push(sdv);
        drop.push(t);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute('aDrop', new THREE.Float32BufferAttribute(drop, 1));
    const m = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: commonVertex + /* glsl */ `
        attribute float aSeed;
        attribute float aDrop;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.z = wrapZ(p.z, 1.0);
          p.x += sin(uTime * 0.45 + aSeed * 17.0) * 0.25 * aDrop * aDrop;
          p.z += cos(uTime * 0.35 + aSeed * 11.0) * 0.15 * aDrop;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float depth = -mv.z;
          vFade = smoothstep(120.0, 25.0, depth) * smoothstep(1.0, 5.0, depth);
          float wave = 0.5 + 0.5 * sin(aDrop * 9.0 - uTime * 1.1 + aSeed * 20.0);
          vColor = mix(vec3(0.3, 1.0, 0.8), vec3(0.75, 0.6, 1.0), aSeed);
          vAlpha = (0.25 + 0.75 * wave) * (1.0 - aDrop * 0.35);
          gl_PointSize = min((0.9 + (1.0 - aDrop) * 0.6) * uPx * (110.0 / depth), 9.0 * uPx);
          gl_Position = pushFromMouse(projectionMatrix * mv, 0.03);
        }
      `,
      fragmentShader: discFragment,
    });
    scene.add(new THREE.Points(g, m));
  }

  // ---------- Fireflies and spores ----------
  {
    const n = Math.round(1500 * scale);
    const pos: number[] = [];
    const seed: number[] = [];
    for (let i = 0; i < n; i++) {
      const x = (rand(i + 11) - 0.5) * 34;
      const z = rand(i + 12) * FIELD_LEN;
      pos.push(x, 0.3 + rand(i + 13) * 7, z);
      seed.push(rand(i + 14));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: commonVertex + /* glsl */ `
        attribute float aSeed;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.z = wrapZ(p.z, 0.94);
          float t = uTime * (0.18 + aSeed * 0.3) + aSeed * 40.0;
          p.x += sin(t) * 0.8 + sin(t * 2.3) * 0.2;
          p.y += sin(t * 1.3 + 1.3) * 0.45 + fract(uTime * 0.02 + aSeed) * 0.8;
          p.z += cos(t * 0.8) * 0.5;
          p.y += uDisperse * (1.2 + aSeed * 6.0);
          p.x *= 1.0 + uDisperse * 0.3;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float depth = -mv.z;
          float twinkle = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.2) + aSeed * 20.0), 3.0);
          vFade = smoothstep(110.0, 25.0, depth) * smoothstep(1.2, 5.0, depth);
          // most are cool spores, one in five a warm firefly
          vColor = aSeed > 0.8 ? vec3(1.0, 0.78, 0.4) : mix(vec3(0.45, 1.0, 0.85), vec3(0.6, 0.85, 1.0), aSeed);
          vAlpha = twinkle * (0.85 + uDisperse * 0.3);
          float sz = aSeed > 0.8 ? 2.4 : 1.2 + aSeed;
          gl_PointSize = min(sz * (1.0 + uDisperse * 0.5) * uPx * (180.0 / depth), 16.0 * uPx);
          gl_Position = pushFromMouse(projectionMatrix * mv, 0.1);
        }
      `,
      fragmentShader: discFragment,
    });
    scene.add(new THREE.Points(g, m));
  }

  // ---------- Sizing ----------
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 58;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = w / h;
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Input ----------
  const mouseTarget = new THREE.Vector2(9, 9);
  const tilt = new THREE.Vector2(0, 0);
  container.parentElement?.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    mouseTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  });
  container.parentElement?.addEventListener('pointerleave', () => mouseTarget.set(9, 9));

  let boost = 0;
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const d = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    boost = Math.min(boost + Math.abs(d) * 0.02, 3);
  }, { passive: true });

  let disperseTarget = 0;

  // ---------- Loop ----------
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(container);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });

  const clock = { t: 0 };
  let last = performance.now();
  let speed = 0;
  let loaded = false;
  let introDone = false;
  const introLen = reduced ? 0.01 : 3.6;
  const look = new THREE.Vector3();

  function frame(now: number) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduced) clock.t += dt;

    const intro = reduced ? 1 : Math.min(clock.t / introLen, 1);
    const ease = 1 - Math.pow(1 - intro, 3);

    boost *= Math.pow(0.15, dt);
    const d = uniforms.uDisperse.value;
    uniforms.uDisperse.value += (disperseTarget - d) * Math.min(dt * 2.2, 1);
    // a slow walk deeper into the jungle
    const targetSpeed = reduced ? 0 : (0.7 + boost) * (1 - uniforms.uDisperse.value * 0.9);
    speed += (targetSpeed - speed) * Math.min(dt * 1.5, 1);
    uniforms.uTravel.value += speed * dt;
    uniforms.uTime.value = clock.t;

    const m = uniforms.uMouse.value;
    m.lerp(mouseTarget, Math.min(dt * 6, 1));
    const mx = Math.abs(mouseTarget.x) > 2 ? 0 : mouseTarget.x;
    const my = Math.abs(mouseTarget.y) > 2 ? 0 : mouseTarget.y;
    tilt.lerp(new THREE.Vector2(mx, my), Math.min(dt * 2, 1));

    camera.position.lerpVectors(camStart, camBase, ease);
    // a gentle sway, like walking
    camera.position.x += tilt.x * 0.5 + Math.sin(clock.t * 0.16) * 0.35;
    camera.position.y += tilt.y * 0.25 + Math.sin(clock.t * 1.1) * 0.025;
    look.set(tilt.x * 2.2 + Math.sin(clock.t * 0.12) * 0.6, 2.4 + tilt.y * 1.1 - (1 - ease) * 2.5, -30);
    camera.lookAt(look);

    renderer.render(scene, camera);
    if (!loaded) { loaded = true; opts.onLoaded(); }
    if (!introDone && intro >= 1) { introDone = true; opts.onIntroDone(); }
  }
  requestAnimationFrame(frame);

  return {
    startHoverTransition: () => { disperseTarget = 1; },
    stopHoverTransition: () => { disperseTarget = 0; },
  };
}

// ---------- Night sound: wind and crickets, made in the browser ----------
export function createNightSound() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let on = false;
  let chirpTimer = 0;

  function init() {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 9000;
    master.connect(filter).connect(ctx.destination);

    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); data[i] = b * 3; }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const wind = ctx.createBiquadFilter();
    wind.type = 'bandpass';
    wind.frequency.value = 420;
    wind.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.22;
    noise.connect(wind).connect(windGain).connect(master);
    noise.start();
  }

  function chirp() {
    if (!ctx || !master || !on) return;
    const t0 = ctx.currentTime;
    const f = 4200 + Math.random() * 900;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(master);
    const pulses = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pulses; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      const s = t0 + i * 0.055;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.035 + Math.random() * 0.02, s + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.04);
      o.connect(g).connect(pan);
      o.start(s);
      o.stop(s + 0.05);
    }
    chirpTimer = window.setTimeout(chirp, 260 + Math.random() * 900);
  }

  return {
    toggle(): boolean {
      if (!ctx) init();
      on = !on;
      const now = ctx!.currentTime;
      master!.gain.cancelScheduledValues(now);
      master!.gain.setTargetAtTime(on ? 0.9 : 0, now, 0.6);
      if (on) { ctx!.resume(); chirp(); } else { window.clearTimeout(chirpTimer); }
      return on;
    },
    muffle(v: boolean) {
      if (!ctx || !filter) return;
      filter.frequency.setTargetAtTime(v ? 700 : 9000, ctx.currentTime, 0.4);
    },
  };
}
