/**
 * Generative Vector Flow & Particle Graphic Canvas
 * Fluid streamlines with DKV architectural color grading.
 * Matte carbon background, warm paper white, terracotta accents, and slate ink.
 */

export class FluidSimulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;
    this.running = false;

    // Simulation grid dimensions
    this.gridWidth = 80;
    this.gridHeight = 45;
    this.numCells = this.gridWidth * this.gridHeight;

    // Vector velocity fields (u = x-velocity, v = y-velocity)
    this.u = new Float32Array(this.numCells);
    this.v = new Float32Array(this.numCells);
    this.uPrev = new Float32Array(this.numCells);
    this.vPrev = new Float32Array(this.numCells);

    // Particle tracer streaklines
    this.numParticles = 750;
    this.particles = [];

    // Pointer state
    this.mouse = { x: -1000, y: -1000, px: -1000, py: -1000, down: false };
    this.inflowSpeed = 1.4;

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

    // Seed initial particle field with DKV architectural palette
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      const rand = Math.random();
      const style = rand > 0.75 ? 'terracotta' : rand > 0.45 ? 'slate' : 'paper';
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: 0,
        vy: 0,
        age: Math.random() * 200,
        maxAge: 150 + Math.random() * 150,
        speed: 0.8 + Math.random() * 0.6,
        style: style
      });
    }

    // Initialize baseline laminar flow from left to right
    this.resetFlow();
  }

  resetFlow() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        this.u[idx] = this.inflowSpeed * (0.9 + 0.2 * Math.sin(y * 0.15));
        this.v[idx] = 0.05 * Math.sin(x * 0.1);
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
      this.injectForce(mx, my, dx, dy);
    }

    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
  }

  onMouseDown() {
    this.mouse.down = true;
    if (this.mouse.x > 0) {
      this.spawnVortex(this.mouse.x, this.mouse.y, 4.5);
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
      this.spawnVortex(this.mouse.x, this.mouse.y, 3.5);
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

  injectForce(px, py, dx, dy) {
    const cellX = Math.floor((px / this.canvas.width) * this.gridWidth);
    const cellY = Math.floor((py / this.canvas.height) * this.gridHeight);
    const radius = 4;
    const forceX = Math.max(-10, Math.min(10, dx * 0.12));
    const forceY = Math.max(-10, Math.min(10, dy * 0.12));

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

  spawnVortex(x, y, strength = 3.0) {
    const cellX = Math.floor((x / this.canvas.width) * this.gridWidth);
    const cellY = Math.floor((y / this.canvas.height) * this.gridHeight);
    const r = 6;

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
    const decay = 0.985;
    const baseInflow = this.inflowSpeed;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const idx = y * this.gridWidth + x;
        if (x === 0) {
          this.u[idx] = baseInflow;
          this.v[idx] = 0;
          continue;
        }
        this.u[idx] = (this.u[idx] * decay) + (baseInflow * (1 - decay));
        this.v[idx] = this.v[idx] * decay;
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

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const vel = this.sampleVelocity(p.x, p.y);

      p.vx = (p.vx * 0.7) + (vel.vx * 1.8 * p.speed * 0.3);
      p.vy = (p.vy * 0.7) + (vel.vy * 1.8 * p.speed * 0.3);

      p.x += p.vx;
      p.y += p.vy;
      p.age++;

      if (p.x > w + 20 || p.x < -20 || p.y < -20 || p.y > h + 20 || p.age > p.maxAge) {
        p.x = -10 + Math.random() * 20;
        p.y = Math.random() * h;
        p.vx = this.inflowSpeed * 1.5;
        p.vy = 0;
        p.age = 0;
        p.maxAge = 120 + Math.random() * 120;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const isLight = document.documentElement.dataset.theme === 'light';

    // Trailing clear for refined motion blur
    ctx.fillStyle = isLight ? 'rgba(246, 243, 235, 0.28)' : 'rgba(12, 13, 16, 0.24)';
    ctx.fillRect(0, 0, w, h);

    // Render streamline particles with DKV print palette
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const alpha = Math.min(1, Math.sin((p.age / p.maxAge) * Math.PI)) * 0.7;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      const tailLen = Math.min(18, speed * 4);
      ctx.lineTo(p.x - p.vx * tailLen, p.y - p.vy * tailLen);

      if (p.style === 'terracotta') {
        ctx.strokeStyle = `rgba(225, 67, 46, ${alpha * 0.65})`;
      } else if (p.style === 'slate') {
        ctx.strokeStyle = `rgba(77, 111, 133, ${alpha * 0.55})`;
      } else {
        ctx.strokeStyle = isLight ? `rgba(45, 40, 32, ${alpha * 0.45})` : `rgba(243, 239, 230, ${alpha * 0.45})`;
      }

      ctx.stroke();

      if (speed > 2.0 && Math.random() > 0.8) {
        ctx.fillStyle = isLight ? `rgba(45, 40, 32, ${alpha * 0.75})` : `rgba(243, 239, 230, ${alpha * 0.8})`;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
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
