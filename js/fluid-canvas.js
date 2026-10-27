/**
 * BERSERK ABYSS & DEMONIC GAZE CANVAS SIMULATOR
 * Cinematic interactive canvas featuring the iconic glowing golden Berserk eyes reconstructed from hero-profile.gif.
 * Bilateral predatory eye geometry, reactive cursor gaze tracking (visual servoing), dynamic eyelid height modulation,
 * periodic organic blinking cycles, tactile squint on click, and layered rising crimson embers and charcoal ash flakes.
 * All cursor slash trails, sparks, and shockwaves removed for a completely clean native cursor experience.
 * High-performance 60fps canvas engine with dual-theme rendering. Zero AI slop.
 */

export class FluidSimulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;
    this.running = false;

    // Simulation grid dimensions for natural thermal updraft
    this.gridWidth = 60;
    this.gridHeight = 35;
    this.numCells = this.gridWidth * this.gridHeight;

    // Dynamic ember and ash particles
    this.numParticles = 450;
    this.particles = [];

    // Abyssal deep smoke nebula nodes for atmospheric depth
    this.smokeNodes = [];
    this.numSmokeNodes = 10;

    // Pointer and Gaze tracking state
    this.mouse = { x: -1000, y: -1000, px: -1000, py: -1000, down: false, speed: 0 };
    this.gaze = { currentX: 0, currentY: 0, targetX: 0, targetY: 0 };
    this.blinkTimer = 3.6;
    this.isBlinking = false;
    this.blinkProgress = 0;
    this.currentEyelidOpen = 1.0;

    this.updraftSpeed = -0.88; // Natural upward thermal buoyancy
    this.time = 0;
    this.lastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    this.scrollY = 0;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onScroll = this.onScroll.bind(this);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('mousedown', this.onMouseDown, { passive: true });
    window.addEventListener('mouseup', this.onMouseUp, { passive: true });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.seedParticles();
    this.seedSmokeNodes();
  }

  seedSmokeNodes() {
    this.smokeNodes = [];
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (let i = 0; i < this.numSmokeNodes; i++) {
      this.smokeNodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 90 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: 0.025 + Math.random() * 0.035
      });
    }
  }

  seedParticles() {
    this.particles = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < this.numParticles; i++) {
      const rand = Math.random();
      // Types: ember (incandescent glowing red/orange), ash (charcoal flakes), cinder (tiny floating dots)
      const type = rand > 0.42 ? 'ember' : rand > 0.16 ? 'ash' : 'cinder';
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: this.updraftSpeed * (0.65 + Math.random() * 0.75),
        radius: type === 'ember' ? 1.4 + Math.random() * 2.4 : type === 'ash' ? 2.2 + Math.random() * 3.2 : 0.8 + Math.random() * 1.1,
        age: Math.random() * 320,
        maxAge: 220 + Math.random() * 260,
        type: type,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.018 + Math.random() * 0.03,
        heat: 0.5 + Math.random() * 0.5,
        depth: 0.3 + Math.random() * 0.7 // Parallax factor
      });
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.dpr = dpr;
  }

  onScroll() {
    this.scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.dpr || 1);
    const my = (e.clientY - rect.top) * (this.dpr || 1);

    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
  }

  onMouseDown() {
    this.mouse.down = true;
  }

  onMouseUp() {
    this.mouse.down = false;
  }

  onTouchStart(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (touch.clientX - rect.left) * (this.dpr || 1);
      this.mouse.y = (touch.clientY - rect.top) * (this.dpr || 1);
      this.mouse.down = true;
    }
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (touch.clientX - rect.left) * (this.dpr || 1);
      this.mouse.y = (touch.clientY - rect.top) * (this.dpr || 1);
    }
  }

  onTouchEnd() {
    this.mouse.down = false;
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  updateGaze(dt) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dpr = this.dpr || 1;
    const scale = Math.min(Math.max(Math.min(w / 760, h / 520) * dpr, 0.55 * dpr), 1.35 * dpr);
    const scrollParallax = (this.scrollY * dpr) * 0.14;
    const eyeCenterX = w * 0.5;
    const eyeCenterY = Math.min(h * 0.38, 360 * dpr) - scrollParallax;
    const maxGazeRadius = 24 * (scale / dpr) * dpr;

    if (this.mouse.x > -500 && this.mouse.y > -500) {
      const dx = this.mouse.x - eyeCenterX;
      const dy = this.mouse.y - eyeCenterY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      // Non-linear gaze compression: moves smoothly within socket bounds
      const radius = Math.tanh(dist / (380 * dpr)) * maxGazeRadius;
      this.gaze.targetX = Math.cos(angle) * radius;
      this.gaze.targetY = Math.sin(angle) * radius * 0.76;
    } else {
      // Natural subtle idle breathing gaze when no mouse input
      this.gaze.targetX = Math.sin(this.time * 0.6) * (6 * (scale / dpr) * dpr);
      this.gaze.targetY = Math.cos(this.time * 0.45) * (3 * (scale / dpr) * dpr);
    }

    // Smooth spring interpolation for organic lifelike eye movement
    const gazeEase = 0.11;
    this.gaze.currentX += (this.gaze.targetX - this.gaze.currentX) * gazeEase;
    this.gaze.currentY += (this.gaze.targetY - this.gaze.currentY) * gazeEase;

    // Periodic natural blink timer
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.blinkTimer = 3.8 + Math.random() * 3.6;
    }

    if (this.isBlinking) {
      this.blinkProgress += dt / 0.16; // 160ms blink duration
      if (this.blinkProgress >= 1) {
        this.isBlinking = false;
        this.blinkProgress = 0;
      }
    }

    // Dynamic eyelid modulation based on gaze angle and click squint
    let openTarget = 1.0;
    if (this.gaze.currentY < 0) {
      // Looking upwards: open eyelids wider (similar to Frame 10 of hero-profile.gif)
      openTarget += Math.min(0.24, Math.abs(this.gaze.currentY / (maxGazeRadius || 1)) * 0.24);
    } else {
      // Looking downwards: narrow eyelids into a cold predatory gaze (similar to Frame 26 of hero-profile.gif)
      openTarget -= Math.min(0.38, (this.gaze.currentY / (maxGazeRadius || 1)) * 0.38);
    }

    if (this.mouse.down) {
      openTarget *= 0.65; // Focus squint on click
    }

    this.currentEyelidOpen += (openTarget - this.currentEyelidOpen) * 0.14;
  }

  updateParticles(dt = 0.016) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Update deep smoke nodes
    for (let i = 0; i < this.smokeNodes.length; i++) {
      const s = this.smokeNodes[i];
      s.x += s.vx + Math.sin(this.time * 0.4 + s.phase) * 0.2;
      s.y += s.vy;
      if (s.y < -s.radius * 2) {
        s.y = h + s.radius;
        s.x = Math.random() * w;
      }
      if (s.x < -s.radius * 2) s.x = w + s.radius;
      if (s.x > w + s.radius * 2) s.x = -s.radius;
    }

    // 2. Update embers and ash with smooth upward thermal draft
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const sway = Math.sin(this.time * 2.2 + p.phase) * (p.type === 'ash' ? 0.75 : 0.35);

      p.vx = (p.vx * 0.92) + (sway * 0.08);
      p.x += p.vx;
      p.y += p.vy * p.depth;
      p.age++;

      // Respawn when rising above top or drifting offscreen
      if (p.y < -30 || p.x < -30 || p.x > w + 30 || p.age > p.maxAge) {
        p.x = Math.random() * w;
        p.y = h + 15 + Math.random() * 40;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = this.updraftSpeed * (0.65 + Math.random() * 0.75);
        p.age = 0;
        p.maxAge = 220 + Math.random() * 260;
        p.heat = 0.45 + Math.random() * 0.55;
      }
    }
  }

  drawBerserkEyes(ctx, w, h, isLight, scrollParallax) {
    const dpr = this.dpr || 1;
    const scale = Math.min(Math.max(Math.min(w / 760, h / 520) * dpr, 0.55 * dpr), 1.35 * dpr);
    const eyeCenterX = w * 0.5;
    const eyeCenterY = Math.min(h * 0.38, 360 * dpr) - scrollParallax;
    const eyeDistance = 226 * (scale / dpr) * dpr;
    const blinkFactor = this.isBlinking ? (1 - Math.sin(this.blinkProgress * Math.PI)) : 1.0;
    const eyelidOpen = Math.max(0.04, this.currentEyelidOpen * blinkFactor);

    const leftX = eyeCenterX - eyeDistance * 0.5;
    const rightX = eyeCenterX + eyeDistance * 0.5;

    // 1. Outer Crimson Aura: Deep breathing halo surrounding both eye sockets
    const auraPulse = 0.94 + 0.06 * Math.sin(this.time * 2.0);
    const auraRadiusX = 150 * scale;
    const auraRadiusY = 95 * scale;

    if (!isLight) {
      [leftX, rightX].forEach((ex) => {
        ctx.save();
        ctx.translate(ex, eyeCenterY);
        ctx.scale(1, auraRadiusY / auraRadiusX);
        const auraGrad = ctx.createRadialGradient(0, 0, 15 * scale, 0, 0, auraRadiusX * auraPulse);
        auraGrad.addColorStop(0, 'rgba(186, 24, 27, 0.38)');
        auraGrad.addColorStop(0.38, 'rgba(141, 8, 1, 0.18)');
        auraGrad.addColorStop(0.72, 'rgba(60, 6, 8, 0.05)');
        auraGrad.addColorStop(1, 'rgba(6, 6, 9, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadiusX * auraPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 2. Render Left Eye (Natural)
    this.renderSingleEye(ctx, leftX, eyeCenterY, scale, true, this.gaze.currentX, this.gaze.currentY, eyelidOpen, isLight);

    // 3. Render Right Eye (Mirrored horizontally)
    this.renderSingleEye(ctx, rightX, eyeCenterY, scale, false, this.gaze.currentX, this.gaze.currentY, eyelidOpen, isLight);
  }

  renderSingleEye(ctx, cx, cy, scale, isLeft, gazeX, gazeY, eyelidOpen, isLight) {
    ctx.save();
    ctx.translate(cx, cy);
    if (!isLeft) {
      // Flip horizontally for perfect bilateral symmetry
      ctx.scale(-1, 1);
    }

    const s = scale;
    // Local gaze coordinate: when flipped with scale(-1, 1), X gaze is inverted
    const lx = isLeft ? gazeX : -gazeX;
    const ly = gazeY;

    // Socket contour path definition:
    // Left eye outer corner (-58, -4), peak (-8, -36 * eyelidOpen), inner canthus (52, 12), lower trough (-6, 26)
    const buildEyePath = () => {
      ctx.beginPath();
      ctx.moveTo(-58 * s, -4 * s);
      ctx.bezierCurveTo(
        -40 * s, -38 * s * eyelidOpen,
        14 * s, -38 * s * eyelidOpen,
        52 * s, 12 * s
      );
      ctx.bezierCurveTo(
        22 * s, 26 * s,
        -32 * s, 27 * s,
        -58 * s, -4 * s
      );
      ctx.closePath();
    };

    // Clip rendering inside the anatomical eye socket
    ctx.save();
    buildEyePath();
    ctx.clip();

    // Sclera (Dark demonic blood-red undertone)
    const scleraGrad = ctx.createRadialGradient(0, 0, 10 * s, 0, 0, 65 * s);
    if (!isLight) {
      scleraGrad.addColorStop(0, '#380407');
      scleraGrad.addColorStop(0.65, '#1c0204');
      scleraGrad.addColorStop(1, '#050001');
    } else {
      scleraGrad.addColorStop(0, '#ebd4d1');
      scleraGrad.addColorStop(0.65, '#d9a8a5');
      scleraGrad.addColorStop(1, '#9e2a2b');
    }
    ctx.fillStyle = scleraGrad;
    ctx.fill();

    // Iris (Incandescent electric gold glowing yellow with fiery rim)
    const ir = 38 * s;
    const ix = lx;
    const iy = ly;

    // Glowing aura bleeding onto the sclera
    const irisGlow = ctx.createRadialGradient(ix, iy, ir * 0.4, ix, iy, ir * 1.85);
    if (!isLight) {
      irisGlow.addColorStop(0, 'rgba(255, 235, 60, 0.48)');
      irisGlow.addColorStop(0.48, 'rgba(239, 68, 68, 0.32)');
      irisGlow.addColorStop(1, 'rgba(186, 24, 27, 0)');
    } else {
      irisGlow.addColorStop(0, 'rgba(220, 38, 38, 0.35)');
      irisGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
    }
    ctx.fillStyle = irisGlow;
    ctx.beginPath();
    ctx.arc(ix, iy, ir * 1.85, 0, Math.PI * 2);
    ctx.fill();

    // Iris body
    const irisGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, ir);
    if (!isLight) {
      irisGrad.addColorStop(0.00, '#ffffff'); // Blinding incandescent white center
      irisGrad.addColorStop(0.18, '#ffff52'); // Electric glowing yellow (matches GIF)
      irisGrad.addColorStop(0.50, '#ffea00'); // Saturated gold core (matches GIF)
      irisGrad.addColorStop(0.78, '#f59e0b'); // Amber orange
      irisGrad.addColorStop(0.92, '#b91c1c'); // Crimson outer limbal ring
      irisGrad.addColorStop(1.00, '#450a0a'); // Dark blood socket boundary
    } else {
      irisGrad.addColorStop(0.00, '#fffbeb');
      irisGrad.addColorStop(0.25, '#fde047');
      irisGrad.addColorStop(0.65, '#d97706');
      irisGrad.addColorStop(1.00, '#450a0a');
    }
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(ix, iy, ir, 0, Math.PI * 2);
    ctx.fill();

    // Fine radial iris striations
    const numStriations = 24;
    ctx.lineWidth = 1 * s;
    for (let st = 0; st < numStriations; st++) {
      const stAngle = (st / numStriations) * Math.PI * 2;
      const rInner = ir * 0.36;
      const rOuter = ir * (0.82 + 0.12 * Math.sin(st * 4.2 + this.time));
      ctx.strokeStyle = !isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(185, 28, 28, 0.3)';
      ctx.beginPath();
      ctx.moveTo(ix + Math.cos(stAngle) * rInner, iy + Math.sin(stAngle) * rInner);
      ctx.lineTo(ix + Math.cos(stAngle) * rOuter, iy + Math.sin(stAngle) * rOuter);
      ctx.stroke();
    }

    // Slit Demonic Pupil (Sharp vertical cat-eye slit)
    const pw = 5.2 * s;
    const ph = 38 * s * Math.max(0.55, eyelidOpen);
    ctx.beginPath();
    ctx.moveTo(ix, iy - ph * 0.5);
    ctx.bezierCurveTo(ix + pw, iy - ph * 0.22, ix + pw, iy + ph * 0.22, ix, iy + ph * 0.5);
    ctx.bezierCurveTo(ix - pw, iy + ph * 0.22, ix - pw, iy - ph * 0.22, ix, iy - ph * 0.5);
    ctx.closePath();
    ctx.fillStyle = !isLight ? '#020001' : '#140002';
    ctx.fill();

    // Primary specular highlight glint (upper left wet gleam)
    const gx = ix - 9 * s;
    const gy = iy - 11 * s;
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2 * s, 2.6 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.restore();

    // Secondary micro-glint (lower right reflection)
    ctx.beginPath();
    ctx.arc(ix + 8 * s, iy + 9 * s, 1.8 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    // Upper eyelid drop shadow falling onto eyeball
    const shadowGrad = ctx.createLinearGradient(0, -38 * s * eyelidOpen, 0, 10 * s);
    shadowGrad.addColorStop(0, 'rgba(2, 0, 1, 0.88)');
    shadowGrad.addColorStop(0.55, 'rgba(2, 0, 1, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(2, 0, 1, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(-65 * s, -45 * s, 130 * s, 75 * s);

    ctx.restore(); // Exit socket clip

    // Upper Eyelash Rim & Cat-Eye Wing Flare
    ctx.beginPath();
    ctx.moveTo(-74 * s, -14 * s);
    ctx.quadraticCurveTo(-60 * s, -4 * s, -58 * s, -4 * s);
    ctx.bezierCurveTo(
      -40 * s, -38 * s * eyelidOpen,
      14 * s, -38 * s * eyelidOpen,
      52 * s, 12 * s
    );
    ctx.lineWidth = 4.8 * s;
    ctx.lineCap = 'round';
    ctx.strokeStyle = !isLight ? '#010001' : '#1a0408';
    ctx.stroke();

    // Lower subtle eyelid rim
    ctx.beginPath();
    ctx.moveTo(52 * s, 12 * s);
    ctx.bezierCurveTo(
      22 * s, 26 * s,
      -32 * s, 27 * s,
      -58 * s, -4 * s
    );
    ctx.lineWidth = 1.6 * s;
    ctx.strokeStyle = !isLight ? 'rgba(186, 24, 27, 0.65)' : 'rgba(186, 24, 27, 0.4)';
    ctx.stroke();

    // Crease above upper eyelid (Anime double-fold fold)
    ctx.beginPath();
    ctx.moveTo(-48 * s, -24 * s * eyelidOpen);
    ctx.bezierCurveTo(
      -30 * s, -46 * s * eyelidOpen,
      8 * s, -44 * s * eyelidOpen,
      42 * s, -2 * s
    );
    ctx.lineWidth = 1.6 * s;
    ctx.strokeStyle = !isLight ? 'rgba(186, 24, 27, 0.45)' : 'rgba(186, 24, 27, 0.25)';
    ctx.stroke();

    ctx.restore(); // Exit eye translate
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isLight = document.documentElement.dataset.theme === 'light';

    // Cinematic trailing wipe for deep motion persistence
    ctx.fillStyle = isLight ? 'rgba(246, 245, 239, 0.28)' : 'rgba(6, 6, 9, 0.24)';
    ctx.fillRect(0, 0, w, h);

    // Dynamic Parallax Offset from Page Scroll
    const scrollParallax = (this.scrollY * (this.dpr || 1)) * 0.14;

    // 1. Render Deep Abyssal Smoke Nebula
    if (!isLight) {
      for (let i = 0; i < this.smokeNodes.length; i++) {
        const sm = this.smokeNodes[i];
        const radGrd = ctx.createRadialGradient(sm.x, sm.y - scrollParallax * 0.5, 0, sm.x, sm.y - scrollParallax * 0.5, sm.radius);
        radGrd.addColorStop(0, `rgba(141, 8, 1, ${sm.baseAlpha * 1.4})`);
        radGrd.addColorStop(0.5, `rgba(40, 10, 15, ${sm.baseAlpha})`);
        radGrd.addColorStop(1, 'rgba(6, 6, 9, 0)');

        ctx.fillStyle = radGrd;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y - scrollParallax * 0.5, sm.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Render Interactive Demonic Berserk Eyes (Reconstructed from hero-profile.gif)
    this.drawBerserkEyes(ctx, w, h, isLight, scrollParallax);

    // 3. Render Rising Ash Flakes & Burning Embers (Calm natural upward buoyancy)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const lifeRatio = p.age / p.maxAge;
      // Parabolic alpha curve: fades in, glows bright in middle, fades out at top
      const alpha = Math.min(1, Math.sin(lifeRatio * Math.PI));

      if (p.type === 'ember') {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.8);
        if (!isLight) {
          glow.addColorStop(0, `rgba(255, 250, 240, ${alpha * 0.98})`);
          glow.addColorStop(0.3, `rgba(255, 87, 34, ${alpha * 0.88})`);
          glow.addColorStop(0.7, `rgba(239, 35, 60, ${alpha * 0.48})`);
          glow.addColorStop(1, 'rgba(141, 8, 1, 0)');
        } else {
          glow.addColorStop(0, `rgba(186, 24, 27, ${alpha * 0.88})`);
          glow.addColorStop(0.5, `rgba(164, 22, 26, ${alpha * 0.58})`);
          glow.addColorStop(1, 'rgba(102, 7, 8, 0)');
        }

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Incandescent core
        ctx.fillStyle = !isLight ? `rgba(255, 255, 255, ${alpha * 0.95})` : `rgba(102, 7, 8, ${alpha * 0.9})`;
        ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);

      } else if (p.type === 'ash') {
        // Fluttering dark charcoal flake
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase + this.time);
        ctx.fillStyle = !isLight
          ? `rgba(75, 75, 88, ${alpha * 0.48})`
          : `rgba(25, 25, 30, ${alpha * 0.42})`;
        ctx.fillRect(-p.radius, -p.radius * 0.6, p.radius * 2, p.radius * 1.2);
        ctx.restore();

      } else {
        // Cinder point
        ctx.fillStyle = !isLight
          ? `rgba(239, 35, 60, ${alpha * 0.58})`
          : `rgba(186, 24, 27, ${alpha * 0.48})`;
        ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
      }
    }
  }

  loop(now) {
    if (!this.running) return;
    const currentNow = (typeof now === 'number' && now > 0) ? now : ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
    const dt = Math.min((currentNow - (this.lastTime || currentNow)) / 1000, 0.033);
    this.lastTime = currentNow;
    this.time += dt > 0 ? dt : 0.016;

    this.updateGaze(dt);
    this.updateParticles(dt);
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('scroll', this.onScroll);
  }
}
