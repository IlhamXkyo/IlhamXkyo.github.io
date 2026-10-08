/**
 * KyoTerm: Integrated Interactive Developer Shell
 * Provides full UNIX-style command environment with tab completion and project inspection.
 */

import { DEVELOPER_PROFILE, REPOSITORIES } from './data.js';
import { sound } from './audio.js';

export class KyoTerminal {
  constructor(containerId, onOpenInspector) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.output = this.container.querySelector('.term-output');
    this.input = this.container.querySelector('.term-input');
    this.closeBtn = this.container.querySelector('.term-close-btn');
    this.onOpenInspector = onOpenInspector;

    this.history = [];
    this.historyIndex = -1;

    this.commands = [
      'help', 'repos', 'inspect', 'cat', 'whoami', 'bio', 'skills',
      'manifesto', 'stats', 'clear', 'audio', 'contact', 'exit'
    ];

    this.init();
  }

  init() {
    this.printWelcome();

    if (this.input) {
      this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Command event delegation for clickable repo links in terminal output
    if (this.output) {
      this.output.addEventListener('click', (e) => {
        const target = e.target.closest('[data-repo]');
        if (target && this.onOpenInspector) {
          sound.click();
          this.onOpenInspector(target.dataset.repo);
        }
      });
    }

    // Hotkey toggle: Ctrl + ~ or F2
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === '`') || (e.ctrlKey && e.key === '~') || e.key === 'F2') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.container.classList.contains('active');
  }

  open() {
    this.container.classList.add('active');
    sound.chirp(700, 0.08);
    setTimeout(() => {
      if (this.input) this.input.focus();
    }, 100);
  }

  close() {
    this.container.classList.remove('active');
    sound.click();
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  printWelcome() {
    this.log(`\x1b[36m╔════════════════════════════════════════════════════════════╗\x1b[0m`);
    this.log(`\x1b[36m║  KyoTerm v2.4.0 (x86_64-pc-none-elf)                       ║\x1b[0m`);
    this.log(`\x1b[36m║  Developer Workstation of IlhamXkyo (Jakarta, UTC+7)       ║\x1b[0m`);
    this.log(`\x1b[36m╚════════════════════════════════════════════════════════════╝\x1b[0m`);
    this.log(`Type \x1b[33m'help'\x1b[0m for available commands, or \x1b[33m'repos'\x1b[0m (or 'ls') to list projects.`);
    this.log(`Click any highlighted repository in output to launch its CAD datasheet.`);
    this.log(``);
  }

  handleKeyDown(e) {
    sound.terminalTick();

    if (e.key === 'Enter') {
      const val = this.input.value.trim();
      this.execute(val);
      if (val) {
        this.history.push(val);
        this.historyIndex = this.history.length;
      }
      this.input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.handleTabComplete();
    }
  }

  handleTabComplete() {
    const val = this.input.value.trim();
    const parts = val.split(/\s+/);
    const prefix = parts[0].toLowerCase();

    if (parts.length === 1) {
      const match = this.commands.filter(c => c.toLowerCase().startsWith(prefix));
      if (match.length === 1) {
        this.input.value = match[0] + ' ';
      } else if (match.length > 1) {
        this.log(`\x1b[33mSuggestions: ${match.join('  ')}\x1b[0m`);
      }
    } else if (parts[0].toLowerCase() === 'inspect' || parts[0].toLowerCase() === 'cat') {
      const repoPrefix = (parts[1] || '').toLowerCase();
      const repoMatches = REPOSITORIES
        .map(r => r.name)
        .filter(n => n.toLowerCase().startsWith(repoPrefix));
      if (repoMatches.length === 1) {
        this.input.value = `${parts[0]} ${repoMatches[0]}`;
      } else if (repoMatches.length > 1) {
        this.log(`\x1b[33mRepos: ${repoMatches.join('  ')}\x1b[0m`);
      }
    }
  }

  execute(raw) {
    if (!raw) {
      this.log(`ilham@workstation:~$ `);
      return;
    }

    this.log(`\x1b[32milham@workstation:~$\x1b[0m ${raw}`);
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        this.log(`Available commands:`);
        this.log(`  \x1b[33mrepos\x1b[0m / \x1b[33mls\x1b[0m        List all 25 public GitHub repositories`);
        this.log(`  \x1b[33minspect <name>\x1b[0m   Open deep CAD architectural datasheet for a project`);
        this.log(`  \x1b[33mcat <name>\x1b[0m       Print project technical summary right in terminal`);
        this.log(`  \x1b[33mwhoami\x1b[0m / \x1b[33mbio\x1b[0m    Author background and practical craft`);
        this.log(`  \x1b[33mskills\x1b[0m           Core competencies (CLI, UI, Node, Python, NLP)`);
        this.log(`  \x1b[33mmanifesto\x1b[0m        Anti-Slop engineering standards and principles`);
        this.log(`  \x1b[33mstats\x1b[0m / \x1b[33mtop\x1b[0m      GitHub portfolio metrics and telemetry`);
        this.log(`  \x1b[33maudio <on|off>\x1b[0m   Toggle procedural Web Audio synthesis`);
        this.log(`  \x1b[33mcontact\x1b[0m          Developer email, GitHub link & credentials`);
        this.log(`  \x1b[33muname\x1b[0m            System architecture telemetry`);
        this.log(`  \x1b[33mdate\x1b[0m             Current Jakarta WIB time`);
        this.log(`  \x1b[33mclear\x1b[0m / \x1b[33mcls\x1b[0m      Clear the terminal screen`);
        this.log(`  \x1b[33mexit\x1b[0m             Close terminal drawer`);
        break;

      case 'ls':
      case 'dir':
      case 'repos':
        this.log(`\x1b[1mILHAMXKYO REPOSITORY MATRIX (25 TOTAL - CLICK TO INSPECT):\x1b[0m`);
        this.log(`NAME                       LANG         CATEGORY     TAGLINE`);
        this.log(`--------------------------------------------------------------------------------`);
        REPOSITORIES.forEach(r => {
          const name = r.name.padEnd(26);
          const lang = (r.language || 'N/A').padEnd(12);
          const cat = r.category.padEnd(12);
          this.log(`<span data-repo="${r.id}" style="color:var(--accent-terracotta);cursor:pointer;text-decoration:underline;font-weight:600;">${name}</span> ${lang} ${cat} ${r.tagline}`);
        });
        this.log(`\nClick any repository name above or type \x1b[33minspect <name>\x1b[0m.`);
        break;

      case 'uname':
        this.log(`Linux workstation-kyo 6.8.0-generic x86_64 GNU/Linux (Vanilla ES Standards)`);
        break;

      case 'date': {
        const now = new Date();
        const options = { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        this.log(`${now.toLocaleString('en-US', options)} (UTC+7 / WIB)`);
        break;
      }

      case 'echo':
        this.log(arg || '');
        break;

      case 'sudo':
        this.log(`\x1b[32m[✓] ilham is already in the sudoers file. Permission granted.\x1b[0m`);
        if (arg) {
          this.execute(arg);
        }
        break;

      case 'inspect':
      case 'cat':
        if (!arg) {
          this.log(`\x1b[31mError: Missing repository name. e.g. 'inspect aeroflow-lab'\x1b[0m`);
          return;
        }
        const repo = REPOSITORIES.find(r => r.name.toLowerCase() === arg.toLowerCase() || r.id === arg.toLowerCase());
        if (!repo) {
          this.log(`\x1b[31mError: Repository '${arg}' not found. Type 'repos' to list.\x1b[0m`);
          return;
        }

        if (cmd === 'inspect' && this.onOpenInspector) {
          this.log(`\x1b[32m[✓] Launching CAD Datasheet Drawer for ${repo.name}...\x1b[0m`);
          this.onOpenInspector(repo.id);
        } else {
          this.log(`\x1b[1;36m[PROJECT: ${repo.name}]\x1b[0m`);
          this.log(`  Category:     ${repo.category.toUpperCase()}`);
          this.log(`  Language:     ${repo.language}`);
          this.log(`  Tagline:      ${repo.tagline}`);
          this.log(`  Description:  ${repo.description}`);
          this.log(`  Architecture: ${repo.architecture}`);
          this.log(`  CLI Command:  \x1b[33m${repo.cliSnippet}\x1b[0m`);
          this.log(`  GitHub:       \x1b[4;34m${repo.githubUrl}\x1b[0m`);
          if (repo.liveUrl) this.log(`  Live URL:     \x1b[4;32m${repo.liveUrl}\x1b[0m`);
        }
        break;

      case 'whoami':
      case 'bio':
        this.log(`\x1b[1m${DEVELOPER_PROFILE.name} (${DEVELOPER_PROFILE.handle})\x1b[0m`);
        this.log(`Role:      ${DEVELOPER_PROFILE.title}`);
        this.log(`Location:  ${DEVELOPER_PROFILE.location}`);
        this.log(`GitHub:    ${DEVELOPER_PROFILE.github}`);
        this.log(`Email:     ${DEVELOPER_PROFILE.email}`);
        this.log(`\nBio: ${DEVELOPER_PROFILE.bio}`);
        break;

      case 'skills':
        this.log(`\x1b[1mENGINEERING CAPABILITIES:\x1b[0m`);
        DEVELOPER_PROFILE.skills.forEach(cat => {
          this.log(`\x1b[33m[${cat.category}]\x1b[0m`);
          cat.items.forEach(item => this.log(`  • ${item}`));
        });
        break;

      case 'manifesto':
        this.log(`\x1b[1;32mTHE ANTI-SLOP ENGINEERING MANIFESTO:\x1b[0m`);
        this.log(`1. \x1b[1mPragmatism over Premature Abstraction:\x1b[0m Never build 5 layers of generic factories for a feature used in one place. Direct, readable code wins.`);
        this.log(`2. \x1b[1mZero-Mock Production Integrity:\x1b[0m Never leave fake stubs, unhandled promises, or dummy mocks in production execution paths.`);
        this.log(`3. \x1b[1mZero Narrative Comment Slop:\x1b[0m Code comments explain 'WHY' and non-intuitive constraints, never narrating what the syntax already shows.`);
        this.log(`4. \x1b[1mCivic & Tactile Impact:\x1b[0m Build real software that solves real headaches for everyday citizens and developers.`);
        break;

      case 'top':
      case 'ps':
      case 'stats':
        this.log(`\x1b[1mPORTFOLIO TELEMETRY & WORKSTATION PROCESSES:\x1b[0m`);
        this.log(`  Public Repositories:      ${DEVELOPER_PROFILE.stats.totalRepos}`);
        this.log(`  Developer Tools & CLI:    ${DEVELOPER_PROFILE.stats.devTools}`);
        this.log(`  Civic Tech & Utilities:   ${DEVELOPER_PROFILE.stats.civicApps}`);
        this.log(`  Quant & Applied AI:       ${DEVELOPER_PROFILE.stats.quantAndAI}`);
        this.log(`  NLP & Stylometrics:       ${DEVELOPER_PROFILE.stats.nlpAndProse}`);
        this.log(`  Anti-Slop Adherence:      ${DEVELOPER_PROFILE.stats.antiSlopRate}`);
        break;

      case 'audio':
        if (arg === 'on') {
          if (!sound.isEnabled()) sound.toggle();
          this.log(`\x1b[32m[✓] Procedural Web Audio synthesizer enabled.\x1b[0m`);
        } else if (arg === 'off') {
          if (sound.isEnabled()) sound.toggle();
          this.log(`\x1b[33m[✓] Procedural Web Audio synthesizer muted.\x1b[0m`);
        } else {
          const current = sound.toggle();
          this.log(`\x1b[32mAudio synthesizer is now: ${current ? 'ON' : 'MUTED'}\x1b[0m`);
        }
        break;

      case 'contact':
        this.log(`\x1b[1mCONTACT & CONNECTIVITY:\x1b[0m`);
        this.log(`  Email:    \x1b[33m${DEVELOPER_PROFILE.email}\x1b[0m`);
        this.log(`  GitHub:   \x1b[36m${DEVELOPER_PROFILE.github}\x1b[0m`);
        this.log(`  Location: Jakarta, Indonesia`);
        break;

      case 'clear':
        if (this.output) this.output.innerHTML = '';
        return;

      case 'exit':
        this.close();
        break;

      default:
        this.log(`\x1b[31mCommand not recognized: '${cmd}'. Type 'help' for options.\x1b[0m`);
    }

    this.log(``);
    this.scrollToBottom();
  }

  log(msg) {
    if (!this.output) return;
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = msg
      .replace(/\x1b\[31m/g, '<span style="color:#ef4444;">')
      .replace(/\x1b\[32m/g, '<span style="color:#10b981;">')
      .replace(/\x1b\[33m/g, '<span style="color:#f59e0b;">')
      .replace(/\x1b\[34m/g, '<span style="color:#60a5fa;">')
      .replace(/\x1b\[36m/g, '<span style="color:#38bdf8;">')
      .replace(/\x1b\[1m/g, '<span style="font-weight:bold;color:#f8fafc;">')
      .replace(/\x1b\[4m/g, '<span style="text-decoration:underline;">')
      .replace(/\x1b\[0m/g, '</span>');

    this.output.appendChild(line);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.output) this.output.scrollTop = this.output.scrollHeight;
  }
}
