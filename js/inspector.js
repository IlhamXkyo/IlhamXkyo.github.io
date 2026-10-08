/**
 * CAD Datasheet Project Inspector Drawer
 * Displays deep architectural details, CLI run instructions, and live links for any repository.
 */

import { REPOSITORIES } from './data.js';
import { sound } from './audio.js';

export class ProjectInspector {
  constructor(drawerId) {
    this.drawer = document.getElementById(drawerId);
    if (!this.drawer) return;

    this.backdrop = document.querySelector('.inspector-backdrop') || this.drawer.querySelector('.inspector-backdrop');
    this.closeBtn = this.drawer.querySelector('.inspector-close-btn');
    this.content = this.drawer.querySelector('.inspector-content');

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.drawer.classList.contains('active');
  }

  open(repoId) {
    const idLower = String(repoId || '').toLowerCase();
    const repo = REPOSITORIES.find(r => r.id.toLowerCase() === idLower || r.name.toLowerCase() === idLower);
    if (!repo || !this.content) return;

    sound.chirp(640, 0.07);
    this.renderRepo(repo);
    this.drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('active');
    document.body.style.overflow = '';
    sound.click();
  }

  renderRepo(repo) {
    const hasLive = repo.liveUrl && repo.liveUrl.length > 0;
    const topicsHtml = (repo.topics || []).map(t => `<span class="cad-topic-pill">#${t}</span>`).join('');
    const highlightsHtml = (repo.highlights || []).map(h => `<li><span class="highlight-bullet">▹</span> ${h}</li>`).join('');

    this.content.innerHTML = `
      <div class="cad-sheet-header">
        <div class="cad-sheet-meta">
          <span class="cad-badge category">${repo.category.toUpperCase()}</span>
          <span class="cad-badge language" style="border-color:${repo.langColor}; color:${repo.langColor};">
            ${repo.language || 'Multi'}
          </span>
          <span class="cad-badge updated">REV: ${repo.updatedAt}</span>
        </div>
        <h2 class="cad-sheet-title">${repo.name}</h2>
        <p class="cad-sheet-tagline">${repo.tagline}</p>
      </div>

      <div class="cad-sheet-body">
        <div class="cad-section">
          <h4 class="cad-section-title">01 // Problem & Overview</h4>
          <p class="cad-text">${repo.description}</p>
        </div>

        <div class="cad-section">
          <h4 class="cad-section-title">02 // Architectural Design</h4>
          <div class="cad-arch-box">
            <p class="cad-arch-text">${repo.architecture}</p>
          </div>
        </div>

        <div class="cad-section">
          <h4 class="cad-section-title">03 // Technical Highlights</h4>
          <ul class="cad-highlight-list">
            ${highlightsHtml}
          </ul>
        </div>

        <div class="cad-section">
          <h4 class="cad-section-title">04 // Execution & CLI Run</h4>
          <div class="cad-code-block">
            <pre><code>${repo.cliSnippet}</code></pre>
            <button class="cad-copy-btn" data-code="${encodeURIComponent(repo.cliSnippet)}">
              <span class="copy-label">COPY</span>
            </button>
          </div>
        </div>

        ${topicsHtml ? `
        <div class="cad-section">
          <h4 class="cad-section-title">05 // Topics & Classification</h4>
          <div class="cad-topics-wrap">
            ${topicsHtml}
          </div>
        </div>` : ''}

        <div class="cad-actions-footer">
          <a href="${repo.githubUrl}" target="_blank" rel="noopener noreferrer" class="cad-btn primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            View Repository on GitHub
          </a>
          ${hasLive ? `
          <a href="${repo.liveUrl}" target="_blank" rel="noopener noreferrer" class="cad-btn secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Launch Live Deployment
          </a>` : ''}
        </div>
      </div>
    `;

    // Bind copy button with graceful fallback
    const copyBtn = this.content.querySelector('.cad-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = decodeURIComponent(copyBtn.dataset.code);
        const setCopied = () => {
          sound.click();
          const label = copyBtn.querySelector('.copy-label');
          if (label) {
            label.textContent = 'COPIED!';
            setTimeout(() => { label.textContent = 'COPY'; }, 1500);
          }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code)
            .then(setCopied)
            .catch(() => {
              this.fallbackCopy(code);
              setCopied();
            });
        } else {
          this.fallbackCopy(code);
          setCopied();
        }
      });
    }
  }

  fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      // Graceful fallback
    }
  }
}
