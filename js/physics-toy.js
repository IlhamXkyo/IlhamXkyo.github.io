/**
 * INTERACTIVE KINETIC DKV TOKEN CANVAS
 * Real-time 2D kinetic tag sandbox with drag, kinetic momentum, and tactile boundary bounce.
 * Pure tactile craft. Zero AI slop.
 */

import { sound } from './audio.js';

export class PhysicsToy {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.bodies = [];
    this.mouse = { x: 0, y: 0, px: 0, py: 0, isDown: false, grabbedBody: null };
    this.gravity = 0.28;
    this.friction = 0.985;
    this.bounce = 0.72;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const tags = [
      { text: 'CODEMASK', bg: '#e05a47', color: '#ffffff' },
      { text: 'ZERO-SLOP', bg: '#d99b26', color: '#0d0e12' },
      { text: 'PORTWARDEN', bg: '#5a8268', color: '#ffffff' },
      { text: 'WARGA-OS', bg: '#5c7c99', color: '#ffffff' }
    ];

    const w = this.canvas.width;
    const h = this.canvas.height;

    this.bodies = tags.map((t, idx) => {
      const bw = 110;
      const bh = 34;
      return {
        text: t.text,
        bg: t.bg,
        color: t.color,
        w: bw,
        h: bh,
        x: 20 + idx * 60,
        y: 20 + (idx % 2) * 45,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2,
        rot: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 0.05
      };
    });

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    this.canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.mouse.grabbedBody) return;
      const touch = e.touches[0];
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });

    window.addEventListener('touchend', () => this.onMouseUp());

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 320;
    this.canvas.height = rect.height || 200;
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    this.mouse.x = mx;
    this.mouse.y = my;
    this.mouse.px = mx;
    this.mouse.py = my;
    this.mouse.isDown = true;

    // Hit test bodies from top to bottom
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      if (mx >= b.x - b.w / 2 && mx <= b.x + b.w / 2 && my >= b.y - b.h / 2 && my <= b.y + b.h / 2) {
        this.mouse.grabbedBody = b;
        sound.click();
        break;
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
  }

  onMouseUp() {
    if (this.mouse.grabbedBody) {
      // Transfer fling momentum
      this.mouse.grabbedBody.vx = (this.mouse.x - this.mouse.px) * 0.8;
      this.mouse.grabbedBody.vy = (this.mouse.y - this.mouse.py) * 0.8;
      this.mouse.grabbedBody.vRot = (Math.random() - 0.5) * 0.15;
      sound.chirp(520, 0.05);
    }
    this.mouse.isDown = false;
    this.mouse.grabbedBody = null;
  }

  loop() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.bodies.forEach((b) => {
      if (b === this.mouse.grabbedBody) {
        b.x = this.mouse.x;
        b.y = this.mouse.y;
        b.vx = 0;
        b.vy = 0;
      } else {
        b.vy += this.gravity;
        b.vx *= this.friction;
        b.vy *= this.friction;
        b.vRot *= this.friction;

        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vRot;

        // Boundary bounce
        if (b.x - b.w / 2 < 0) {
          b.x = b.w / 2;
          b.vx = -b.vx * this.bounce;
        } else if (b.x + b.w / 2 > w) {
          b.x = w - b.w / 2;
          b.vx = -b.vx * this.bounce;
        }

        if (b.y - b.h / 2 < 0) {
          b.y = b.h / 2;
          b.vy = -b.vy * this.bounce;
        } else if (b.y + b.h / 2 > h) {
          b.y = h - b.h / 2;
          b.vy = -b.vy * this.bounce;
          b.vx *= 0.92;
        }
      }

      // Draw Sticker Body
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = b.bg;
      ctx.beginPath();
      ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 6);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = b.color;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, 0, 1);

      ctx.restore();
    });

    requestAnimationFrame(this.loop);
  }
}
