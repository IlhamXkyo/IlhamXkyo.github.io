/**
 * FLOATING SPOTLIGHT COMMAND PALETTE (CTRL+K / CMD+K)
 * Fast keyboard-driven launcher for all 25 repositories, graphic modes, and audio controls.
 */

import { REPOSITORIES } from './data.js';
import { sound } from './audio.js';

export class CommandPalette {
  constructor(onSelectRepo, onSetBgMode, onToggleAudio, onToggleTheme) {
    this.onSelectRepo = onSelectRepo;
    this.onSetBgMode = onSetBgMode;
    this.onToggleAudio = onToggleAudio;
    this.onToggleTheme = onToggleTheme;

    this.backdrop = null;
    this.input = null;
    this.resultsList = null;
    this.selectedIndex = 0;
    this.filteredItems = [];

    this.init();
  }

  init() {
    this.createDOM();

    // Hotkey listener: Ctrl + K or Cmd + K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Trigger button listeners
    document.querySelectorAll('.cmd-palette-trigger').forEach((btn) => {
      btn.addEventListener('click', () => this.open());
    });
  }

  createDOM() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'command-palette-backdrop';

    this.backdrop.innerHTML = `
      <div class="command-palette-modal">
        <div class="cp-search-header">
          <svg class="cp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="cp-search-input" placeholder="Type a command or jump to any project..." />
          <span class="cp-shortcut-badge">ESC to close</span>
        </div>
        <div class="cp-results-list"></div>
        <div class="cp-footer-hint">
          <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>↵</kbd> to select</span>
          <span style="color: var(--accent-terracotta);">30+ Projects Indexed</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);

    this.input = this.backdrop.querySelector('.cp-search-input');
    this.resultsList = this.backdrop.querySelector('.cp-results-list');

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    this.input.addEventListener('input', () => this.onQueryChange());
    this.input.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  isOpen() {
    return this.backdrop.classList.contains('active');
  }

  open() {
    this.backdrop.classList.add('active');
    this.input.value = '';
    this.selectedIndex = 0;
    this.onQueryChange();
    sound.chirp(740, 0.06);
    setTimeout(() => this.input.focus(), 80);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.backdrop.classList.remove('active');
    sound.click();
    document.body.style.overflow = '';
  }

  toggle() {
    if (this.isOpen()) this.close();
    else this.open();
  }

  onQueryChange() {
    const q = this.input.value.toLowerCase().trim();

    // Built-in actions
    const systemActions = [
      { type: 'action', id: 'act-theme', name: 'Toggle Theme (Light / Dark)', desc: 'Switch between Archival Sumi Dark and Warm Washi Light', badge: 'Theme', execute: () => this.onToggleTheme && this.onToggleTheme() },
      { type: 'action', id: 'act-fluid', name: 'Switch Background: Vector Flow', desc: 'Generative streamflow particle field', badge: 'Action', execute: () => this.onSetBgMode('fluid') },
      { type: 'action', id: 'act-const', name: 'Switch Background: Constellation', desc: 'Interactive repository node network', badge: 'Action', execute: () => this.onSetBgMode('constellation') },
      { type: 'action', id: 'act-audio', name: 'Toggle Procedural Audio Engine', desc: 'Mechanical sound synthesis', badge: 'Action', execute: () => this.onToggleAudio() }
    ];

    const repoItems = REPOSITORIES.map((r) => ({
      type: 'repo',
      id: r.id,
      name: r.name,
      desc: r.tagline || r.description,
      badge: r.category,
      execute: () => this.onSelectRepo(r.id)
    }));

    const all = [...systemActions, ...repoItems];

    if (!q) {
      this.filteredItems = all.slice(0, 8);
    } else {
      this.filteredItems = all.filter((item) => item.name.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)).slice(0, 10);
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
      this.renderResults();
      sound.click();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
      this.renderResults();
      sound.click();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.filteredItems[this.selectedIndex]) {
        const item = this.filteredItems[this.selectedIndex];
        this.close();
        item.execute();
      }
    }
  }

  renderResults() {
    if (this.filteredItems.length === 0) {
      this.resultsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-family: var(--font-mono); font-size: 13px;">No matching results for "${this.input.value}"</div>`;
      return;
    }

    this.resultsList.innerHTML = this.filteredItems
      .map((item, idx) => `
        <div class="cp-result-item ${idx === this.selectedIndex ? 'selected' : ''}" data-idx="${idx}">
          <div class="cp-result-left">
            <span class="cp-result-icon">${item.type === 'action' ? '⚡' : '▹'}</span>
            <div>
              <span class="cp-result-name">${item.name}</span>
              <span class="cp-result-desc">${item.desc ? item.desc.slice(0, 55) : ''}</span>
            </div>
          </div>
          <span class="cp-result-badge">${item.badge}</span>
        </div>
      `)
      .join('');

    this.resultsList.querySelectorAll('.cp-result-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        const item = this.filteredItems[idx];
        if (item) {
          this.close();
          item.execute();
        }
      });
    });
  }
}
