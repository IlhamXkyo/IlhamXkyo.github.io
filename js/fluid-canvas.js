/**
 * BERSERK ECLIPSE ABYSS & DRAGON BLADE CANVAS SIMULATOR
 * Cinematic interactive canvas: Solar Eclipse corona, solar flares, rising ash flakes, and incandescent blood embers.
 * Interactive Dragonslayer blade slash trails, radial acoustic shockwaves on click, and layered parallax depth.
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

    // Dynamic ember and ash particles
    this.numParticles = 520;
    this.particles = [];
    this.sparks = [];
    this.shockwaves = [];
    this.bladeTrail = [];

    // Abyssal deep smoke nebula nodes for atmospheric depth
    this.smokeNodes = [];
    this.numSmokeNodes = 10;

    // Pointer state
    this.mouse = { x: -1000, y: -1000, px: -1000, py: -1000, down: false, speed: 0 };
    this.updraftSpeed = -0.92; // Natural upward thermal buoyancy
    this.time = 0;
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
        maxLife: 22
      });

      // Fast cursor motion strikes sparks like Dragonslayer clashing with steel
      if (dist > 10 && Math.random() > 0.3) {
        this.emitSparks(mx, my, dx * 0.28, dy * 0.28, Math.min(6, Math.floor(dist * 0.15)));
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
      this.emitSparks(this.mouse.x, this.mouse.y, 0, 0, 36);
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
      this.emitSparks(this.mouse.x, this.mouse.y, 0, 0, 26);
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
      if (dist > 8 && Math.random() > 0.35) {
        this.emitSparks(mx, my, dx * 0.22, dy * 0.22, 5);
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

  updateParticles() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.time += 0.016;

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

    // 2. Atmospheric Celestial Eclipse with Twisting Solar Flares
    const eclipseCenterX = w * 0.5;
    const eclipseCenterY = Math.min(h * 0.38, 380 * (this.dpr || 1)) - scrollParallax;
    const eclipseRadius = Math.min(w * 0.24, 230 * (this.dpr || 1));
    const pulse = 0.95 + 0.05 * Math.sin(this.time * 1.6);

    if (!isLight) {
      ctx.save();

      // Outer Corona with Procedural Solar Flares
      const corona = ctx.createRadialGradient(
        eclipseCenterX, eclipseCenterY, eclipseRadius * 0.85,
        eclipseCenterX, eclipseCenterY, eclipseRadius * 3.0 * pulse
      );
      corona.addColorStop(0, 'rgba(239, 35, 60, 0.20)');
      corona.addColorStop(0.3, 'rgba(186, 24, 27, 0.10)');
      corona.addColorStop(0.65, 'rgba(102, 7, 8, 0.04)');
      corona.addColorStop(1, 'rgba(6, 6, 9, 0)');

      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius * 3.0 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Solar flare rays (16 procedural radial coronal tendrils)
      const numRays = 16;
      ctx.strokeStyle = 'rgba(239, 35, 60, 0.06)';
      ctx.lineWidth = 2.5;
      for (let r = 0; r < numRays; r++) {
        const baseAngle = (r / numRays) * Math.PI * 2 + this.time * 0.06;
        const wave = Math.sin(baseAngle * 3 + this.time * 2.0);
        const rayLen = eclipseRadius * (1.1 + 0.55 * Math.abs(wave));
        const rx = eclipseCenterX + Math.cos(baseAngle) * rayLen;
        const ry = eclipseCenterY + Math.sin(baseAngle) * rayLen;

        ctx.beginPath();
        ctx.moveTo(
          eclipseCenterX + Math.cos(baseAngle) * (eclipseRadius * 0.9),
          eclipseCenterY + Math.sin(baseAngle) * (eclipseRadius * 0.9)
        );
        ctx.lineTo(rx, ry);
        ctx.stroke();
      }

      // Deep dark solar core with crimson rim bleed
      const core = ctx.createRadialGradient(
        eclipseCenterX, eclipseCenterY, 0,
        eclipseCenterX, eclipseCenterY, eclipseRadius
      );
      core.addColorStop(0, 'rgba(4, 4, 6, 0.98)');
      core.addColorStop(0.88, 'rgba(7, 7, 12, 0.92)');
      core.addColorStop(1, 'rgba(239, 35, 60, 0.24)');

      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Thin razor perimeter ring of white-hot eclipse fire
      ctx.strokeStyle = 'rgba(255, 120, 90, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius * 1.01, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } else {
      // Light Mode: Textured Calligraphic Sun Ring
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 24, 27, 0.12)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius * 1.35 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

  loop() {
    if (!this.running) return;
    this.updateGrid();
    this.updateParticles();
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
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
