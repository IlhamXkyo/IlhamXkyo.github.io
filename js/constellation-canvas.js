/**
 * Interactive Repository Constellation Canvas
 * Represents Ilham's 25 repositories as interactive graphic nodes with spring dampening and category links.
 */

import { REPOSITORIES } from './data.js';

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 100;
  const g = parseInt(hex.slice(3, 5), 16) || 116;
  const b = parseInt(hex.slice(5, 7), 16) || 139;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class ConstellationSimulator {
  constructor(canvas, onSelectRepo) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onSelectRepo = onSelectRepo;
    this.animId = null;
    this.running = false;

    this.nodes = [];
    this.mouse = { x: -1000, y: -1000, isDown: false, draggedNode: null };
    this.hoveredNode = null;

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
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);

    // Touch event support for smartphones and tablets
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchcancel', this.onTouchEnd);

    this.buildNodes();
  }

  buildNodes() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    this.nodes = REPOSITORIES.map((repo, idx) => {
      const angle = (idx / REPOSITORIES.length) * Math.PI * 2;
      const dist = 120 + Math.random() * (Math.min(w, h) * 0.35);
      return {
        id: repo.id,
        name: repo.name,
        category: repo.category,
        language: repo.language,
        featured: repo.featured,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: repo.featured ? 9 : 6,
        mass: repo.featured ? 4 : 2,
        color: this.getCategoryColor(repo.category)
      };
    });
  }

  getCategoryColor(cat) {
    switch (cat) {
      case 'tools': return '#e05a47';   // Warm Terracotta
      case 'nlp': return '#d99b26';     // Warm Saffron
      case 'civic': return '#5a8268';   // Olive Sage Clay
      case 'quant': return '#5c7c99';   // Bauhaus Slate Ink
      case 'games': return '#8c6d89';   // Archival Plum
      default: return '#a1a7b5';
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const prevW = this.canvas.width || window.innerWidth * dpr;
    const prevH = this.canvas.height || window.innerHeight * dpr;

    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.dpr = dpr;

    // Rescale node coordinates gently to stay within viewport
    if (this.nodes && this.nodes.length > 0 && prevW > 0 && prevH > 0) {
      const scaleX = this.canvas.width / prevW;
      const scaleY = this.canvas.height / prevH;
      this.nodes.forEach(n => {
        n.x = Math.max(30, Math.min(this.canvas.width - 30, n.x * scaleX));
        n.y = Math.max(30, Math.min(this.canvas.height - 30, n.y * scaleY));
      });
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (e.clientX - rect.left) * this.dpr;
    this.mouse.y = (e.clientY - rect.top) * this.dpr;

    if (this.mouse.draggedNode) {
      this.mouse.draggedNode.x = this.mouse.x;
      this.mouse.draggedNode.y = this.mouse.y;
      this.mouse.draggedNode.vx = 0;
      this.mouse.draggedNode.vy = 0;
      return;
    }

    let found = null;
    for (const node of this.nodes) {
      const dx = node.x - this.mouse.x;
      const dy = node.y - this.mouse.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius * 2.5) {
        found = node;
        break;
      }
    }
    this.hoveredNode = found;
    this.canvas.style.cursor = found ? 'pointer' : 'default';
  }

  onTouchStart(e) {
    if (!e.touches[0]) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (touch.clientX - rect.left) * this.dpr;
    this.mouse.y = (touch.clientY - rect.top) * this.dpr;
    this.mouse.isDown = true;

    let found = null;
    for (const node of this.nodes) {
      const dx = node.x - this.mouse.x;
      const dy = node.y - this.mouse.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius * 3.5) {
        found = node;
        break;
      }
    }
    if (found) {
      e.preventDefault();
      this.mouse.draggedNode = found;
      this.hoveredNode = found;
      if (this.onSelectRepo) {
        this.onSelectRepo(found.id);
      }
    }
  }

  onTouchMove(e) {
    if (!e.touches[0]) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (touch.clientX - rect.left) * this.dpr;
    this.mouse.y = (touch.clientY - rect.top) * this.dpr;

    if (this.mouse.draggedNode) {
      e.preventDefault();
      this.mouse.draggedNode.x = this.mouse.x;
      this.mouse.draggedNode.y = this.mouse.y;
      this.mouse.draggedNode.vx = 0;
      this.mouse.draggedNode.vy = 0;
    }
  }

  onTouchEnd() {
    this.mouse.isDown = false;
    this.mouse.draggedNode = null;
  }

  onMouseDown(e) {
    if (e.button !== 0) return;
    this.mouse.isDown = true;
    if (this.hoveredNode) {
      this.mouse.draggedNode = this.hoveredNode;
    }
  }

  onMouseUp(e) {
    if (this.mouse.draggedNode && Math.abs(this.mouse.draggedNode.vx) < 1 && Math.abs(this.mouse.draggedNode.vy) < 1) {
      if (this.onSelectRepo) {
        this.onSelectRepo(this.mouse.draggedNode.id);
      }
    }
    this.mouse.isDown = false;
    this.mouse.draggedNode = null;
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      if (n1 === this.mouse.draggedNode) continue;

      // Soft pull toward center to keep constellation framed
      const dcx = cx - n1.x;
      const dcy = cy - n1.y;
      n1.vx += dcx * 0.00008;
      n1.vy += dcy * 0.00008;

      // Mouse repulsion or attraction
      const dmx = this.mouse.x - n1.x;
      const dmy = this.mouse.y - n1.y;
      const distMouse = Math.sqrt(dmx * dmx + dmy * dmy);
      if (distMouse < 180 && distMouse > 1) {
        const force = (180 - distMouse) / 180;
        n1.vx -= (dmx / distMouse) * force * 0.4;
        n1.vy -= (dmy / distMouse) * force * 0.4;
      }

      // Repulsion between nodes to prevent overlapping
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 80;

        if (dist < minDist && dist > 0.1) {
          const repulse = (minDist - dist) / minDist * 0.2;
          const rx = (dx / dist) * repulse;
          const ry = (dy / dist) * repulse;
          n1.vx -= rx;
          n1.vy -= ry;
          n2.vx += rx;
          n2.vy += ry;
        }

        // Intra-category cluster spring pull
        if (n1.category === n2.category && dist > 140) {
          const spring = 0.00015;
          n1.vx += dx * spring;
          n1.vy += dy * spring;
          n2.vx -= dx * spring;
          n2.vy -= dy * spring;
        }
      }

      // Velocity damping
      n1.vx *= 0.94;
      n1.vy *= 0.94;

      n1.x += n1.vx;
      n1.y += n1.vy;

      // Viewport boundaries bounce
      const pad = 30;
      if (n1.x < pad) { n1.x = pad; n1.vx *= -0.5; }
      if (n1.x > w - pad) { n1.x = w - pad; n1.vx *= -0.5; }
      if (n1.y < pad) { n1.y = pad; n1.vy *= -0.5; }
      if (n1.y > h - pad) { n1.y = h - pad; n1.vy *= -0.5; }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(12, 13, 16, 0.4)';
    ctx.fillRect(0, 0, w, h);

    // Draw category interconnect lines
    ctx.lineWidth = 1;
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        if (n1.category === n2.category) {
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 260) {
            const alpha = (1 - dist / 260) * 0.35;
            if (this.hoveredNode && (this.hoveredNode === n1 || this.hoveredNode === n2)) {
              ctx.strokeStyle = n1.color;
              ctx.lineWidth = 1.6;
            } else {
              ctx.strokeStyle = hexToRgba(n1.color, alpha);
              ctx.lineWidth = 0.9;
            }
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
    }

    // Draw nodes
    for (const node of this.nodes) {
      const isHovered = this.hoveredNode === node;
      const isDrag = this.mouse.draggedNode === node;
      const r = isHovered || isDrag ? node.radius * 1.5 : node.radius;

      // Glow ring
      if (isHovered || node.featured) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Main core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#ffffff' : node.color;
      ctx.fill();

      // Label
      if (node.featured || isHovered) {
        ctx.font = `${isHovered ? 'bold 12px' : '11px'} 'JetBrains Mono', Consolas, monospace`;
        ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(node.name, node.x + r + 8, node.y + 4);
      }
    }
  }

  loop() {
    if (!this.running) return;
    this.update();
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
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchcancel', this.onTouchEnd);
  }
}
