/**
 * 3D PERSPECTIVE TILT & SPECULAR GLARE ENGINE
 * Implements smooth 3D rotational tilt and radial glare following cursor position.
 */

export class TiltEngine {
  constructor() {
    this.cards = [];
    this.init();
  }

  init() {
    this.refresh();

    // Re-check periodically when dynamic cards are rendered
    const observer = new MutationObserver(() => this.refresh());
    const grid = document.querySelector('.projects-grid');
    if (grid) {
      observer.observe(grid, { childList: true });
    }
  }

  refresh() {
    const targets = document.querySelectorAll('.tilt-card, .project-card, .workbench-card, .routine-card');
    targets.forEach((card) => {
      if (card.dataset.tiltAttached) return;
      card.dataset.tiltAttached = 'true';
      this.attachTilt(card);
    });
  }

  attachTilt(card) {
    const maxTilt = 7; // degrees

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;

      // Set card-level mouse positions for glare
      card.style.setProperty('--mouse-card-x', `${x}px`);
      card.style.setProperty('--mouse-card-y', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  }
}
