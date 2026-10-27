/**
 * BERSERK ABYSS & DEMONIC GAZE CANVAS SIMULATOR
 * Cinematic interactive canvas featuring the iconic glowing golden Berserk eyes reconstructed from hero-profile.gif.
 * Bilateral predatory eye geometry, reactive cursor gaze tracking (visual servoing), dynamic eyelid height modulation,
 * periodic organic blinking cycles, tactile squint on click, and layered rising crimson embers and charcoal ash flakes.
 * High-performance 60fps canvas engine with dual-theme rendering. Zero AI slop.
 */

export class FluidSimulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;
    this.running = false;

    // Simulation grid dimensions for wind and turbulence
    this.gridWidth = 80;
    this.gridHeight = 45;
    this.numCells = this.gridWidth * this.gridHeight;

    // Vector velocity fields (u = horizontal velocity, v = vertical updraft velocity)
    this.u = new Float32Array(this.numCells);
    this.v = new Float32Array(this.numCells);

    // Dynamic ember, ash, and spark particles
    this.numParticles = 480;
    this.particles = [];
    this.sparks = [];
    this.shockwaves = [];
    this.bladeTrail = [];

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

    this.updraftSpeed = -0.92; // Natural upward thermal buoyancy
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
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.seedParticles();
    this.seedSmokeNodes();
    this.resetFlow();
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
        vx: (Math.random() - 0.5) * 0.5,
        vy: this.updraftSpeed * (0.6 + Math.random() * 0.9),
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

  resetFlow() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        // Thermal upward convection with sinusoidal turbulence
        this.u[idx] = 0.18 * Math.sin(y * 0.18 + x * 0.12);
        this.v[idx] = this.updraftSpeed * (0.85 + 0.35 * Math.cos(x * 0.14));
      }
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

    if (this.mouse.x > -500) {
      const dx = mx - this.mouse.x;
      const dy = my - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.mouse.speed = dist;

      this.injectForce(mx, my, dx, dy);

      // Record blade slash trail for interactive sword sweep
      this.bladeTrail.push({
        x: mx,
        y: my,
        vx: dx,
        vy: dy,
        speed: dist,
        life: 0,
        maxLife: 20
      });

      // Fast cursor motion strikes sparks like Dragonslayer clashing with steel
      if (dist > 14 && Math.random() > 0.35) {
        this.emitSparks(mx, my, dx * 0.28, dy * 0.28, Math.min(5, Math.floor(dist * 0.12)));
      }
    }

    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
  }

  onMouseDown() {
    this.mouse.down = true;
    if (this.mouse.x > 0) {
      this.spawnShockwave(this.mouse.x, this.mouse.y, 140);
      this.spawnVortex(this.mouse.x, this.mouse.y, 6.0);
      this.emitSparks(this.mouse.x, this.mouse.y, 0, 0, 32);
    }
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
      this.spawnShockwave(this.mouse.x, this.mouse.y, 130);
      this.spawnVortex(this.mouse.x, this.mouse.y, 5.0);
      this.emitSparks(this.mouse.x, this.mouse.y, 0, 0, 24);
    }
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const mx = (touch.clientX - rect.left) * (this.dpr || 1);
      const my = (touch.clientY - rect.top) * (this.dpr || 1);
      const dx = mx - this.mouse.x;
      const dy = my - this.mouse.y;
      const dist = Math.hypot(dx, dy);

      this.injectForce(mx, my, dx, dy);
      this.bladeTrail.push({
        x: mx,
        y: my,
        vx: dx,
        vy: dy,
        speed: dist,
        life: 0,
        maxLife: 20
      });

      this.mouse.x = mx;
      this.mouse.y = my;
      if (dist > 10 && Math.random() > 0.4) {
        this.emitSparks(mx, my, dx * 0.22, dy * 0.22, 4);
      }
    }
  }

  onTouchEnd() {
    this.mouse.down = false;
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  spawnShockwave(x, y, maxRadius = 140) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 6,
      maxRadius: maxRadius,
      speed: 7.5,
      alpha: 0.95
    });

    // Radial force deflection on nearby embers
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < maxRadius * 1.5 && dist > 1) {
        const force = (1 - dist / (maxRadius * 1.5)) * 14;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }
  }

  emitSparks(x, y, baseVx = 0, baseVy = 0, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 6.5;
      this.sparks.push({
        x: x,
        y: y,
        vx: baseVx + Math.cos(angle) * speed,
        vy: baseVy + Math.sin(angle) * speed,
        radius: 1.0 + Math.random() * 2.2,
        life: 0,
        maxLife: 32 + Math.random() * 38,
        decay: 0.93 + Math.random() * 0.04
      });
    }
  }

  injectForce(px, py, dx, dy) {
    const cellX = Math.floor((px / this.canvas.width) * this.gridWidth);
    const cellY = Math.floor((py / this.canvas.height) * this.gridHeight);
    const radius = 6;
    const forceX = Math.max(-14, Math.min(14, dx * 0.18));
    const forceY = Math.max(-14, Math.min(14, dy * 0.18));

    for (let ry = -radius; ry <= radius; ry++) {
      for (let rx = -radius; rx <= radius; rx++) {
        const gx = cellX + rx;
        const gy = cellY + ry;
        if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
          const falloff = 1 - Math.sqrt(rx * rx + ry * ry) / (radius + 1);
          if (falloff > 0) {
            const idx = gy * this.gridWidth + gx;
            this.u[idx] += forceX * falloff;
            this.v[idx] += forceY * falloff;
          }
        }
      }
    }
  }

  spawnVortex(x, y, strength = 4.5) {
    const cellX = Math.floor((x / this.canvas.width) * this.gridWidth);
    const cellY = Math.floor((y / this.canvas.height) * this.gridHeight);
    const r = 8;

    for (let ry = -r; ry <= r; ry++) {
      for (let rx = -r; rx <= r; rx++) {
        const gx = cellX + rx;
        const gy = cellY + ry;
        if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
          const d = Math.sqrt(rx * rx + ry * ry);
          if (d > 0.5 && d <= r) {
            const idx = gy * this.gridWidth + gx;
            this.u[idx] += (-ry / d) * strength * (1 - d / r);
            this.v[idx] += (rx / d) * strength * (1 - d / r);
          }
        }
      }
    }
  }

  updateGrid() {
    const decay = 0.982;
    const baseUpdraft = this.updraftSpeed;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        this.u[idx] = this.u[idx] * decay;
        this.v[idx] = (this.v[idx] * decay) + (baseUpdraft * (1 - decay));
      }
    }
  }

  sampleVelocity(px, py) {
    const gx = (px / this.canvas.width) * this.gridWidth;
    const gy = (py / this.canvas.height) * this.gridHeight;

    const x0 = Math.max(0, Math.min(this.gridWidth - 1, Math.floor(gx)));
    const y0 = Math.max(0, Math.min(this.gridHeight - 1, Math.floor(gy)));
    const x1 = Math.min(this.gridWidth - 1, x0 + 1);
    const y1 = Math.min(this.gridHeight - 1, y0 + 1);

    const fx = gx - x0;
    const fy = gy - y0;

    const idx00 = y0 * this.gridWidth + x0;
    const idx10 = y0 * this.gridWidth + x1;
    const idx01 = y1 * this.gridWidth + x0;
    const idx11 = y1 * this.gridWidth + x1;

    const vx0 = this.u[idx00] * (1 - fx) + this.u[idx10] * fx;
    const vx1 = this.u[idx01] * (1 - fx) + this.u[idx11] * fx;
    const vx = vx0 * (1 - fy) + vx1 * fy;

    const vy0 = this.v[idx00] * (1 - fx) + this.v[idx10] * fx;
    const vy1 = this.v[idx01] * (1 - fx) + this.v[idx11] * fx;
    const vy = vy0 * (1 - fy) + vy1 * fy;

    return { vx, vy };
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

    // 2. Update embers and ash
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const vel = this.sampleVelocity(p.x, p.y);

      // Natural sway and upward draft weighted by particle depth
      const sway = Math.sin(this.time * 2.2 + p.phase) * (p.type === 'ash' ? 0.85 : 0.4);
      p.vx = (p.vx * 0.86) + ((vel.vx + sway) * 0.14);
      p.vy = (p.vy * 0.90) + (vel.vy * 0.12 * p.depth);

      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      // Respawn when rising above top or drifting offscreen
      if (p.y < -30 || p.x < -30 || p.x > w + 30 || p.age > p.maxAge) {
        p.x = Math.random() * w;
        p.y = h + 15 + Math.random() * 40;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = this.updraftSpeed * (0.6 + Math.random() * 0.8) * p.depth;
        p.age = 0;
        p.maxAge = 220 + Math.random() * 260;
        p.heat = 0.45 + Math.random() * 0.55;
      }
    }

    // 3. Update sparks
    for (let j = this.sparks.length - 1; j >= 0; j--) {
      const s = this.sparks[j];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= s.decay;
      s.vy = (s.vy * s.decay) - 0.06; // Buoyant lift
      s.life++;

      if (s.life >= s.maxLife) {
        this.sparks.splice(j, 1);
      }
    }

    // 4. Update shockwaves
    for (let k = this.shockwaves.length - 1; k >= 0; k--) {
      const sw = this.shockwaves[k];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(k, 1);
      }
    }

    // 5. Update blade trails
    for (let b = this.bladeTrail.length - 1; b >= 0; b--) {
      const tr = this.bladeTrail[b];
      tr.life++;
      if (tr.life >= tr.maxLife) {
        this.bladeTrail.splice(b, 1);
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

    // 3. Render Shockwaves (Radial Acoustic Waves)
    for (let k = 0; k < this.shockwaves.length; k++) {
      const sw = this.shockwaves[k];
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = !isLight
        ? `rgba(239, 35, 60, ${sw.alpha * 0.7})`
        : `rgba(186, 24, 27, ${sw.alpha * 0.6})`;
      ctx.lineWidth = Math.max(1, 3.5 * sw.alpha);
      ctx.stroke();

      // Inner faint white shockwave core
      if (!isLight && sw.alpha > 0.4) {
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.98, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 230, 200, ${sw.alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Render Dragonslayer Blade Slash Trails
    if (this.bladeTrail.length > 2) {
      ctx.save();
      for (let b = 1; b < this.bladeTrail.length; b++) {
        const p0 = this.bladeTrail[b - 1];
        const p1 = this.bladeTrail[b];
        const trailAlpha = 1 - (p1.life / p1.maxLife);
        const strokeWidth = Math.min(6, Math.max(1.2, p1.speed * 0.22));

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineCap = 'round';

        // Outer crimson slash aura
        ctx.strokeStyle = !isLight
          ? `rgba(239, 35, 60, ${trailAlpha * 0.65})`
          : `rgba(186, 24, 27, ${trailAlpha * 0.55})`;
        ctx.lineWidth = strokeWidth * 2.2;
        ctx.stroke();

        // Inner incandescent molten core
        ctx.strokeStyle = !isLight
          ? `rgba(255, 245, 220, ${trailAlpha * 0.85})`
          : `rgba(102, 7, 8, ${trailAlpha * 0.75})`;
        ctx.lineWidth = strokeWidth * 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Render Rising Ash Flakes & Burning Embers
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

    // 6. Render High-Velocity Sparks & Shrapnel
    for (let k = 0; k < this.sparks.length; k++) {
      const s = this.sparks[k];
      const sparkAlpha = 1 - (s.life / s.maxLife);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 3.8, s.y - s.vy * 3.8);
      ctx.strokeStyle = !isLight
        ? `rgba(255, 225, 160, ${sparkAlpha * 0.92})`
        : `rgba(186, 24, 27, ${sparkAlpha * 0.88})`;
      ctx.lineWidth = s.radius;
      ctx.stroke();
    }
  }

  loop(now) {
    if (!this.running) return;
    const currentNow = (typeof now === 'number' && now > 0) ? now : ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
    const dt = Math.min((currentNow - (this.lastTime || currentNow)) / 1000, 0.033);
    this.lastTime = currentNow;
    this.time += dt > 0 ? dt : 0.016;

    this.updateGrid();
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
