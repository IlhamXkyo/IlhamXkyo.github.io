/**
 * KyoTerm: Integrated Interactive Developer Shell
 * Provides full UNIX-style command environment with tab completion and project inspection.
 */

import { DEVELOPER_PROFILE, REPOSITORIES, FEATURED_CASE_STUDIES } from './data.js';
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
      'help', 'featured', 'repos', 'about', 'skills', 'contact', 'github', 'tests',
      'clear', 'inspect', 'cat', 'whoami', 'bio', 'principles', 'manifesto', 'stats', 'audio', 'exit'
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
    this.log(`\x1b[36m║  KyoTerm v2.5.0 (x86_64-pc-none-elf)                       ║\x1b[0m`);
    this.log(`\x1b[36m║  Developer Workstation of IlhamXkyo (Ambon, UTC+9)         ║\x1b[0m`);
    this.log(`\x1b[36m╚════════════════════════════════════════════════════════════╝\x1b[0m`);
    this.log(`Type \x1b[33m'help'\x1b[0m for available commands, or \x1b[33m'featured'\x1b[0m / \x1b[33m'repos'\x1b[0m to explore.`);
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
        this.log(`  \x1b[33mfeatured\x1b[0m         Flagship case studies (problem, tech stack, benchmarks)`);
        this.log(`  \x1b[33mrepos\x1b[0m / \x1b[33mls\x1b[0m        List all 30+ public GitHub repositories`);
        this.log(`  \x1b[33mabout\x1b[0m / \x1b[33mbio\x1b[0m      Developer background, location, and engineering craft`);
        this.log(`  \x1b[33mskills\x1b[0m           Core competencies (CLI, Systems, UI, Node, Python)`);
        this.log(`  \x1b[33mgithub\x1b[0m           Direct URLs to GitHub profile and featured repos`);
        this.log(`  \x1b[33mtests\x1b[0m            Automated test suite metrics (48 passing assertions)`);
        this.log(`  \x1b[33minspect <name>\x1b[0m   Open deep CAD architectural datasheet for a project`);
        this.log(`  \x1b[33mcat <name>\x1b[0m       Print project technical summary right in terminal`);
        this.log(`  \x1b[33mprinciples\x1b[0m / \x1b[33mmanifesto\x1b[0m Engineering principles and standards`);
        this.log(`  \x1b[33mstats\x1b[0m / \x1b[33mtop\x1b[0m      Repository count and category breakdown`);
        this.log(`  \x1b[33mcontact\x1b[0m          Developer email, location, and GitHub profile`);
        this.log(`  \x1b[33maudio <on|off>\x1b[0m   Toggle procedural Web Audio synthesis`);
        this.log(`  \x1b[33mclear\x1b[0m / \x1b[33mcls\x1b[0m      Clear the terminal screen`);
        this.log(`  \x1b[33mexit\x1b[0m             Close terminal drawer`);
        break;

      case 'featured':
        this.log(`\x1b[1mFLAGSHIP CASE STUDIES (TOP 5 SYSTEMS):\x1b[0m\n`);
        (FEATURED_CASE_STUDIES || []).forEach((c, idx) => {
          this.log(`\x1b[33m[0${idx + 1}] ${c.name}\x1b[0m (${c.category.toUpperCase()})`);
          this.log(`  Tagline:    ${c.tagline}`);
          this.log(`  Problem:    ${c.problem}`);
          this.log(`  Stack:      ${c.techStack}`);
          this.log(`  Challenge:  ${c.challenge}`);
          this.log(`  Results:    ${c.results}`);
          this.log(`  GitHub:     \x1b[4;34m${c.githubUrl}\x1b[0m`);
          this.log(``);
        });
        break;

      case 'github':
        this.log(`\x1b[1mAUTHENTIC GITHUB PROFILE & REPOSITORIES:\x1b[0m`);
        this.log(`  Profile URL: \x1b[4;34mhttps://github.com/IlhamXkyo\x1b[0m`);
        this.log(`\nFeatured Repositories:`);
        this.log(`  • CodeMask:          \x1b[4;34mhttps://github.com/IlhamXkyo/codemask\x1b[0m`);
        this.log(`  • Portwarden:        \x1b[4;34mhttps://github.com/IlhamXkyo/portwarden\x1b[0m`);
        this.log(`  • Slop-Lens:         \x1b[4;34mhttps://github.com/IlhamXkyo/slop-lens\x1b[0m`);
        this.log(`  • Warga-OS:          \x1b[4;34mhttps://github.com/IlhamXkyo/warga-os\x1b[0m`);
        this.log(`  • Aurum-AI-Terminal: \x1b[4;34mhttps://github.com/IlhamXkyo/aurum-ai-terminal\x1b[0m`);
        this.log(`\nAll 30+ repositories are public and open source under MIT License.`);
        break;

      case 'tests':
        this.log(`\x1b[1mAUTOMATED TEST SUITE TELEMETRY:\x1b[0m`);
        this.log(`  Status:      \x1b[32m48 PASSING ASSERTIONS (0 FAILURES)\x1b[0m`);
        this.log(`  Runner:      Node.js test/verify_data.js`);
        this.log(`  Coverage:`);
        this.log(`    • 30 Public Repository Schemas & Metadata`);
        this.log(`    • CodeMask Bidirectional Secret Token Masking & Restoration`);
        this.log(`    • Portwarden Socket Parsing, PID Inspection & Process Array Safety`);
        this.log(`    • Slop-Lens Burstiness Variance & Bilingual Cliche Heuristics`);
        this.log(`    • Terminal Autocompletion & Command Dispatching`);
        this.log(`    • Mobile Responsive Breakpoints & Dual Theme State Persistence`);
        this.log(`    • Strict Typography (Zero Prohibited Dash Characters)`);
        break;

      case 'ls':
      case 'dir':
      case 'repos':
        this.log(`\x1b[1mILHAMXKYO REPOSITORY MATRIX (30+ TOTAL - CLICK TO INSPECT):\x1b[0m`);
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
        const options = { timeZone: 'Asia/Jayapura', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        this.log(`${now.toLocaleString('en-US', options)} (UTC+9 / WIT)`);
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
      case 'about':
        this.log(`\x1b[1m${DEVELOPER_PROFILE.name} (${DEVELOPER_PROFILE.handle})\x1b[0m`);
        this.log(`Role:      ${DEVELOPER_PROFILE.title}`);
        this.log(`Headline:  ${DEVELOPER_PROFILE.headline}`);
        this.log(`Tagline:   ${DEVELOPER_PROFILE.subheadline}`);
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
      case 'principles':
        this.log(`\x1b[1;32mENGINEERING PRINCIPLES:\x1b[0m`);
        this.log(`1. \x1b[1mBuild the whole path:\x1b[0m No fake buttons, empty stubs, or demo-only logic.`);
        this.log(`2. \x1b[1mPrefer simple dependencies:\x1b[0m Use the standard library when it makes the system clearer.`);
        this.log(`3. \x1b[1mPolish with purpose:\x1b[0m Animation exists to communicate state, not decorate the screen.`);
        break;

      case 'top':
      case 'ps':
      case 'stats':
        this.log(`\x1b[1mPORTFOLIO TELEMETRY & WORKSTATION PROCESSES:\x1b[0m`);
        this.log(`  Public Repositories:      ${DEVELOPER_PROFILE.stats.totalRepos}+`);
        this.log(`  Developer Tools & CLI:    ${DEVELOPER_PROFILE.stats.devTools}`);
        this.log(`  Civic Tech & Utilities:   ${DEVELOPER_PROFILE.stats.civicApps}`);
        this.log(`  Quant & Applied AI:       ${DEVELOPER_PROFILE.stats.quantAndAI}`);
        this.log(`  NLP & Stylometrics:       ${DEVELOPER_PROFILE.stats.nlpAndProse}`);
        this.log(`  Tactile Games:            ${DEVELOPER_PROFILE.stats.games}`);
        this.log(`  Passing Automated Tests:  ${DEVELOPER_PROFILE.stats.testsPassing}`);
        this.log(`  Runtime Dependencies:     ${DEVELOPER_PROFILE.stats.runtimeDeps}`);
        this.log(`  License:                  ${DEVELOPER_PROFILE.stats.license}`);
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
        this.log(`  Location: ${DEVELOPER_PROFILE.location}`);
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
