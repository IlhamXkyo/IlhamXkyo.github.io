/**
 * TEXT SCRAMBLE / HACKER DECODE ENGINE
 * Generates rapid random character deciphering effects on titles and interactive badges.
 */

export class TextScramble {
  constructor() {
    this.chars = '!<>-_\\/[]{}~=+*^?#________';
    this.init();
  }

  init() {
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('.scramble-target');
      if (target && !target.dataset.scrambling) {
        this.scramble(target);
      }
    });
  }

  scramble(element) {
    const originalText = element.dataset.originalText || element.innerText;
    element.dataset.originalText = originalText;
    element.dataset.scrambling = 'true';

    let iteration = 0;
    const maxIterations = originalText.length * 2.2;
    const interval = setInterval(() => {
      element.innerText = originalText
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < iteration / 2.2) {
            return originalText[index];
          }
          return this.chars[Math.floor(Math.random() * this.chars.length)];
        })
        .join('');

      if (iteration >= maxIterations) {
        clearInterval(interval);
        element.innerText = originalText;
        delete element.dataset.scrambling;
      }

      iteration++;
    }, 28);
  }
}
