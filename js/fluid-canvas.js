/**
 * BERSERK ECLIPSE ABYSS & ASH EMBERS SIMULATOR
 * Cinematic interactive canvas: Celestial Eclipse corona, rising ash flakes, and incandescent blood embers.
 * Dynamic aerodynamic turbulence, spark bursts on drag, and shockwave physics on click.
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
    this.numParticles = 550;
    this.particles = [];
    this.sparks = [];

    // Pointer state
    this.mouse = { x: -1000, y: -1000, px: -1000, py: -1000, down: false, speed: 0 };
    this.updraftSpeed = -0.85; // Natural upward buoyancy for rising embers
    this.time = 0;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

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

    this.seedParticles();
    this.resetFlow();
  }

  seedParticles() {
    this.particles = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < this.numParticles; i++) {
      const rand = Math.random();
      // Types: ember (incandescent glowing red/orange), ash (charcoal flakes), cinder (tiny floating dots)
      const type = rand > 0.45 ? 'ember' : rand > 0.18 ? 'ash' : 'cinder';
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: this.updraftSpeed * (0.6 + Math.random() * 0.9),
        radius: type === 'ember' ? 1.4 + Math.random() * 2.2 : type === 'ash' ? 2.0 + Math.random() * 2.8 : 0.8 + Math.random() * 1.0,
        age: Math.random() * 300,
        maxAge: 200 + Math.random() * 250,
        type: type,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
        heat: 0.5 + Math.random() * 0.5
      });
    }
  }

  resetFlow() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        // Thermal upward convection with gentle sinusoidal turbulence
        this.u[idx] = 0.15 * Math.sin(y * 0.2 + x * 0.1);
        this.v[idx] = this.updraftSpeed * (0.8 + 0.3 * Math.cos(x * 0.15));
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

      // Fast cursor motion strikes sparks like Dragonslayer clashing with steel
      if (dist > 12 && Math.random() > 0.35) {
        this.emitSparks(mx, my, dx * 0.25, dy * 0.25, Math.min(5, Math.floor(dist * 0.12)));
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
      this.spawnVortex(this.mouse.x, this.mouse.y, 5.0);
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
      this.spawnVortex(this.mouse.x, this.mouse.y, 4.0);
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
      this.injectForce(mx, my, dx, dy);
      this.mouse.x = mx;
      this.mouse.y = my;
      if (Math.hypot(dx, dy) > 10 && Math.random() > 0.4) {
        this.emitSparks(mx, my, dx * 0.2, dy * 0.2, 4);
      }
    }
  }

  onTouchEnd() {
    this.mouse.down = false;
    this.mouse.x = -1000;
    this.mouse.y = -1000;
  }

  emitSparks(x, y, baseVx = 0, baseVy = 0, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      this.sparks.push({
        x: x,
        y: y,
        vx: baseVx + Math.cos(angle) * speed,
        vy: baseVy + Math.sin(angle) * speed,
        radius: 1.0 + Math.random() * 1.8,
        life: 0,
        maxLife: 30 + Math.random() * 35,
        decay: 0.94 + Math.random() * 0.04
      });
    }
  }

  injectForce(px, py, dx, dy) {
    const cellX = Math.floor((px / this.canvas.width) * this.gridWidth);
    const cellY = Math.floor((py / this.canvas.height) * this.gridHeight);
    const radius = 5;
    const forceX = Math.max(-12, Math.min(12, dx * 0.16));
    const forceY = Math.max(-12, Math.min(12, dy * 0.16));

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

  spawnVortex(x, y, strength = 4.0) {
    const cellX = Math.floor((x / this.canvas.width) * this.gridWidth);
    const cellY = Math.floor((y / this.canvas.height) * this.gridHeight);
    const r = 7;

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

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const vel = this.sampleVelocity(p.x, p.y);

      // Natural sway and upward draft
      const sway = Math.sin(this.time * 2 + p.phase) * (p.type === 'ash' ? 0.75 : 0.35);
      p.vx = (p.vx * 0.85) + ((vel.vx + sway) * 0.15);
      p.vy = (p.vy * 0.90) + (vel.vy * 0.12);

      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      // Respawn when rising above top or drifting offscreen
      if (p.y < -30 || p.x < -30 || p.x > w + 30 || p.age > p.maxAge) {
        p.x = Math.random() * w;
        p.y = h + 15 + Math.random() * 40;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = this.updraftSpeed * (0.6 + Math.random() * 0.8);
        p.age = 0;
        p.maxAge = 220 + Math.random() * 260;
        p.heat = 0.4 + Math.random() * 0.6;
      }
    }

    // Update explosive / cursor sparks
    for (let j = this.sparks.length - 1; j >= 0; j--) {
      const s = this.sparks[j];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= s.decay;
      s.vy = (s.vy * s.decay) - 0.05; // Light buoyant lift
      s.life++;

      if (s.life >= s.maxLife) {
        this.sparks.splice(j, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isLight = document.documentElement.dataset.theme === 'light';

    // Cinematic trailing wipe for deep motion persistence
    ctx.fillStyle = isLight ? 'rgba(246, 245, 239, 0.28)' : 'rgba(6, 6, 9, 0.26)';
    ctx.fillRect(0, 0, w, h);

    // 1. Atmospheric Celestial Eclipse Halo
    const eclipseCenterX = w * 0.5;
    const eclipseCenterY = Math.min(h * 0.38, 380);
    const eclipseRadius = Math.min(w * 0.24, 240);
    const pulse = 0.95 + 0.05 * Math.sin(this.time * 1.5);

    if (!isLight) {
      const corona = ctx.createRadialGradient(
        eclipseCenterX, eclipseCenterY, eclipseRadius * 0.8,
        eclipseCenterX, eclipseCenterY, eclipseRadius * 2.8 * pulse
      );
      corona.addColorStop(0, 'rgba(239, 35, 60, 0.16)');
      corona.addColorStop(0.35, 'rgba(186, 24, 27, 0.08)');
      corona.addColorStop(0.75, 'rgba(102, 7, 8, 0.03)');
      corona.addColorStop(1, 'rgba(6, 6, 9, 0)');

      ctx.save();
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius * 2.8 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Deep dark solar core
      const core = ctx.createRadialGradient(
        eclipseCenterX, eclipseCenterY, 0,
        eclipseCenterX, eclipseCenterY, eclipseRadius * 0.95
      );
      core.addColorStop(0, 'rgba(4, 4, 6, 0.95)');
      core.addColorStop(0.85, 'rgba(7, 7, 11, 0.90)');
      core.addColorStop(1, 'rgba(239, 35, 60, 0.15)');

      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Light Mode: Textured Calligraphic Sun Ring
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 24, 27, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(eclipseCenterX, eclipseCenterY, eclipseRadius * 1.4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render Rising Ash Flakes & Burning Embers
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const lifeRatio = p.age / p.maxAge;
      // Parabolic alpha curve: fades in, glows bright in middle, fades out at top
      const alpha = Math.min(1, Math.sin(lifeRatio * Math.PI));

      if (p.type === 'ember') {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
        if (!isLight) {
          glow.addColorStop(0, `rgba(255, 245, 230, ${alpha * 0.95})`);
          glow.addColorStop(0.35, `rgba(255, 87, 34, ${alpha * 0.85})`);
          glow.addColorStop(0.7, `rgba(239, 35, 60, ${alpha * 0.45})`);
          glow.addColorStop(1, 'rgba(141, 8, 1, 0)');
        } else {
          glow.addColorStop(0, `rgba(186, 24, 27, ${alpha * 0.85})`);
          glow.addColorStop(0.5, `rgba(164, 22, 26, ${alpha * 0.55})`);
          glow.addColorStop(1, 'rgba(102, 7, 8, 0)');
        }

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Incandescent core
        ctx.fillStyle = !isLight ? `rgba(255, 255, 255, ${alpha * 0.9})` : `rgba(102, 7, 8, ${alpha * 0.9})`;
        ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);

      } else if (p.type === 'ash') {
        // Fluttering dark charcoal flake
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase + this.time);
        ctx.fillStyle = !isLight
          ? `rgba(75, 75, 85, ${alpha * 0.45})`
          : `rgba(25, 25, 30, ${alpha * 0.40})`;
        ctx.fillRect(-p.radius, -p.radius * 0.6, p.radius * 2, p.radius * 1.2);
        ctx.restore();

      } else {
        // Cinder point
        ctx.fillStyle = !isLight
          ? `rgba(239, 35, 60, ${alpha * 0.55})`
          : `rgba(186, 24, 27, ${alpha * 0.45})`;
        ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
      }
    }

    // 3. Render Sparks (Explosions and High-Speed Cursor Flings)
    for (let k = 0; k < this.sparks.length; k++) {
      const s = this.sparks[k];
      const sparkAlpha = 1 - (s.life / s.maxLife);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 3.5, s.y - s.vy * 3.5);
      ctx.strokeStyle = !isLight
        ? `rgba(255, 220, 150, ${sparkAlpha * 0.9})`
        : `rgba(186, 24, 27, ${sparkAlpha * 0.85})`;
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
  }
}
