/**
 * MASTER APPLICATION ORCHESTRATOR
 * Coordinates background simulations, workbenches, terminal, command palette, and bidirectional scroll reveals.
 * DKV art direction with reactive motion. Zero AI slop.
 */

import { DEVELOPER_PROFILE, REPOSITORIES } from './data.js';
import { sound } from './audio.js';
import { FluidSimulator } from './fluid-canvas.js';
import { ConstellationSimulator } from './constellation-canvas.js';
import { CodemaskWorkbench, PortwardenWorkbench, SlopLensWorkbench } from './workbenches.js';
import { KyoTerminal } from './terminal.js';
import { ProjectInspector } from './inspector.js';
import { MagneticCursor } from './cursor.js';
import { TiltEngine } from './tilt.js';
import { CommandPalette } from './command-palette.js';

class App {
  constructor() {
    this.currentBgMode = 'fluid'; // 'fluid', 'constellation', 'off'
    this.activeFilter = 'all';
    this.searchQuery = '';

    this.fluidSim = null;
    this.constellationSim = null;
    this.inspector = null;
    this.terminal = null;
    this.cursor = null;
    this.tilt = null;
    this.commandPalette = null;

    this.init();
  }

  init() {
    // 0. Ensure viewport starts at top on initial load if no URL anchor hash
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }

    // 1. Initialize Inspector and Terminal
    this.inspector = new ProjectInspector('project-inspector-drawer');
    this.terminal = new KyoTerminal('terminal-drawer', (id) => this.inspector.open(id));

    // 2. Initialize Micro-Interactions (Magnetic Cursor & Tilt)
    this.cursor = new MagneticCursor();
    this.tilt = new TiltEngine();

    // 3. Initialize Command Palette (Ctrl+K)
    this.commandPalette = new CommandPalette(
      (id) => this.inspector.open(id),
      (mode) => this.setBgMode(mode),
      () => this.toggleAudio(),
      () => this.toggleTheme()
    );

    // 4. Initialize Theme Engine (Default Dark, Washi Light on Demand)
    this.initTheme();

    // 5. Initialize Background Canvas Simulation
    this.initBackgroundSimulation();

    // 5. Initialize Navigation Controls & Header Scroll Effect
    this.initNav();

    // 6. Initialize Interactive Workbenches & Tabs
    this.initWorkbenches();
    this.initWorkbenchTabs();

    // 7. Render Project Matrix & Setup Filtering
    this.initProjectMatrix();

    // 8. Connect Action Buttons
    this.initActionButtons();

    // 9. Initialize Bidirectional Floating Scroll Dock & Progress Line
    this.initScrollDock();

    // 10. Initialize KPI Counter Animations
    this.initCounterAnimations();

    // 11. Initialize Bidirectional Scroll Reveal Animations
    this.initScrollReveal();
  }

  initBackgroundSimulation() {
    const bgCanvas = document.getElementById('bg-canvas');
    if (!bgCanvas) return;

    this.fluidSim = new FluidSimulator(bgCanvas);
    this.constellationSim = new ConstellationSimulator(bgCanvas, (id) => this.inspector.open(id));

    // Start with fluid graphic active
    this.fluidSim.start();
  }

  setBgMode(mode) {
    if (this.currentBgMode === mode) return;
    this.currentBgMode = mode;
    sound.chirp(580, 0.06);

    const canvas = document.getElementById('bg-canvas');
    const wrapper = document.getElementById('bg-wrapper');
    if (!canvas || !wrapper) return;

    // Stop active simulators
    if (this.fluidSim) this.fluidSim.stop();
    if (this.constellationSim) this.constellationSim.stop();

    wrapper.classList.remove('mode-fluid', 'mode-constellation', 'mode-off');
    wrapper.classList.add(`mode-${mode}`);

    if (mode === 'fluid') {
      canvas.style.display = 'block';
      this.fluidSim.start();
    } else if (mode === 'constellation') {
      canvas.style.display = 'block';
      this.constellationSim.start();
    } else if (mode === 'off') {
      canvas.style.display = 'none';
    }

    // Update Nav buttons
    document.querySelectorAll('.nav-mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  toggleAudio() {
    const enabled = sound.toggle();
    const btn = document.getElementById('audio-equalizer-btn');
    if (btn) {
      btn.classList.toggle('active', enabled);
      const wrap = btn.querySelector('.equalizer-bar-wrap');
      if (wrap) wrap.classList.toggle('equalizer-active', enabled);
    }
  }

  initTheme() {
    // Default is dark mode unless explicitly saved as light
    let saved = null;
    try {
      saved = localStorage.getItem('ilham_portfolio_theme');
    } catch (_) {}
    const theme = saved === 'light' ? 'light' : 'dark';
    this.setTheme(theme, false);

    // Master header theme toggle button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Floating scroll dock theme toggle button
    const dockThemeBtn = document.getElementById('dock-theme-trigger');
    if (dockThemeBtn) {
      dockThemeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    const current = document.documentElement.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next, true);
  }

  setTheme(theme, withSound = false) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ilham_portfolio_theme', theme);
    } catch (_) {}

    if (withSound) {
      sound.chirp(theme === 'light' ? 720 : 520, 0.05);
    }

    const isLight = theme === 'light';
    const labelText = isLight ? 'DARK' : 'LIGHT';
    const titleText = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';

    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
      btn.title = titleText;
      const label = btn.querySelector('.theme-btn-label');
      if (label) {
        label.textContent = labelText;
      }
    });

    // Update dynamic header styling when theme switches
    const header = document.querySelector('.master-header');
    if (header && !header.classList.contains('is-hidden')) {
      if (window.scrollY > 40) {
        header.style.background = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(19, 21, 27, 0.94)';
        header.style.borderColor = isLight ? 'rgba(45, 40, 32, 0.22)' : 'rgba(240, 242, 248, 0.16)';
        header.style.boxShadow = isLight ? '0 12px 36px rgba(45, 40, 32, 0.12)' : '0 12px 36px rgba(0, 0, 0, 0.6)';
      } else {
        header.style.background = 'var(--bg-surface-glass)';
        header.style.borderColor = 'var(--border-default)';
        header.style.boxShadow = isLight ? '0 8px 30px rgba(45, 40, 32, 0.1)' : '0 8px 30px rgba(0, 0, 0, 0.4)';
      }
    }
  }

  initNav() {
    // Mode toggles
    document.querySelectorAll('.nav-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextMode = this.currentBgMode === 'fluid' ? 'constellation' : this.currentBgMode === 'constellation' ? 'off' : 'fluid';
        this.setBgMode(nextMode);
      });
    });

    // Audio Equalizer toggle
    const audioBtn = document.getElementById('audio-equalizer-btn');
    if (audioBtn) {
      if (sound.isEnabled()) {
        audioBtn.classList.add('active');
        const wrap = audioBtn.querySelector('.equalizer-bar-wrap');
        if (wrap) wrap.classList.add('equalizer-active');
      }
      audioBtn.addEventListener('click', () => {
        this.toggleAudio();
      });
    }

    // Terminal button
    const termBtn = document.getElementById('nav-term-btn');
    if (termBtn && this.terminal) {
      termBtn.addEventListener('click', () => {
        this.terminal.toggle();
      });
    }

    // Header scroll background adaptation
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.master-header');
      if (header && !header.classList.contains('is-hidden')) {
        const isLight = document.documentElement.dataset.theme === 'light';
        if (window.scrollY > 40) {
          header.style.background = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(19, 21, 27, 0.94)';
          header.style.borderColor = isLight ? 'rgba(45, 40, 32, 0.22)' : 'rgba(240, 242, 248, 0.16)';
          header.style.boxShadow = isLight ? '0 12px 36px rgba(45, 40, 32, 0.12)' : '0 12px 36px rgba(0, 0, 0, 0.6)';
        } else {
          header.style.background = 'var(--bg-surface-glass)';
          header.style.borderColor = 'var(--border-default)';
          header.style.boxShadow = isLight ? '0 8px 30px rgba(45, 40, 32, 0.1)' : '0 8px 30px rgba(0, 0, 0, 0.4)';
        }
      }
    });
  }

  initWorkbenches() {
    new CodemaskWorkbench('codemask-workbench');
    new PortwardenWorkbench('portwarden-workbench');
    new SlopLensWorkbench('sloplens-workbench');
  }

  initProjectMatrix() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    this.renderCards(REPOSITORIES);

    // Setup filter pills
    document.querySelectorAll('.filter-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.category;
        sound.click();
        this.applyFilterAndSearch();
      });
    });

    // Setup live search input
    const searchInput = document.getElementById('projects-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilterAndSearch();
      });
    }
  }

  applyFilterAndSearch() {
    let filtered = REPOSITORIES;

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter((r) => r.category === this.activeFilter);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(this.searchQuery) ||
          r.description.toLowerCase().includes(this.searchQuery) ||
          (r.tagline && r.tagline.toLowerCase().includes(this.searchQuery)) ||
          r.language.toLowerCase().includes(this.searchQuery)
      );
    }

    this.renderCards(filtered);
  }

  renderCards(repos) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    if (repos.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-muted); font-family: var(--font-mono);">
          <div style="font-size: 24px; margin-bottom: 8px;">◈</div>
          <div>No repositories matching "${this.searchQuery}" in category '${this.activeFilter}'</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = repos
      .map((r) => {
        const catClass = r.category || 'tools';

        return `
          <article class="project-card tilt-card reveal-on-scroll" data-id="${r.id}">
            <div class="tilt-glare"></div>
            <div>
              <div class="card-top-row">
                <span class="card-category-tag ${catClass}">${r.category.toUpperCase()}</span>
                <span class="card-lang-badge">
                  <span class="lang-dot" style="background-color: ${r.langColor || '#e05a47'};"></span>
                  ${r.language}
                </span>
              </div>
              <h3 class="card-title">${r.name}</h3>
              <div class="card-tagline">${r.tagline || ''}</div>
              <p class="card-desc">${r.description || ''}</p>
            </div>

            <div class="card-footer">
              <button class="card-inspect-btn btn-inspect" data-id="${r.id}">
                <span>Inspect Architecture</span>
                <span>▹</span>
              </button>
              <div class="card-links-group">
                ${
                  r.liveUrl
                    ? `<a href="${r.liveUrl}" target="_blank" rel="noopener noreferrer" class="card-icon-link" title="Open Live Demo">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </a>`
                    : ''
                }
                <a href="${r.githubUrl}" target="_blank" rel="noopener noreferrer" class="card-icon-link" title="View GitHub Repository">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Attach inspect click events
    grid.querySelectorAll('.btn-inspect').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inspector.open(btn.dataset.id);
      });
    });

    // Refresh 3D tilt calculations for newly added cards
    if (this.tilt) this.tilt.refresh();

    // Trigger scroll reveal on rendered cards
    this.initScrollReveal();
  }

  initActionButtons() {
    const jumpLabsBtn = document.getElementById('hero-jump-labs-btn');
    if (jumpLabsBtn) {
      jumpLabsBtn.addEventListener('click', () => {
        document.getElementById('section-labs').scrollIntoView({ behavior: 'smooth' });
        sound.click();
      });
    }

    const jumpMatrixBtn = document.getElementById('hero-jump-matrix-btn');
    if (jumpMatrixBtn) {
      jumpMatrixBtn.addEventListener('click', () => {
        document.getElementById('section-matrix').scrollIntoView({ behavior: 'smooth' });
        sound.click();
      });
    }
  }

  initWorkbenchTabs() {
    const glider = document.getElementById('wb-tab-glider');
    const tabs = document.querySelectorAll('.wb-tab-nav-btn');
    const cards = {
      codemask: document.getElementById('codemask-workbench'),
      portwarden: document.getElementById('portwarden-workbench'),
      sloplens: document.getElementById('sloplens-workbench')
    };

    const updateGlider = (activeTab, centerInBar = false) => {
      if (!glider || !activeTab) return;
      glider.style.width = `${activeTab.offsetWidth}px`;
      glider.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      if (centerInBar) {
        const bar = activeTab.parentElement;
        if (bar && bar.scrollWidth > bar.clientWidth) {
          const target = activeTab.offsetLeft - (bar.clientWidth / 2) + (activeTab.offsetWidth / 2);
          bar.scrollTo({ left: target, behavior: 'smooth' });
        }
      }
    };

    const initialActive = document.querySelector('.wb-tab-nav-btn.active');
    if (initialActive) {
      setTimeout(() => updateGlider(initialActive, false), 120);
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.wb;
        sound.click();

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        updateGlider(tab, true);

        Object.entries(cards).forEach(([key, card]) => {
          if (!card) return;
          if (mode === 'all' || mode === key) {
            card.style.display = 'block';
            card.style.animation = 'none';
            void card.offsetWidth;
            card.style.animation = 'fadeInCard 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    window.addEventListener('resize', () => {
      const activeTab = document.querySelector('.wb-tab-nav-btn.active');
      if (activeTab) updateGlider(activeTab, false);
    });
  }

  initScrollDock() {
    const dock = document.getElementById('floating-scroll-dock');
    const progressLine = document.getElementById('scroll-progress-line');
    const depthIndicator = document.getElementById('dock-depth-indicator');
    const pill = document.getElementById('scroll-dock-pill');
    const tabBtns = document.querySelectorAll('.dock-tab-btn');
    const sections = [
      { id: 'hero', el: document.getElementById('hero') },
      { id: 'section-labs', el: document.getElementById('section-labs') },
      { id: 'section-matrix', el: document.getElementById('section-matrix') },
      { id: 'section-manifesto', el: document.getElementById('section-manifesto') },
      { id: 'section-contact', el: document.getElementById('section-contact') }
    ];

    let lastScrollY = window.scrollY;
    let scrollDirection = 'down';
    let prevDirection = 'down';

    const updatePill = (activeBtn, centerInBar = false) => {
      if (!pill || !activeBtn) return;
      pill.style.width = `${activeBtn.offsetWidth}px`;
      pill.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
      if (centerInBar) {
        const nav = activeBtn.parentElement;
        if (nav && nav.scrollWidth > nav.clientWidth) {
          const target = activeBtn.offsetLeft - (nav.clientWidth / 2) + (activeBtn.offsetWidth / 2);
          nav.scrollTo({ left: target, behavior: 'smooth' });
        }
      }
    };

    const initialActive = document.querySelector('.dock-tab-btn.active');
    if (initialActive) {
      setTimeout(() => updatePill(initialActive, false), 120);
    }

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        sound.click();

        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updatePill(btn, true);

        if (targetId === 'hero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    const dockTermBtn = document.getElementById('dock-term-trigger');
    if (dockTermBtn && this.terminal) {
      dockTermBtn.addEventListener('click', () => {
        this.terminal.toggle();
      });
    }

    let lastActiveSection = null;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      const percentVal = Math.round(scrollPercent * 100);

      // Detect directional velocity and update classes
      const delta = scrollY - lastScrollY;
      if (Math.abs(delta) > 3) {
        scrollDirection = delta > 0 ? 'down' : 'up';
      }
      lastScrollY = scrollY;

      if (progressLine) {
        progressLine.style.width = `${percentVal}%`;
      }

      if (depthIndicator) {
        depthIndicator.textContent = `${percentVal}%`;
      }

      const masterHeader = document.querySelector('.master-header');
      if (dock) {
        if (scrollY > 100) {
          dock.classList.add('is-visible');
          if (masterHeader) {
            masterHeader.classList.add('is-hidden');
            masterHeader.classList.remove('header-return-anim');
          }
          if (scrollDirection !== prevDirection) {
            prevDirection = scrollDirection;
            if (scrollDirection === 'up') {
              dock.classList.remove('dock-trigger-anim');
              void dock.offsetWidth;
              dock.classList.add('dock-trigger-anim');
              dock.classList.add('scroll-dir-up');
              dock.classList.remove('scroll-dir-down');
              sound.chirp(640, 0.02);
            } else {
              dock.classList.remove('dock-trigger-anim');
              dock.classList.add('scroll-dir-down');
              dock.classList.remove('scroll-dir-up');
            }
          }
        } else {
          dock.classList.remove('is-visible', 'dock-trigger-anim', 'scroll-dir-up', 'scroll-dir-down');
          prevDirection = 'down';
          if (masterHeader) {
            if (masterHeader.classList.contains('is-hidden')) {
              masterHeader.classList.remove('is-hidden');
              masterHeader.classList.add('header-return-anim');
              setTimeout(() => masterHeader.classList.remove('header-return-anim'), 450);
            }
          }
        }
      }

      // Dynamic bidirectional section active state detection
      const scrollThreshold = scrollY + window.innerHeight * 0.38;
      let currentSectionId = 'hero';

      for (const sect of sections) {
        if (sect.el) {
          const top = sect.el.offsetTop;
          if (scrollThreshold >= top) {
            currentSectionId = sect.id;
          }
        }
      }

      if (currentSectionId !== lastActiveSection) {
        lastActiveSection = currentSectionId;
        const matchingBtn = document.querySelector(`.dock-tab-btn[data-target="${currentSectionId}"]`);
        if (matchingBtn && !matchingBtn.classList.contains('active')) {
          tabBtns.forEach((b) => b.classList.remove('active'));
          matchingBtn.classList.add('active');
          updatePill(matchingBtn, true);

          // Subtle interactive acoustic tick on section transition
          if (scrollY > 150) {
            sound.chirp(540, 0.03);
          }
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      const activeBtn = document.querySelector('.dock-tab-btn.active');
      if (activeBtn) updatePill(activeBtn, false);
    });
    onScroll();
  }

  initCounterAnimations() {
    const kpiRibbon = document.querySelector('.hero-kpi-ribbon');
    if (!kpiRibbon) return;

    let hasAnimated = false;
    const animateNumbers = () => {
      if (hasAnimated) return;
      hasAnimated = true;

      const items = [
        { el: document.querySelector('.kpi-number.azure'), target: 25, suffix: '' },
        { el: document.querySelector('.kpi-number.emerald'), target: 7, suffix: '' },
        { el: document.querySelector('.kpi-number.amber'), target: 5, suffix: '' }
      ];

      items.forEach((item) => {
        if (!item.el) return;
        const duration = 1200;
        const startTime = performance.now();

        const tick = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(item.target * ease);
          item.el.textContent = `${current}${item.suffix}`;
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            item.el.textContent = `${item.target}${item.suffix}`;
          }
        };
        requestAnimationFrame(tick);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animateNumbers();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(kpiRibbon);
  }

  initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    let lastY = window.scrollY;

    // Bidirectional reactive reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        const currentY = window.scrollY;
        const isScrollingUp = currentY < lastY;
        lastY = currentY;

        entries.forEach((entry) => {
          const target = entry.target;
          if (entry.isIntersecting) {
            if (isScrollingUp) {
              target.classList.add('reveal-from-top');
            } else {
              target.classList.remove('reveal-from-top');
            }
            target.classList.add('is-revealed');

            // Trigger tabs pop animation on embedded tab bars
            const tabBars = target.querySelectorAll('.workbench-tabs-bar, .filter-pills-row');
            tabBars.forEach((tb) => {
              tb.classList.remove('tabs-stagger-pop');
              void tb.offsetWidth;
              tb.classList.add('tabs-stagger-pop');
            });
          } else {
            // Un-reveal when leaving viewport so scrolling in opposite direction reactively reveals
            target.classList.remove('is-revealed');
          }
        });
      },
      { threshold: 0.08, rootMargin: '20px 0px -20px 0px' }
    );

    elements.forEach((el, index) => {
      if (el.classList.contains('project-card')) {
        const colIndex = index % 3;
        el.style.transitionDelay = `${colIndex * 0.05}s`;
      }
      observer.observe(el);
    });
  }
}

// Bootstrap once DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
