/**
 * Generative Harmonic Wave Simulator (Canvas Design Studio)
 * Multi-layered parametric sine wave harmonics and acoustic resonance.
 * Architectural pigments: Cinnabar vermilion, slate azure, celadon sage, saffron ochre.
 * Pure mathematical craft with zero dependencies. Zero AI slop.
 */

export class HarmonicWaveSimulator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animId = null;
    this.running = false;

    this.time = 0;
    this.mouse = { x: -1000, y: -1000, px: -1000, py: -1000, isDown: false, speed: 0 };
    this.ripples = [];

    this.layers = [
      { baseAmp: 42, freq: 0.0035, speed: 0.018, phase: 0, color: 'rgba(239, 35, 60, 0.28)', lineWidth: 2.2 },
      { baseAmp: 34, freq: 0.0052, speed: -0.024, phase: 1.2, color: 'rgba(217, 4, 41, 0.22)', lineWidth: 1.8 },
      { baseAmp: 28, freq: 0.0070, speed: 0.031, phase: 2.5, color: 'rgba(255, 87, 34, 0.20)', lineWidth: 1.6 },
      { baseAmp: 22, freq: 0.0092, speed: -0.015, phase: 3.8, color: 'rgba(141, 8, 1, 0.18)', lineWidth: 1.4 },
      { baseAmp: 16, freq: 0.0120, speed: 0.022, phase: 5.1, color: 'rgba(246, 246, 249, 0.14)', lineWidth: 1.2 }
    ];

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
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
      this.mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
    }

    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
  }

  onMouseDown(e) {
    this.mouse.isDown = true;
    this.addRipple(this.mouse.x, this.mouse.y, 45);
  }

  onMouseUp() {
    this.mouse.isDown = false;
  }

  onTouchStart(e) {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const mx = (t.clientX - rect.left) * (this.dpr || 1);
    const my = (t.clientY - rect.top) * (this.dpr || 1);
    this.mouse.x = mx;
    this.mouse.y = my;
    this.mouse.isDown = true;
    this.addRipple(mx, my, 40);
  }

  onTouchMove(e) {
    if (!e.touches.length) return;
    const t = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const mx = (t.clientX - rect.left) * (this.dpr || 1);
    const my = (t.clientY - rect.top) * (this.dpr || 1);
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
  }

  onTouchEnd() {
    this.mouse.isDown = false;
  }

  addRipple(x, y, maxRadius) {
    if (this.ripples.length > 8) this.ripples.shift();
    this.ripples.push({
      x: x,
      y: y,
      radius: 4,
      maxRadius: maxRadius || 60,
      opacity: 0.8,
      growRate: 2.2
    });
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

  loop() {
    if (!this.running) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerY = h * 0.52;

    this.time += 0.024;
    ctx.clearRect(0, 0, w, h);

    // Update and draw pointer shockwave ripples
    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const rip = this.ripples[r];
      rip.radius += rip.growRate;
      rip.opacity *= 0.94;

      if (rip.opacity <= 0.02 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(r, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 35, 60, ${rip.opacity * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Draw multi-layered parametric sine wave ribbons
    const stepX = 16 * (this.dpr || 1);
    const numPoints = Math.ceil(w / stepX) + 2;

    this.layers.forEach((layer, idx) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = layer.lineWidth * (this.dpr || 1);
      ctx.strokeStyle = layer.color;

      let started = false;

      for (let i = 0; i < numPoints; i++) {
        const x = i * stepX;

        // Base harmonic wave equation
        let y = centerY;
        const wave1 = Math.sin(x * layer.freq + this.time * layer.speed + layer.phase) * layer.baseAmp;
        const wave2 = Math.cos(x * layer.freq * 0.5 - this.time * 0.015) * (layer.baseAmp * 0.45);
        y += wave1 + wave2;

        // Mouse proximity perturbation
        if (this.mouse.x > -500) {
          const distMouse = Math.abs(x - this.mouse.x);
          if (distMouse < 260) {
            const influence = (1 - distMouse / 260);
            const offset = (this.mouse.y - centerY) * influence * 0.35;
            y += offset * Math.sin(this.time * 2 + idx);
          }
        }

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Subtle fill baseline glow
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, centerY - layer.baseAmp, 0, h);
      grad.addColorStop(0, layer.color.replace(/[\d\.]+\)$/, '0.04)'));
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    });

    this.animId = requestAnimationFrame(this.loop);
  }
}
