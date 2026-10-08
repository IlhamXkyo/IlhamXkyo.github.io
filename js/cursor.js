/**
 * CUSTOM MAGNETIC CURSOR & SPOTLIGHT ENGINE
 * High-performance mouse tracking, magnetic element snapping, and cursor ring elastic spring motion.
 */

export class MagneticCursor {
  constructor() {
    // Only initialize on devices with fine pointer (mouse), not touchscreens
    if (window.matchMedia('(pointer: coarse)').matches) return;

    this.dot = document.createElement('div');
    this.dot.className = 'custom-cursor-dot';

    this.ring = document.createElement('div');
    this.ring.className = 'custom-cursor-ring';

    document.body.appendChild(this.dot);
    document.body.appendChild(this.ring);

    this.mouse = { x: -100, y: -100 };
    this.ringPos = { x: -100, y: -100 };
    this.target = null;
    this.magneticLocked = false;
    this.magneticCenter = { x: 0, y: 0 };

    this.animId = null;

    this.init();
  }

  init() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      this.dot.style.transform = `translate(${this.mouse.x}px, ${this.mouse.y}px)`;

      // Update global CSS mouse spotlight variables
      document.documentElement.style.setProperty('--mouse-x', `${this.mouse.x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${this.mouse.y}px`);
    });

    // Magnetic attachment & hover scaling
    this.attachHoverListeners();

    // Render loop for smooth spring ring interpolation
    const render = () => {
      const ease = 0.18;
      if (this.magneticLocked) {
        // Snap strongly towards magnetic target center
        this.ringPos.x += (this.magneticCenter.x - this.ringPos.x) * 0.35;
        this.ringPos.y += (this.magneticCenter.y - this.ringPos.y) * 0.35;
      } else {
        // Normal spring lag
        this.ringPos.x += (this.mouse.x - this.ringPos.x) * ease;
        this.ringPos.y += (this.mouse.y - this.ringPos.y) * ease;
      }

      this.ring.style.transform = `translate(${this.ringPos.x}px, ${this.ringPos.y}px)`;
      this.animId = requestAnimationFrame(render);
    };

    render();
  }

  attachHoverListeners() {
    const selector = 'button, a, .btn-magnetic, .project-card, .filter-pill-btn, .cmd-palette-trigger';
    
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest(selector);
      if (el) {
        this.ring.classList.add('hover-active');

        // Check if magnetic button
        if (el.classList.contains('btn-magnetic')) {
          this.magneticLocked = true;
          const rect = el.getBoundingClientRect();
          this.magneticCenter.x = rect.left + rect.width / 2;
          this.magneticCenter.y = rect.top + rect.height / 2;
          this.ring.classList.add('magnetic-locked');
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest(selector);
      if (el) {
        this.ring.classList.remove('hover-active', 'magnetic-locked');
        this.magneticLocked = false;
      }
    });
  }
}
