/**
 * Interactive Engineering Mini-Labs & Workbenches
 * 1. CodeMask Secret Redaction Workbench
 * 2. Portwarden Sentinel Terminal
 * 3. Slop-Lens Stylometrics & Prose Rhythm Workbench
 * Built with DKV art direction and authentic logic paths. Zero AI slop.
 */

import { sound } from './audio.js';

/* ============================================================
   1. CODEMASK SYNTAX-PRESERVING SECRET REDACTOR WORKBENCH
   ============================================================ */
export class CodemaskWorkbench {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.editor = this.container.querySelector('.cm-code-editor');
    this.preview = this.container.querySelector('.cm-code-preview');
    this.presetSelect = this.container.querySelector('.cm-preset-select');
    this.maskBtn = this.container.querySelector('.cm-mask-btn');
    this.unmaskBtn = this.container.querySelector('.cm-unmask-btn');
    this.copyBtn = this.container.querySelector('.cm-copy-btn');
    this.chipsList = this.container.querySelector('.cm-chips-list');
    this.toast = this.container.querySelector('.cm-toast');

    // Telemetry displays
    this.statusVal = this.container.querySelector('.cm-telemetry-status');
    this.countVal = this.container.querySelector('.cm-telemetry-count');
    this.astVal = this.container.querySelector('.cm-telemetry-ast');

    this.vault = new Map();
    this.isMasked = false;

    this.presets = {
      backend: `// Express / Node.js Production Configuration
import { createClient } from '@supabase/supabase-js';

export const config = {
  port: process.env.PORT || 3000,
  databaseUrl: "postgres://admin:sample_password_99@db.internal:5432/primary",
  openaiApiKey: "sample_openai_key_aB99XzLq110488924157790111223344",
  stripeSecretKey: "sample_stripe_key_51OzX92847291084201948201948",
  jwtSecret: "sample_jwt_token_s3cr3t_k3y_9948201948201948"
};`,
      agent: `# LangChain / Autogen Agent Execution Context
import os

AGENT_SECRETS = {
  "ANTHROPIC_API_KEY": "sample_anthropic_key_Lqm789xZ124455990011223344",
  "DATABASE_DSN": "postgres://svc_crawler:sample_secret_key@redis-cache.internal:6379/0",
  "AWS_ACCESS_KEY": "SAMPLE_AWS_KEY_EXAMPLEKEY1234",
  "AWS_SECRET_KEY": "sample_aws_secret_EXAMPLEKEY_TEST1234"
}`,
      docker: `# Microservice Environment Secrets
DATABASE_URL=postgres://postgres:sample_root_password_2026@db:5432/warga_db
GITHUB_TOKEN=sample_github_token_990148102948102948102948
SESSION_SECRET=sample_jwt_token_s3cur3_s3ss10n_t0k3n_v4lu3`
    };

    this.init();
  }

  init() {
    if (this.editor) {
      this.editor.value = this.presets.backend;
      this.editor.addEventListener('input', () => {
        this.isMasked = false;
        this.updatePreviewRaw();
      });
    }

    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (this.presets[val] && this.editor) {
          this.editor.value = this.presets[val];
          sound.click();
          this.executeMask();
        }
      });
    }

    if (this.maskBtn) {
      this.maskBtn.addEventListener('click', () => {
        this.executeMask();
        sound.chirp(580, 0.05);
      });
    }

    if (this.unmaskBtn) {
      this.unmaskBtn.addEventListener('click', () => {
        this.executeUnmask();
        sound.chirp(480, 0.05);
      });
    }

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => {
        this.copyPromptSafe();
      });
    }

    // Run initial mask on load
    this.executeMask();
  }

  detectAndMask(code) {
    const patterns = [
      { type: 'OPENAI_KEY', regex: /sample_openai_key_[a-zA-Z0-9_\-]{16,}/g },
      { type: 'ANTHROPIC_KEY', regex: /sample_anthropic_key_[a-zA-Z0-9_\-]{16,}/g },
      { type: 'STRIPE_KEY', regex: /sample_stripe_key_[a-zA-Z0-9_\-]{16,}/g },
      { type: 'GITHUB_TOKEN', regex: /sample_github_token_[a-zA-Z0-9_\-]{16,}/g },
      { type: 'AWS_KEY', regex: /SAMPLE_AWS_KEY_[0-9A-Z]{12,}/g },
      { type: 'AWS_SECRET', regex: /sample_aws_secret_[a-zA-Z0-9_\-\/+=]{16,}/g },
      { type: 'POSTGRES_URI', regex: /postgres:\/\/[^"'\s\n]+/g },
      { type: 'JWT_TOKEN', regex: /sample_jwt_token_[a-zA-Z0-9_\-]+/g }
    ];

    this.vault.clear();
    let masked = code;
    let count = 0;
    const detectedChips = [];

    patterns.forEach((p) => {
      masked = masked.replace(p.regex, (match) => {
        count++;
        const token = `__CODEMASK_${p.type}_${count}__`;
        this.vault.set(token, match);
        detectedChips.push({ token, type: p.type, original: match });
        return token;
      });
    });

    return { masked, count, detectedChips };
  }

  executeMask() {
    if (!this.editor) return;
    const raw = this.editor.value;
    const result = this.detectAndMask(raw);
    this.isMasked = true;

    if (this.statusVal) {
      this.statusVal.textContent = 'PROTECTED';
      this.statusVal.style.color = 'var(--accent-sage)';
    }
    if (this.countVal) {
      this.countVal.textContent = `${result.count} SECRETS`;
    }
    if (this.astVal) {
      this.astVal.textContent = 'VALID SYNTAX';
    }

    // Render highlighted preview
    if (this.preview) {
      const escaped = this.escapeHtml(result.masked);
      const highlighted = escaped.replace(/__CODEMASK_[A-Z0-9_]+__/g, (t) => {
        return `<span class="cm-token-hl">${t}</span>`;
      });
      this.preview.innerHTML = highlighted;
    }

    // Render vault chips
    if (this.chipsList) {
      if (result.detectedChips.length === 0) {
        this.chipsList.innerHTML = `<span class="cm-chip">NO SECRETS DETECTED</span>`;
      } else {
        this.chipsList.innerHTML = result.detectedChips
          .map((c) => `<span class="cm-chip masked">${c.type} -> ${c.token}</span>`)
          .join('');
      }
    }
  }

  executeUnmask() {
    if (!this.editor || !this.preview) return;
    const raw = this.editor.value;
    this.isMasked = false;

    if (this.statusVal) {
      this.statusVal.textContent = 'ORIGINAL RESTORED';
      this.statusVal.style.color = 'var(--accent-saffron)';
    }

    this.preview.textContent = raw;

    if (this.chipsList) {
      this.chipsList.innerHTML = `<span class="cm-chip">ORIGINAL STATE LOADED (UNMASKED)</span>`;
    }
  }

  updatePreviewRaw() {
    if (!this.preview || !this.editor) return;
    this.preview.textContent = this.editor.value;
    if (this.statusVal) {
      this.statusVal.textContent = 'MODIFIED (UNMASKED)';
      this.statusVal.style.color = 'var(--text-muted)';
    }
  }

  copyPromptSafe() {
    if (!this.preview) return;
    const textToCopy = this.preview.innerText || this.preview.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      sound.click();
      if (this.toast) {
        this.toast.classList.add('show');
        setTimeout(() => this.toast.classList.remove('show'), 1600);
      }
    });
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/* ============================================================
   2. PORTWARDEN SENTINEL TERMINAL
   ============================================================ */
export class PortwardenWorkbench {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.screen = this.container.querySelector('.pw-term-screen');
    this.spawnBtns = this.container.querySelectorAll('.pw-spawn-btn');
    this.freeAllBtn = this.container.querySelector('.pw-free-all-btn');

    this.statusVal = this.container.querySelector('.pw-telemetry-status');
    this.countVal = this.container.querySelector('.pw-telemetry-count');

    this.activeZombies = [
      { port: 3000, pid: 14280, name: 'node.exe (vite dev server)', memory: '184 MB' },
      { port: 5432, pid: 8912, name: 'postgres.exe (zombie daemon)', memory: '42 MB' },
      { port: 8080, pid: 21904, name: 'python.exe (http.server)', memory: '28 MB' }
    ];

    this.init();
  }

  init() {
    this.renderScreen();
    this.updateTelemetry();

    this.spawnBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const port = parseInt(btn.dataset.port, 10);
        this.spawnZombie(port);
        sound.click();
      });
    });

    if (this.freeAllBtn) {
      this.freeAllBtn.addEventListener('click', () => {
        this.killAll();
        sound.chirp(420, 0.08);
      });
    }
  }

  spawnZombie(port) {
    const exists = this.activeZombies.some((z) => z.port === port);
    if (exists) {
      this.appendLine(`[portwarden] Port ${port} is already bound by active process.`);
      return;
    }

    const pid = Math.floor(10000 + Math.random() * 20000);
    const names = { 3000: 'node.exe (dev server)', 5432: 'postgres.exe', 8080: 'vite.exe' };
    const name = names[port] || 'zombie-proc.exe';

    this.activeZombies.push({ port, pid, name, memory: '64 MB' });
    this.appendLine(`[portwarden] SPAWNED process PID ${pid} listening on :${port}`);
    this.updateTelemetry();
  }

  killAll() {
    const count = this.activeZombies.length;
    if (count === 0) {
      this.appendLine(`[portwarden] No zombie processes detected.`);
      return;
    }

    this.activeZombies = [];
    this.appendLine(`[portwarden] SIGKILL dispatched to ${count} zombie process(es). All ports released.`);
    this.updateTelemetry();
  }

  updateTelemetry() {
    if (this.countVal) {
      this.countVal.textContent = `${this.activeZombies.length} PROCESSES`;
    }
    if (this.statusVal) {
      if (this.activeZombies.length === 0) {
        this.statusVal.textContent = 'ALL PORTS CLEAR';
        this.statusVal.style.color = 'var(--accent-sage)';
      } else {
        this.statusVal.textContent = 'ZOMBIES DETECTED';
        this.statusVal.style.color = 'var(--accent-terracotta)';
      }
    }
  }

  renderScreen() {
    if (!this.screen) return;
    this.screen.innerHTML = '';
    this.appendLine(`portwarden v1.4.0: Cross-Platform Socket Collision Sentinel`);
    this.appendLine(`Querying local network socket table (TCP LISTEN)...`);
    this.appendLine(``);
    this.activeZombies.forEach((z) => {
      this.appendLine(`  PORT :${z.port}  PID ${z.pid}  ${z.name}  (${z.memory})`);
    });
    this.appendLine(``);
    this.appendLine(`Run 'npx portwarden free <port>' or use the buttons below.`);
  }

  appendLine(text) {
    if (!this.screen) return;
    const div = document.createElement('div');
    div.className = 'pw-term-line';
    div.textContent = text;
    this.screen.appendChild(div);
    this.screen.scrollTop = this.screen.scrollHeight;
  }
}

/* ============================================================
   3. SLOP-LENS STYLOMETRICS & PROSE LINTER WORKBENCH
   ============================================================ */
export class SlopLensWorkbench {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.textarea = this.container.querySelector('.sl-input-textarea');
    this.sampleSelect = this.container.querySelector('.sl-sample-select');
    this.analyzeBtn = this.container.querySelector('.sl-analyze-btn');
    this.barcodeStrip = this.container.querySelector('.sl-barcode-strip');

    this.burstinessVal = this.container.querySelector('.sl-burstiness-val');
    this.clicheVal = this.container.querySelector('.sl-cliche-val');
    this.scoreVal = this.container.querySelector('.sl-score-val');

    this.clicheDictionary = [
      'delve', 'delving', 'tapestry', 'testament', 'crucial', 'pivotal',
      'furthermore', 'holistic', 'beacon', 'unleash', 'foster', 'realm',
      'merupakan', 'menyelami', 'lanskap', 'fondasi', 'komprehensif', 'ekosistem'
    ];

    this.samples = {
      authentic: `We built portwarden after losing three hours to a zombie Vite process that refused to release port 3000. It queries the local socket table, inspects the PID, and sends a verified SIGKILL. No external npm packages. It just solves the problem.`,
      slop: `Delving into the multifaceted realm of modern web development, it is crucial to recognize how innovation fosters holistic ecosystems. This comprehensive tapestry serves as a pivotal testament to seamless digital synergy.`,
      'id-slop': `Menyelami lanskap teknologi masa kini, merupakan hal yang sangat krusial untuk membangun fondasi yang komprehensif. Ekosistem ini menjadi bukti nyata inovasi holistik.`,
      'id-authentic': `WargaOS kami rancang untuk memecahkan urusan warga sehari-hari: cetak surat RT/RW format A4 standar, hitung sisa token PLN tanpa kalkulator ribet, dan cek aturan kependudukan biar gak kena pungli.`
    };

    this.init();
  }

  init() {
    if (this.textarea) {
      this.textarea.value = this.samples.authentic;
      this.textarea.addEventListener('input', () => this.analyze());
    }

    if (this.sampleSelect) {
      this.sampleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (this.samples[val] && this.textarea) {
          this.textarea.value = this.samples[val];
          sound.click();
          this.analyze();
        }
      });
    }

    if (this.analyzeBtn) {
      this.analyzeBtn.addEventListener('click', () => {
        this.analyze();
        sound.chirp(640, 0.05);
      });
    }

    this.analyze();
  }

  analyze() {
    if (!this.textarea) return;
    const text = this.textarea.value.trim();
    if (!text) {
      if (this.burstinessVal) this.burstinessVal.textContent = '0.00';
      if (this.clicheVal) this.clicheVal.textContent = '0 DETECTED';
      if (this.scoreVal) this.scoreVal.textContent = 'N/A';
      if (this.barcodeStrip) this.barcodeStrip.innerHTML = '';
      return;
    }

    // Parse sentences
    const clean = text.replace(/[\r\n]+/g, ' ').trim();
    const rawSentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) || [clean];
    const sentences = rawSentences
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && /[A-Za-z0-9]/.test(s));

    const wordCounts = sentences.map((s) => (s.match(/\b[\w'-]+\b/g) || []).length);

    // Compute sentence burstiness variance (standard deviation)
    let avg = 0;
    if (wordCounts.length > 0) {
      avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    }
    const variance =
      wordCounts.length > 1
        ? wordCounts.reduce((acc, len) => acc + Math.pow(len - avg, 2), 0) / wordCounts.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const burstiness = avg > 0 ? (stdDev / avg).toFixed(2) : '0.00';

    // Cliche detection
    const words = (text.match(/\b[A-Za-z0-9_-]+\b/g) || []).map((w) => w.toLowerCase());
    const detectedCliches = words.filter((w) => this.clicheDictionary.includes(w));

    // Slop risk score calculation
    let slopRisk = 0;
    if (detectedCliches.length > 0) {
      slopRisk += detectedCliches.length * 28;
    }
    if (parseFloat(burstiness) < 0.25 && sentences.length >= 2) {
      slopRisk += 35; // Monotone sentence penalty
    }
    slopRisk = Math.min(100, Math.max(0, slopRisk));

    // Update Telemetry
    if (this.burstinessVal) {
      this.burstinessVal.textContent = burstiness;
    }

    if (this.clicheVal) {
      if (detectedCliches.length === 0) {
        this.clicheVal.textContent = '0 DETECTED';
        this.clicheVal.style.color = 'var(--accent-sage)';
      } else {
        this.clicheVal.textContent = `${detectedCliches.length} DETECTED (${detectedCliches.slice(0, 2).join(', ')})`;
        this.clicheVal.style.color = 'var(--accent-terracotta)';
      }
    }

    if (this.scoreVal) {
      if (slopRisk < 20) {
        this.scoreVal.textContent = `AUTHENTIC (${slopRisk}%)`;
        this.scoreVal.style.color = 'var(--accent-sage)';
      } else if (slopRisk < 50) {
        this.scoreVal.textContent = `MODERATE (${slopRisk}%)`;
        this.scoreVal.style.color = 'var(--accent-saffron)';
      } else {
        this.scoreVal.textContent = `HIGH SLOP (${slopRisk}%)`;
        this.scoreVal.style.color = 'var(--accent-terracotta)';
      }
    }

    // Render sentence rhythm barcode
    if (this.barcodeStrip) {
      this.barcodeStrip.innerHTML = '';
      const maxLen = Math.max(...wordCounts, 1);
      wordCounts.forEach((len) => {
        const bar = document.createElement('div');
        bar.className = 'sl-barcode-bar';
        const heightPct = Math.max(15, Math.round((len / maxLen) * 100));
        bar.style.height = `${heightPct}%`;
        bar.title = `${len} words`;

        if (slopRisk > 50) {
          bar.classList.add('monotone');
        } else if (slopRisk > 20) {
          bar.classList.add('dynamic');
        } else {
          bar.classList.add('organic');
        }

        this.barcodeStrip.appendChild(bar);
      });
    }
  }
}
