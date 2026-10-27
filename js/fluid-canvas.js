/**
 * BERSERK ABYSS & HYPER-REALISTIC DEMONIC GAZE CANVAS SIMULATOR
 * Cinematic interactive canvas featuring the iconic glowing golden Berserk eyes reconstructed from hero-profile.gif.
 * Masterpiece-grade biological rendering:
 * 1. 3D spherical eyeball depth with blood-shadowed sclera and delicate ciliary micro-capillaries.
 * 2. Multi-layered golden demonic iris with dark limbal ring, 48 fibrous radial trabeculae, internal caustics, and contraction furrows.
 * 3. Responsive breathing slit pupil with dynamic dilation and sphincter rim.
 * 4. Multi-specular corneal highlights with wet tear meniscus gleam along the lower waterline.
 * 5. Sculpted anime Berserk eyelids with tapered winged lashes, orbital fold, and lacrimal caruncle.
 * 6. Rising Berserker miasma tendrils drifting from the outer canthus into the abyss.
 * 7. Reactive proximity eye closure (corneal defense reflex: eyes close shut when cursor approaches).
 * 8. Full fluid force interaction with ascending crimson embers and charcoal ash flakes.
 * High-performance 60fps canvas engine with dual-theme rendering. Zero AI slop.
 */

export class FluidSimulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;
    this.running = false;

    // Simulation grid dimensions for interactive fluid velocity field
    this.gridWidth = 80;
    this.gridHeight = 45;
    this.numCells = this.gridWidth * this.gridHeight;

    // Vector velocity fields (u = horizontal velocity, v = vertical updraft velocity)
    this.u = new Float32Array(this.numCells);
    this.v = new Float32Array(this.numCells);

    // Dynamic ember and ash particles (the interactive background particles)
    this.numParticles = 520;
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

    // Independent eyelid open states for bilateral proximity defense reflex
    this.eyelidLeft = 1.0;
    this.eyelidRight = 1.0;
    this.baseEyelidOpen = 1.0;

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
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('mousedown', this.onMouseDown, { passive: true });
    window.addEventListener('mouseup', this.onMouseUp, { passive: true });
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

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.dpr || 1);
    const my = (e.clientY - rect.top) * (this.dpr || 1);

    if (this.mouse.x > -500) {
      const dx = mx - this.mouse.x;
      const dy = my - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.mouse.speed = dist;

      // Transfer interactive motion momentum directly into background fluid particles
      this.injectForce(mx, my, dx, dy);
    }

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
      const mx = (touch.clientX - rect.left) * (this.dpr || 1);
      const my = (touch.clientY - rect.top) * (this.dpr || 1);
      const dx = mx - this.mouse.x;
      const dy = my - this.mouse.y;

      this.injectForce(mx, my, dx, dy);
      this.mouse.x = mx;
      this.mouse.y = my;
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
    const eyeDistance = 226 * (scale / dpr) * dpr;
    const maxGazeRadius = 24 * (scale / dpr) * dpr;

    const leftX = eyeCenterX - eyeDistance * 0.5;
    const rightX = eyeCenterX + eyeDistance * 0.5;

    // 1. Gaze orientation vector towards cursor with micro-saccades
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

    // 2. Periodic natural blink timer
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

    // 3. Dynamic eyelid opening baseline (open wider when looking up, narrow when looking down)
    let openTarget = 1.0;
    if (this.gaze.currentY < 0) {
      openTarget += Math.min(0.22, Math.abs(this.gaze.currentY / (maxGazeRadius || 1)) * 0.22);
    } else {
      openTarget -= Math.min(0.35, (this.gaze.currentY / (maxGazeRadius || 1)) * 0.35);
    }

    if (this.mouse.down) {
      openTarget *= 0.65; // Focus squint on click
    }

    this.baseEyelidOpen += (openTarget - this.baseEyelidOpen) * 0.14;

    // 4. Proximity Defense Reflex: Eyes close shut when cursor approaches the eye
    let targetProximityLeft = 1.0;
    let targetProximityRight = 1.0;

    const closeDist = 75 * scale;  // Inside this radius: eye closes shut (0.0)
    const startDist = 240 * scale; // Distance where defensive squint starts

    if (this.mouse.x > -500 && this.mouse.y > -500) {
      const distL = Math.hypot(this.mouse.x - leftX, this.mouse.y - eyeCenterY);
      const distR = Math.hypot(this.mouse.x - rightX, this.mouse.y - eyeCenterY);

      const calcProximityFactor = (dist) => {
        if (dist <= closeDist) return 0.0;
        if (dist >= startDist) return 1.0;
        const t = (dist - closeDist) / (startDist - closeDist);
        return t * t * (3 - 2 * t); // Smoothstep curve
      };

      const proxL = calcProximityFactor(distL);
      const proxR = calcProximityFactor(distR);

      // Sympathetic blinking: direct eye shuts completely, partner eye squints defensively
      targetProximityLeft = proxL * Math.min(1.0, 0.35 + 0.65 * proxR);
      targetProximityRight = proxR * Math.min(1.0, 0.35 + 0.65 * proxL);
    }

    // Snappy eyelid closure on proximity (0.22 ease) and smooth recovery
    const blinkMultiplier = this.isBlinking ? (1 - Math.sin(this.blinkProgress * Math.PI)) : 1.0;
    const finalTargetLeft = Math.max(0.0, targetProximityLeft * this.baseEyelidOpen * blinkMultiplier);
    const finalTargetRight = Math.max(0.0, targetProximityRight * this.baseEyelidOpen * blinkMultiplier);

    this.eyelidLeft += (finalTargetLeft - this.eyelidLeft) * 0.22;
    this.eyelidRight += (finalTargetRight - this.eyelidRight) * 0.22;
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

    // 2. Update embers and ash with fluid velocity influence from cursor
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const vel = this.sampleVelocity(p.x, p.y);

      // Natural sway and upward draft weighted by particle depth and fluid motion
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
  }

  drawBerserkEyes(ctx, w, h, isLight, scrollParallax) {
    const dpr = this.dpr || 1;
    const scale = Math.min(Math.max(Math.min(w / 760, h / 520) * dpr, 0.55 * dpr), 1.35 * dpr);
    const eyeCenterX = w * 0.5;
    const eyeCenterY = Math.min(h * 0.38, 360 * dpr) - scrollParallax;
    const eyeDistance = 226 * (scale / dpr) * dpr;

    const leftX = eyeCenterX - eyeDistance * 0.5;
    const rightX = eyeCenterX + eyeDistance * 0.5;

    // 1. Outer Crimson Aura: Multi-stage deep breathing halo surrounding both eye sockets
    const auraPulse = 0.94 + 0.06 * Math.sin(this.time * 2.0);
    const auraRadiusX = 155 * scale;
    const auraRadiusY = 100 * scale;

    if (!isLight) {
      [leftX, rightX].forEach((ex) => {
        ctx.save();
        ctx.translate(ex, eyeCenterY);
        ctx.scale(1, auraRadiusY / auraRadiusX);
        const auraGrad = ctx.createRadialGradient(0, 0, 15 * scale, 0, 0, auraRadiusX * auraPulse);
        auraGrad.addColorStop(0, 'rgba(220, 20, 30, 0.42)');
        auraGrad.addColorStop(0.35, 'rgba(160, 10, 15, 0.22)');
        auraGrad.addColorStop(0.68, 'rgba(65, 6, 9, 0.07)');
        auraGrad.addColorStop(1, 'rgba(6, 6, 9, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadiusX * auraPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 2. Render Left Eye (Natural, using eyelidLeft)
    this.renderSingleEye(ctx, leftX, eyeCenterY, scale, true, this.gaze.currentX, this.gaze.currentY, this.eyelidLeft, isLight);

    // 3. Render Right Eye (Mirrored horizontally, using eyelidRight)
    this.renderSingleEye(ctx, rightX, eyeCenterY, scale, false, this.gaze.currentX, this.gaze.currentY, this.eyelidRight, isLight);
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

    // Clamped effective eyelid opening
    const effOpen = Math.max(0.0, eyelidOpen);
    const isClosed = effOpen < 0.05;

    // Sculpted anatomical eyelid curves
    // Peak of upper eyelid arched dynamically based on gaze and closure
    const upperY1 = -40 * s * effOpen;
    const upperY2 = -38 * s * effOpen;
    const lowerY1 = 26 * s * Math.max(0.08, effOpen);
    const lowerY2 = 28 * s * Math.max(0.08, effOpen);

    const buildEyePath = () => {
      ctx.beginPath();
      ctx.moveTo(-58 * s, -4 * s);
      ctx.bezierCurveTo(-40 * s, upperY1, 14 * s, upperY2, 54 * s, 14 * s);
      ctx.bezierCurveTo(24 * s, lowerY1, -32 * s, lowerY2, -58 * s, -4 * s);
      ctx.closePath();
    };

    // Berserker Miasma: Subtle dark smoke tendrils drifting from the outer canthus
    if (!isLight && !isClosed) {
      for (let m = 0; m < 3; m++) {
        const mPhase = this.time * 1.8 + m * 2.1;
        const mLen = (26 + m * 14) * s;
        const mX = -58 * s - Math.sin(mPhase) * (8 * s) - m * 6 * s;
        const mY = -4 * s - mLen;
        ctx.beginPath();
        ctx.moveTo(-58 * s, -4 * s);
        ctx.quadraticCurveTo(-65 * s - Math.cos(mPhase) * 10 * s, -12 * s - mLen * 0.5, mX, mY);
        ctx.strokeStyle = `rgba(186, 24, 27, ${0.18 - m * 0.04})`;
        ctx.lineWidth = (3.5 - m * 0.8) * s;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // If eye is open, render eyeball contents inside clipped socket
    if (!isClosed) {
      ctx.save();
      buildEyePath();
      ctx.clip();

      // 1. 3D Spherical Eyeball Shading (Blood-stained abyssal sclera)
      // The eye is a 3D sphere: center slightly raised, perimeter curving into deep shadow
      const scleraGrad = ctx.createRadialGradient(0, -6 * s, 12 * s, 0, 0, 70 * s);
      if (!isLight) {
        scleraGrad.addColorStop(0.0, '#42060a');  // Incandescent crimson blood core
        scleraGrad.addColorStop(0.48, '#260306'); // Deep dark blood-red mid-tone
        scleraGrad.addColorStop(0.82, '#120103'); // Curving socket shadow
        scleraGrad.addColorStop(1.0, '#050001');  // Pitch black perimeter
      } else {
        scleraGrad.addColorStop(0.0, '#f5e4e2');
        scleraGrad.addColorStop(0.55, '#dfb5b2');
        scleraGrad.addColorStop(0.85, '#b94042');
        scleraGrad.addColorStop(1.0, '#661114');
      }
      ctx.fillStyle = scleraGrad;
      ctx.fill();

      // 2. Delicate Ciliary Micro-Capillaries (Subtle hair-thin blood vessels in sclera)
      if (!isLight) {
        ctx.lineWidth = 0.7 * s;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.28)';

        // Inner canthus vessel branches
        ctx.beginPath();
        ctx.moveTo(52 * s, 13 * s);
        ctx.quadraticCurveTo(36 * s, 18 * s, 26 * s, 10 * s);
        ctx.moveTo(48 * s, 11 * s);
        ctx.quadraticCurveTo(38 * s, 2 * s, 28 * s, 4 * s);
        ctx.stroke();

        // Outer canthus vessel branches
        ctx.beginPath();
        ctx.moveTo(-56 * s, -3 * s);
        ctx.quadraticCurveTo(-42 * s, -8 * s, -30 * s, -4 * s);
        ctx.moveTo(-54 * s, -2 * s);
        ctx.quadraticCurveTo(-40 * s, 8 * s, -28 * s, 6 * s);
        ctx.stroke();
      }

      // 3. Lacrimal Caruncle (Anatomical pinkish-crimson tear gland at inner corner)
      ctx.beginPath();
      ctx.ellipse(51 * s, 13 * s, 4.5 * s, 3.2 * s, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = !isLight ? 'rgba(168, 38, 48, 0.72)' : 'rgba(219, 90, 100, 0.85)';
      ctx.fill();

      // 4. Multi-Layered Golden Demonic Iris
      const ir = 39 * s;
      const ix = lx;
      const iy = ly;

      // Ocular Bloom: Radiant golden light scattering onto surrounding sclera
      const irisBloom = ctx.createRadialGradient(ix, iy, ir * 0.35, ix, iy, ir * 2.1);
      if (!isLight) {
        irisBloom.addColorStop(0.0, 'rgba(255, 235, 60, 0.52)');
        irisBloom.addColorStop(0.42, 'rgba(245, 158, 11, 0.32)');
        irisBloom.addColorStop(0.75, 'rgba(225, 29, 72, 0.15)');
        irisBloom.addColorStop(1.0, 'rgba(186, 24, 27, 0)');
      } else {
        irisBloom.addColorStop(0.0, 'rgba(234, 179, 8, 0.38)');
        irisBloom.addColorStop(0.7, 'rgba(220, 38, 38, 0.18)');
        irisBloom.addColorStop(1.0, 'rgba(220, 38, 38, 0)');
      }
      ctx.fillStyle = irisBloom;
      ctx.beginPath();
      ctx.arc(ix, iy, ir * 2.1, 0, Math.PI * 2);
      ctx.fill();

      // Dark Limbal Ring (Thick sharp perimeter framing the golden iris)
      ctx.beginPath();
      ctx.arc(ix, iy, ir * 1.02, 0, Math.PI * 2);
      ctx.fillStyle = !isLight ? '#120002' : '#3d0508';
      ctx.fill();

      // Iris Stroma Body: Luminous multi-tone golden gradations
      const irisGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, ir * 0.98);
      if (!isLight) {
        irisGrad.addColorStop(0.00, '#ffffff'); // Blinding incandescent white pupil edge
        irisGrad.addColorStop(0.12, '#ffff70'); // Pure electric yellow
        irisGrad.addColorStop(0.32, '#fff01f'); // Intense golden fire
        irisGrad.addColorStop(0.55, '#f59e0b'); // Warm amber stroma
        irisGrad.addColorStop(0.76, '#d97706'); // Deep golden-orange collarette
        irisGrad.addColorStop(0.90, '#991b1b'); // Blood-crimson limbal border
        irisGrad.addColorStop(1.00, '#2b0206'); // Dark rim boundary
      } else {
        irisGrad.addColorStop(0.00, '#fffbeb');
        irisGrad.addColorStop(0.20, '#fde047');
        irisGrad.addColorStop(0.60, '#d97706');
        irisGrad.addColorStop(0.90, '#991b1b');
        irisGrad.addColorStop(1.00, '#380407');
      }
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(ix, iy, ir * 0.98, 0, Math.PI * 2);
      ctx.fill();

      // Internal Caustics (Subsurface scattering: light refracts warmly to lower-right iris)
      const causticGlow = ctx.createRadialGradient(ix + 9 * s, iy + 10 * s, 2 * s, ix + 9 * s, iy + 10 * s, ir * 0.72);
      causticGlow.addColorStop(0.0, 'rgba(255, 245, 140, 0.55)');
      causticGlow.addColorStop(0.6, 'rgba(251, 191, 36, 0.28)');
      causticGlow.addColorStop(1.0, 'rgba(217, 119, 6, 0)');
      ctx.fillStyle = causticGlow;
      ctx.beginPath();
      ctx.arc(ix + 9 * s, iy + 10 * s, ir * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // 48 High-Detail Fibrous Iris Trabeculae (Branched biological radial fibers)
      const numStriations = 48;
      for (let st = 0; st < numStriations; st++) {
        const stAngle = (st / numStriations) * Math.PI * 2;
        const breath = Math.sin(st * 4.6 + this.time * 2.2);
        const rInner = ir * (0.34 + 0.04 * breath);
        const rOuter = ir * (0.84 + 0.10 * Math.cos(st * 3.2 + this.time));

        ctx.strokeStyle = (st % 2 === 0)
          ? (!isLight ? 'rgba(255, 245, 120, 0.45)' : 'rgba(180, 83, 9, 0.38)')
          : (!isLight ? 'rgba(245, 158, 11, 0.30)' : 'rgba(220, 38, 38, 0.25)');
        ctx.lineWidth = ((st % 3 === 0) ? 1.4 : 0.75) * s;

        ctx.beginPath();
        ctx.moveTo(ix + Math.cos(stAngle) * rInner, iy + Math.sin(stAngle) * rInner);
        // Subtle micro-curve in the radial fibers
        const midAngle = stAngle + 0.05 * Math.sin(st);
        const rMid = (rInner + rOuter) * 0.5;
        ctx.quadraticCurveTo(
          ix + Math.cos(midAngle) * rMid,
          iy + Math.sin(midAngle) * rMid,
          ix + Math.cos(stAngle) * rOuter,
          iy + Math.sin(stAngle) * rOuter
        );
        ctx.stroke();
      }

      // Concentric Contraction Furrows (Two delicate rings of pupil expansion)
      ctx.strokeStyle = !isLight ? 'rgba(217, 119, 6, 0.28)' : 'rgba(180, 83, 9, 0.22)';
      ctx.lineWidth = 0.9 * s;
      ctx.beginPath();
      ctx.arc(ix, iy, ir * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ix, iy, ir * 0.74, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Breathing Demonic Slit Pupil with Sphincter Rim
      // Slit pupil constricts during focused gaze and dilates subtly in darkness
      const pupilBreath = 0.92 + 0.08 * Math.sin(this.time * 1.6);
      const pw = 5.4 * s * pupilBreath;
      const ph = 39 * s * Math.max(0.42, effOpen);

      // Dark red pupil sphincter margin
      ctx.beginPath();
      ctx.moveTo(ix, iy - (ph + 3 * s) * 0.5);
      ctx.bezierCurveTo(ix + pw + 2.5 * s, iy - ph * 0.22, ix + pw + 2.5 * s, iy + ph * 0.22, ix, iy + (ph + 3 * s) * 0.5);
      ctx.bezierCurveTo(ix - pw - 2.5 * s, iy + ph * 0.22, ix - pw - 2.5 * s, iy - ph * 0.22, ix, iy - (ph + 3 * s) * 0.5);
      ctx.closePath();
      ctx.fillStyle = !isLight ? 'rgba(40, 2, 6, 0.85)' : 'rgba(70, 4, 10, 0.85)';
      ctx.fill();

      // Abyssal Pitch-Black Slit Core
      ctx.beginPath();
      ctx.moveTo(ix, iy - ph * 0.5);
      ctx.bezierCurveTo(ix + pw, iy - ph * 0.22, ix + pw, iy + ph * 0.22, ix, iy + ph * 0.5);
      ctx.bezierCurveTo(ix - pw, iy + ph * 0.22, ix - pw, iy - ph * 0.22, ix, iy - ph * 0.5);
      ctx.closePath();
      ctx.fillStyle = !isLight ? '#020001' : '#140002';
      ctx.fill();

      // 6. Multi-Specular Corneal Highlights (Liquid Wet Eyeball Reflections)
      // Primary Corneal Specular Arc (Crescent sheen in upper-left quadrant)
      const gx = ix - 10 * s;
      const gy = iy - 12 * s;

      // Soft corneal glow halo
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(-0.38);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5 * s, 4.5 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 240, 220, 0.35)';
      ctx.fill();

      // Bright razor-sharp reflection core
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.2 * s, 2.8 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.fill();
      ctx.restore();

      // Secondary Environment Glint (Lower right subtle reflection)
      ctx.beginPath();
      ctx.arc(ix + 11 * s, iy + 9 * s, 2.2 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      // Micro Crystal Sparkle (Upper iris glint)
      ctx.beginPath();
      ctx.arc(ix - 3 * s, iy - 17 * s, 1.4 * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();

      // Wet Tear Meniscus Gleam (Lower waterline moisture reflection)
      ctx.beginPath();
      ctx.moveTo(42 * s, 11 * s);
      ctx.bezierCurveTo(18 * s, lowerY1 - 2.0 * s, -28 * s, lowerY2 - 2.0 * s, -50 * s, -3 * s);
      ctx.strokeStyle = !isLight ? 'rgba(255, 230, 240, 0.42)' : 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.2 * s;
      ctx.stroke();

      // 7. Upper Eyelid 3D Drop Shadow (Curved ambient occlusion cast over eyeball)
      const shadowGrad = ctx.createLinearGradient(0, upperY1, 0, upperY1 + 24 * s);
      shadowGrad.addColorStop(0.0, 'rgba(2, 0, 1, 0.94)');
      shadowGrad.addColorStop(0.6, 'rgba(2, 0, 1, 0.42)');
      shadowGrad.addColorStop(1.0, 'rgba(2, 0, 1, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(-65 * s, upperY1 - 5 * s, 130 * s, 32 * s);

      ctx.restore(); // Exit socket clip
    }

    // 8. Sculpted Upper Eyelid & Winged Berserk Lashes
    // Waterline skin depth
    ctx.beginPath();
    ctx.moveTo(-58 * s, -4 * s);
    ctx.bezierCurveTo(-40 * s, upperY1, 14 * s, upperY2, 54 * s, 14 * s);
    ctx.lineWidth = 2.0 * s;
    ctx.strokeStyle = !isLight ? 'rgba(80, 8, 12, 0.6)' : 'rgba(180, 50, 60, 0.45)';
    ctx.stroke();

    // Bold Upper Eyelash Rim & Winged Spike
    ctx.beginPath();
    ctx.moveTo(-78 * s, -16 * s); // Extended winged cat-eye spike
    ctx.quadraticCurveTo(-62 * s, -5 * s, -58 * s, -4 * s);
    ctx.bezierCurveTo(-40 * s, upperY1, 14 * s, upperY2, 54 * s, 14 * s);
    ctx.lineWidth = 5.2 * s;
    ctx.lineCap = 'round';
    ctx.strokeStyle = !isLight ? '#010001' : '#1a0408';
    ctx.stroke();

    // 6 Sculpted Tapered Individual Lash Spikes along the upper rim
    if (!isClosed) {
      const lashOffsets = [-36, -24, -12, 2, 16, 30];
      for (let l = 0; l < lashOffsets.length; l++) {
        const lx0 = lashOffsets[l] * s;
        const ly0 = upperY1 + Math.sin((l / lashOffsets.length) * Math.PI) * (4 * s);
        const lAngle = -0.5 - (l / lashOffsets.length) * 0.45;
        const lLen = (6 + (5 - l) * 1.5) * s;

        ctx.beginPath();
        ctx.moveTo(lx0, ly0);
        ctx.lineTo(lx0 + Math.cos(lAngle) * lLen, ly0 + Math.sin(lAngle) * lLen);
        ctx.strokeStyle = !isLight ? '#010001' : '#1a0408';
        ctx.lineWidth = (2.2 - l * 0.2) * s;
        ctx.stroke();
      }
    }

    // Lower subtle eyelid rim with outer angle definition
    if (!isClosed) {
      ctx.beginPath();
      ctx.moveTo(54 * s, 14 * s);
      ctx.bezierCurveTo(24 * s, lowerY1, -32 * s, lowerY2, -58 * s, -4 * s);
      ctx.lineWidth = 1.8 * s;
      ctx.strokeStyle = !isLight ? 'rgba(186, 24, 27, 0.70)' : 'rgba(186, 24, 27, 0.45)';
      ctx.stroke();

      // Crease above upper eyelid (Anime double-fold sulcus)
      ctx.beginPath();
      ctx.moveTo(-50 * s, -26 * s * effOpen);
      ctx.bezierCurveTo(-30 * s, -48 * s * effOpen, 8 * s, -46 * s * effOpen, 44 * s, -2 * s);
      ctx.lineWidth = 1.8 * s;
      ctx.strokeStyle = !isLight ? 'rgba(186, 24, 27, 0.48)' : 'rgba(186, 24, 27, 0.28)';
      ctx.stroke();
    } else {
      // Gentle shadow seam line along closed eyelid fold
      ctx.beginPath();
      ctx.moveTo(-56 * s, -3 * s);
      ctx.bezierCurveTo(-34 * s, 4 * s, 18 * s, 8 * s, 50 * s, 12 * s);
      ctx.lineWidth = 2.4 * s;
      ctx.strokeStyle = !isLight ? 'rgba(186, 24, 27, 0.65)' : 'rgba(186, 24, 27, 0.42)';
      ctx.stroke();
    }

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

    // 2. Render Hyper-Realistic Demonic Berserk Eyes
    this.drawBerserkEyes(ctx, w, h, isLight, scrollParallax);

    // 3. Render Rising Ash Flakes & Burning Embers (Interactive background particles reacting to cursor)
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
