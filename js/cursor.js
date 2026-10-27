/**
 * CURSOR TRACKING & COORDINATE BUS
 * Clean native cursor experience with high-performance viewport coordinate tracking.
 * Ornaments and magnetic ring elements removed for zero cursor distraction.
 */

export class MagneticCursor {
  constructor() {
    this.mouse = { x: -500, y: -500 };
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.init();
  }

  init() {
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    // Update global CSS mouse coordinate variables for card reflections
    document.documentElement.style.setProperty('--mouse-x', `${this.mouse.x}px`);
    document.documentElement.style.setProperty('--mouse-y', `${this.mouse.y}px`);
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}
