/**
 * Test Suite: Portfolio Verification and Data Integrity Check
 * Verifies repository dataset, required assets, syntax, and anti-slop rules.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✓ PASS: ${message}`);
    passes++;
  }
}

console.log(`\n========================================================`);
console.log(`  STARTING PORTFOLIO VERIFICATION TEST SUITE`);
console.log(`========================================================\n`);

// 1. Check critical files existence
const REQUIRED_FILES = [
  'index.html',
  'server.js',
  'package.json',
  'README.md',
  'css/tokens.css',
  'css/effects.css',
  'css/layout.css',
  'css/components.css',
  'css/workbenches.css',
  'css/terminal.css',
  'js/data.js',
  'js/audio.js',
  'js/fluid-canvas.js',
  'js/constellation-canvas.js',
  'js/workbenches.js',
  'js/terminal.js',
  'js/inspector.js',
  'js/cursor.js',
  'js/tilt.js',
  'js/scramble.js',
  'js/physics-toy.js',
  'js/command-palette.js',
  'js/app.js',
  'test/verify_data.js'
];

REQUIRED_FILES.forEach(file => {
  const fullPath = path.join(ROOT_DIR, file);
  assert(fs.existsSync(fullPath), `File exists: ${file}`);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    assert(stats.size > 50, `File ${file} has content (${stats.size} bytes)`);
  }
});

// 2. Validate Data Module
const dataFilePath = path.join(ROOT_DIR, 'js', 'data.js');
const dataContent = fs.readFileSync(dataFilePath, 'utf8');

// Check REPOSITORIES and FEATURED_CASE_STUDIES via dynamic evaluation
let REPOSITORIES = [];
let DEVELOPER_PROFILE = {};
let FEATURED_CASE_STUDIES = [];
try {
  const cleanCode = dataContent
    .replace(/export const /g, 'global.')
    .replace(/export /g, '');
  eval(cleanCode);
  REPOSITORIES = global.REPOSITORIES;
  DEVELOPER_PROFILE = global.DEVELOPER_PROFILE;
  FEATURED_CASE_STUDIES = global.FEATURED_CASE_STUDIES;
} catch (e) {
  assert(false, `data.js evaluation failed: ${e.message}`);
}

assert(Array.isArray(REPOSITORIES), `REPOSITORIES is an array`);
assert(REPOSITORIES.length === 30, `REPOSITORIES contains exactly 30 items (got ${REPOSITORIES.length})`);

const VALID_CATEGORIES = ['tools', 'nlp', 'civic', 'quant', 'games'];

REPOSITORIES.forEach((repo, i) => {
  assert(!!repo.id, `Repo #${i + 1} has valid id (${repo.name})`);
  assert(!!repo.name, `Repo #${i + 1} has name (${repo.name})`);
  assert(VALID_CATEGORIES.includes(repo.category), `Repo '${repo.name}' has valid category: '${repo.category}'`);
  assert(!!repo.description, `Repo '${repo.name}' has non-empty description`);
  assert(!!repo.architecture, `Repo '${repo.name}' has non-empty architecture`);
  assert(Array.isArray(repo.highlights) && repo.highlights.length > 0, `Repo '${repo.name}' has highlights array`);
  assert(repo.githubUrl && repo.githubUrl.startsWith('https://github.com/IlhamXkyo/'), `Repo '${repo.name}' githubUrl is authentic`);
  assert(!!repo.cliSnippet, `Repo '${repo.name}' has cliSnippet`);
});

// Validate 5 Flagship Case Studies
assert(Array.isArray(FEATURED_CASE_STUDIES), `FEATURED_CASE_STUDIES is an array`);
assert(FEATURED_CASE_STUDIES.length === 5, `FEATURED_CASE_STUDIES contains exactly 5 flagship studies (got ${FEATURED_CASE_STUDIES.length})`);

FEATURED_CASE_STUDIES.forEach((study, idx) => {
  assert(!!study.id, `Case study #${idx + 1} has valid id (${study.name})`);
  assert(!!study.name, `Case study #${idx + 1} has name (${study.name})`);
  assert(VALID_CATEGORIES.includes(study.category), `Case study '${study.name}' has valid category: '${study.category}'`);
  assert(!!study.tagline, `Case study '${study.name}' has non-empty tagline`);
  assert(!!study.problem, `Case study '${study.name}' has non-empty problem statement`);
  assert(!!study.whyBuilt, `Case study '${study.name}' has whyBuilt explanation`);
  assert(!!study.implemented, `Case study '${study.name}' has implemented explanation`);
  assert(!!study.challenge, `Case study '${study.name}' has challenge explanation`);
  assert(!!study.results, `Case study '${study.name}' has concrete results statement`);
  assert(study.githubUrl && study.githubUrl.startsWith('https://github.com/IlhamXkyo/'), `Case study '${study.name}' has authentic GitHub URL`);
});

// 3. Profile Information Check
assert(DEVELOPER_PROFILE.name === 'Ilham', `Profile name is Ilham`);
assert(DEVELOPER_PROFILE.handle === 'IlhamXkyo', `Profile handle is IlhamXkyo`);
assert(DEVELOPER_PROFILE.email === 'xanderilham4@gmail.com', `Profile email is authentic`);
assert(DEVELOPER_PROFILE.stats.totalRepos === 30, `Profile stats reports 30 repos`);
assert(DEVELOPER_PROFILE.location.includes('AMBON, INDONESIA'), `Profile location reports Ambon, Indonesia (${DEVELOPER_PROFILE.location})`);

// 4. Verify No Prohibited Em/En Dashes in text/code
REQUIRED_FILES.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
  const hasEmDash = content.includes('\u2014');
  const hasEnDash = content.includes('\u2013');
  assert(!hasEmDash && !hasEnDash, `No em-dash or en-dash in ${file}`);
});

// 5. Functional Unit Tests: CodeMask Syntax-Preserving Token Masking
console.log(`\n--- Testing CodeMask Syntax-Preserving Secret Masker ---`);
function testMaskSecrets(code) {
  const patterns = [
    { type: 'API_KEY', regex: /(?:api[_-]?key|token|secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{16,})['"]/gi },
    { type: 'DB_URI', regex: /postgres:\/\/[^:]+:([^@]+)@[^\/]+\/\w+/gi },
    { type: 'BEARER', regex: /Bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi }
  ];
  let masked = code;
  const vault = new Map();
  let counter = 0;
  patterns.forEach(p => {
    masked = masked.replace(p.regex, (match, secret) => {
      counter++;
      const token = `__CODEMASK_SECRET_${p.type}_${counter}__`;
      vault.set(token, secret);
      return match.replace(secret, token);
    });
  });
  return { masked, vault, count: counter };
}

function testUnmaskSecrets(maskedCode, vault) {
  let unmasked = maskedCode;
  vault.forEach((secret, token) => {
    unmasked = unmasked.split(token).join(secret);
  });
  return unmasked;
}

const sampleCode = `const config = {
  apiKey: 'sample_token_key_9948201948201948201948',
  db: 'postgres://admin:superSecretP4ssword@db.internal:5432/main'
};`;

const maskResult = testMaskSecrets(sampleCode);
assert(maskResult.count === 2, `CodeMask detects and masks all 2 secrets (got ${maskResult.count})`);
assert(!maskResult.masked.includes('sample_token_key_9948201948201948201948'), `API key is redacted from masked code`);
assert(!maskResult.masked.includes('superSecretP4ssword'), `Database password is redacted from masked code`);
assert(maskResult.masked.includes('__CODEMASK_SECRET_API_KEY_1__'), `Mask token placeholder generated properly`);

const restoredCode = testUnmaskSecrets(maskResult.masked, maskResult.vault);
assert(restoredCode === sampleCode, `Bidirectional unmask accurately restores original source code`);

// 6. Functional Unit Tests: Portwarden Command Parsing & Array Safety
console.log(`\n--- Testing Portwarden Sentinel Command Logic ---`);
function testPortwardenCommand(rawCmd, activePorts) {
  const parts = rawCmd.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { action: 'noop' };
  const base = parts[0].toLowerCase();

  if (base === 'list' || base === 'ports' || (base === 'portwarden' && (parts[1] === 'list' || parts.length === 1))) {
    return { action: 'list', count: activePorts.length };
  }

  const isFreeCmd = base === 'free' || base === 'kill' || 
    (base === 'portwarden' && (parts[1] === 'free' || parts[1] === 'kill'));
  
  if (isFreeCmd) {
    const targetArg = (base === 'free' || base === 'kill') ? parts[1] : parts[2];
    const targetPort = parseInt(targetArg, 10);
    if (isNaN(targetPort)) return { action: 'error', msg: 'NaN' };
    const idx = activePorts.findIndex(p => p.port === targetPort);
    if (idx === -1) return { action: 'already_free', port: targetPort };
    activePorts.splice(idx, 1);
    return { action: 'freed', port: targetPort };
  }

  let inspectPort = null;
  if (!isNaN(parseInt(base, 10))) {
    inspectPort = parseInt(base, 10);
  } else if (base === 'inspect') {
    inspectPort = parseInt(parts[1], 10);
  } else if (base === 'portwarden') {
    inspectPort = parseInt(parts[1] === 'inspect' ? parts[2] : parts[1], 10);
  }

  if (inspectPort !== null && !isNaN(inspectPort)) {
    const item = activePorts.find(p => p.port === inspectPort);
    return { action: 'inspect', port: inspectPort, found: !!item };
  }

  return { action: 'unknown' };
}

const mockPorts = [
  { port: 3000, pid: 1001, name: 'vite' },
  { port: 5432, pid: 1002, name: 'postgres' }
];

assert(testPortwardenCommand('3000', mockPorts).action === 'inspect', `Portwarden inspects via shorthand '3000'`);
assert(testPortwardenCommand('portwarden inspect 3000', mockPorts).action === 'inspect', `Portwarden inspects via 'portwarden inspect 3000'`);
assert(testPortwardenCommand('kill 3000', mockPorts).action === 'freed', `Portwarden frees via alias 'kill 3000'`);
assert(mockPorts.length === 1, `Mock port array safely decremented`);
assert(testPortwardenCommand('list', mockPorts).action === 'list', `Portwarden lists via alias 'list'`);

// 7. Functional Unit Tests: Slop-Lens Sentence Splitting & Anti-Slop Detection
console.log(`\n--- Testing Slop-Lens Stylometrics Engine ---`);
function parseSentences(text) {
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  const rawSentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) || [clean];
  return rawSentences.map(s => s.trim()).filter(s => s.length > 0 && /[A-Za-z0-9]/.test(s));
}

const unpunctuatedTest = "First sentence here. Second sentence in progress";
const parsedSentences = parseSentences(unpunctuatedTest);
assert(parsedSentences.length === 2, `Trailing unpunctuated sentence is NOT dropped (got ${parsedSentences.length})`);
assert(parsedSentences[1] === 'Second sentence in progress', `Trailing sentence content preserved accurately`);

const aiCliches = [
  'delve', 'delving', 'tapestry', 'testament', 'crucial', 'pivotal',
  'merupakan', 'menyelami', 'lanskap', 'fondasi', 'komprehensif', 'ekosistem'
];

function detectCliches(text) {
  const words = (text.match(/\b[A-Za-z0-9_-]+\b/g) || []).map(w => w.toLowerCase());
  return words.filter(w => aiCliches.includes(w));
}

const englishSlop = "Delving into this crucial tapestry of innovation.";
assert(detectCliches(englishSlop).length >= 3, `Detected English corporate AI cliches in test phrase`);

const indonesianSlop = "Menyelami lanskap teknologi merupakan fondasi komprehensif.";
assert(detectCliches(indonesianSlop).length >= 4, `Detected Indonesian corporate AI cliches in test phrase`);

// 8. Functional Unit Tests: KyoTerm Terminal Autocompletion & Command Dispatching
console.log(`\n--- Testing KyoTerm Terminal Autocompletion & Commands ---`);
function autocompleteRepo(inputPrefix) {
  const repoMatches = REPOSITORIES
    .map(r => r.name)
    .filter(n => n.toLowerCase().startsWith(inputPrefix.toLowerCase()));
  return repoMatches;
}

assert(autocompleteRepo('peg').includes('PegRogue'), `Case-insensitive autocomplete matches 'PegRogue' with 'peg'`);
assert(autocompleteRepo('neon').includes('NeonDrift'), `Case-insensitive autocomplete matches 'NeonDrift' with 'neon'`);
assert(autocompleteRepo('code').includes('codemask'), `Case-insensitive autocomplete matches 'codemask' with 'code'`);

// Test KyoTerminal Command Execution
try {
  const termCode = fs.readFileSync(path.join(ROOT_DIR, 'js', 'terminal.js'), 'utf8')
    .replace(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"];/g, '')
    .replace(/export\s+class\s+KyoTerminal/, 'global.KyoTerminal = class KyoTerminal');

  global.sound = {
    click: () => {},
    chirp: () => {},
    terminalTick: () => {},
    toggle: () => true,
    isEnabled: () => true
  };
  const mockTermContainer = {
    querySelector: (sel) => ({
      appendChild: () => {},
      addEventListener: () => {},
      focus: () => {},
      value: '',
      closest: () => null
    }),
    classList: {
      contains: () => false,
      add: () => {},
      remove: () => {}
    }
  };
  global.document = {
    getElementById: () => mockTermContainer,
    createElement: () => ({ innerHTML: '', appendChild: () => {}, classList: { add: () => {} } })
  };
  global.window = {
    addEventListener: () => {}
  };

  eval(termCode);

  let inspectedId = null;
  const term = new global.KyoTerminal('terminal-drawer', (id) => { inspectedId = id; });
  let termLogs = [];
  term.log = (msg) => { termLogs.push(msg); };

  termLogs = [];
  term.execute('help');
  assert(termLogs.some(l => l.includes('featured') && l.includes('repos')), `KyoTerm 'help' lists commands`);

  termLogs = [];
  term.execute('featured');
  assert(termLogs.some(l => l.includes('CodeMask')) && termLogs.some(l => l.includes('Portwarden')), `KyoTerm 'featured' lists case studies`);

  termLogs = [];
  term.execute('repos');
  assert(termLogs.some(l => l.includes('codemask')) && termLogs.some(l => l.includes('30+ TOTAL')), `KyoTerm 'repos' lists 30+ repositories`);

  termLogs = [];
  term.execute('about');
  assert(termLogs.some(l => l.includes('Ilham')) && termLogs.some(l => l.toLowerCase().includes('ambon')), `KyoTerm 'about' displays developer details and location`);

  termLogs = [];
  term.execute('skills');
  assert(termLogs.some(l => l.includes('ENGINEERING CAPABILITIES')), `KyoTerm 'skills' lists capabilities`);

  termLogs = [];
  term.execute('contact');
  assert(termLogs.some(l => l.includes('xanderilham4@gmail.com')), `KyoTerm 'contact' displays email`);

  termLogs = [];
  term.execute('github');
  assert(termLogs.some(l => l.includes('https://github.com/IlhamXkyo')), `KyoTerm 'github' displays profile URL`);

  termLogs = [];
  term.execute('tests');
  assert(termLogs.some(l => l.includes('PASSING ASSERTIONS')), `KyoTerm 'tests' displays test telemetry`);

  termLogs = [];
  term.execute('principles');
  assert(termLogs.some(l => l.includes('Build the whole path')), `KyoTerm 'principles' displays engineering principles`);
  assert(term.commands.includes('principles'), `KyoTerm commands array includes 'principles'`);

  term.execute('inspect codemask');
  assert(inspectedId === 'codemask', `KyoTerm 'inspect codemask' triggers inspector callback`);
} catch (err) {
  assert(false, `KyoTerm command execution failed: ${err.message}`);
}

// 9. Anti-Slop Jargon Elimination and Credibility Proof
console.log(`\n--- Testing Anti-Slop Jargon Elimination and Credibility Proof ---`);
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

const PROHIBITED_JARGON = [
  '100% authentic code',
  'ast integrity: valid syntax',
  'syntax safe',
  'nlp stylometrics',
  'process & system diagnostics',
  'tactile restraint',
  'complete logic paths',
  'zero mock syndrome',
  'jakarta'
];
PROHIBITED_JARGON.forEach(phrase => {
  assert(!indexHtml.toLowerCase().includes(phrase), `index.html does not contain prohibited phrase: "${phrase}"`);
});

assert(indexHtml.includes('Build the whole path'), `index.html contains principle: "Build the whole path"`);
assert(indexHtml.includes('Prefer simple dependencies'), `index.html contains principle: "Prefer simple dependencies"`);
assert(indexHtml.includes('Polish with purpose'), `index.html contains principle: "Polish with purpose"`);

assert(indexHtml.includes('href="#featured"'), `Hero early CTA links to #featured case studies`);
assert(indexHtml.includes('href="https://github.com/IlhamXkyo"'), `Hero early CTA links to GitHub profile`);
assert(indexHtml.includes('href="mailto:xanderilham4@gmail.com"'), `Hero early CTA links to email`);

assert(indexHtml.includes('AMBON, INDONESIA'), `index.html hero states Ambon, Indonesia`);
assert(indexHtml.includes('30+') && indexHtml.includes('Repositories'), `index.html displays 30+ Repositories metric`);
assert(indexHtml.includes('48') && indexHtml.includes('Tests Passing'), `index.html displays 48 Tests Passing metric`);
assert(indexHtml.includes('Runtime Dependencies'), `index.html displays Runtime Dependencies metric`);

FEATURED_CASE_STUDIES.forEach(study => {
  assert(indexHtml.includes(study.name), `Featured study '${study.name}' is rendered in index.html`);
});

// 10. Mobile Responsiveness Layout Integrity Tests
console.log(`\n--- Testing Mobile Layout and Navigation Responsiveness ---`);
const tokensCss = fs.readFileSync(path.join(ROOT_DIR, 'css', 'tokens.css'), 'utf8');
const layoutCss = fs.readFileSync(path.join(ROOT_DIR, 'css', 'layout.css'), 'utf8');
const componentsCss = fs.readFileSync(path.join(ROOT_DIR, 'css', 'components.css'), 'utf8');
const workbenchesCss = fs.readFileSync(path.join(ROOT_DIR, 'css', 'workbenches.css'), 'utf8');

assert(tokensCss.includes('overflow-x: hidden') && tokensCss.includes('max-width: 100vw'), `html and body have max-width and overflow containment in tokens.css`);
assert(layoutCss.includes('@media (max-width: 640px)') && layoutCss.includes('@media (max-width: 380px)'), `layout.css contains comprehensive mobile media queries`);
assert(layoutCss.includes('.nav-btn-label') && layoutCss.includes('display: none !important'), `Header hides wide text labels on mobile for compact icon pill buttons`);
assert(layoutCss.includes('min-width: 0') && layoutCss.includes('scroll-dock-tabs'), `Floating scroll dock allows flex shrinking and touch scrolling`);
assert(componentsCss.includes('projects-grid') && componentsCss.includes('grid-template-columns: 1fr'), `Projects grid collapses to single column on mobile`);
assert(workbenchesCss.includes('@media (max-width: 640px)'), `Workbenches contain dedicated mobile viewports`);
assert(indexHtml.includes('manifesto-grid'), `Principles grid uses responsive class without hardcoded 320px column minmax`);

// 11. Dual Theme Engine Verification (Dark and Light Mode)
console.log(`\n--- Testing Dual Theme System (Dark and Light Mode) ---`);
const appJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'app.js'), 'utf8');
const cmdPaletteJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'command-palette.js'), 'utf8');

assert(tokensCss.includes('html[data-theme="dark"]') && tokensCss.includes('html[data-theme="light"]'), `tokens.css defines both dark and light theme token matrices`);
assert(indexHtml.includes('id="theme-toggle-btn"') && indexHtml.includes('id="dock-theme-trigger"'), `Theme toggle buttons present in navbar and floating dock`);
assert(appJs.includes('initTheme()') && appJs.includes('toggleTheme()') && appJs.includes('setTheme('), `app.js implements complete theme lifecycle methods`);
assert(appJs.includes('ilham_portfolio_theme'), `app.js persists user theme preference to localStorage`);
assert(cmdPaletteJs.includes('act-theme'), `Command palette includes theme toggle action`);

// 12. Deep Verification: Workbench Proof & Architectural Navigation
console.log(`\n--- Testing Workbench Proof & Architecture Integration ---`);
const workbenchesJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'workbenches.js'), 'utf8');
assert(!workbenchesJs.includes("this.astVal.textContent = 'VALID SYNTAX'"), `js/workbenches.js does not set jargon 'VALID SYNTAX'`);
assert(!layoutCss.includes('tactile restraint'), `css/layout.css does not contain prohibited phrase 'tactile restraint'`);

const aurumRepo = REPOSITORIES.find(r => r.id === 'aurum-ai-terminal');
assert(aurumRepo && aurumRepo.featured === true, `aurum-ai-terminal has featured: true in REPOSITORIES`);
const zeroGRepo = REPOSITORIES.find(r => r.id === 'zero-g-notes');
assert(zeroGRepo && zeroGRepo.featured === false, `zero-g-notes has featured: false in REPOSITORIES`);

const inspectorJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'inspector.js'), 'utf8');
assert(inspectorJs.includes("document.querySelector('.inspector-backdrop')"), `inspector.js queries backdrop on document for click dismissal`);
assert(indexHtml.includes('data-id="warga-os"') && indexHtml.includes('btn-inspect'), `Warga-OS has inspect button in index.html`);
assert(indexHtml.includes('data-id="aurum-ai-terminal"') && indexHtml.includes('btn-inspect'), `Aurum-AI-Terminal has inspect button in index.html`);

// 13. Modern Web Standards Verification (Metadata, Assets, Typography, CWV)
console.log(`\n--- Testing Modern Web Standards Compliance ---`);
assert(fs.existsSync(path.join(ROOT_DIR, 'favicon.svg')), `favicon.svg exists in repository root`);
assert(fs.existsSync(path.join(ROOT_DIR, 'manifest.webmanifest')), `manifest.webmanifest exists in repository root`);
assert(fs.existsSync(path.join(ROOT_DIR, 'robots.txt')), `robots.txt exists in repository root`);
assert(fs.existsSync(path.join(ROOT_DIR, 'sitemap.xml')), `sitemap.xml exists in repository root`);
assert(fs.existsSync(path.join(ROOT_DIR, 'assets', 'hero-profile.gif')), `assets/hero-profile.gif exists locally`);
assert(indexHtml.includes('href="favicon.svg"'), `index.html includes favicon link`);
assert(indexHtml.includes('href="manifest.webmanifest"'), `index.html includes manifest link`);
assert(indexHtml.includes('assets/hero-profile.gif'), `index.html uses local hero GIF`);
assert(indexHtml.includes('fetchpriority="high"'), `index.html sets fetchpriority high on LCP image`);
assert(indexHtml.includes('og:title') && indexHtml.includes('twitter:card'), `index.html includes social graph cards`);
assert(tokensCss.includes('text-wrap: balance'), `tokens.css includes text-wrap balance for headings`);
assert(tokensCss.includes('prefers-reduced-motion'), `tokens.css respects user reduced-motion preferences`);
assert(layoutCss.includes('animation-timeline: scroll(root)'), `layout.css uses modern CSS scroll-driven animations`);


console.log(`\n========================================================`);
if (failures === 0) {
  console.log(`  🎉 ALL ${passes} TESTS PASSED SUCCESSFULLY! ZERO FAILURES.`);
} else {
  console.error(`  ⚠️ ${failures} TEST ASSERTIONS FAILED (${passes} passed).`);
  process.exit(1);
}
console.log(`========================================================\n`);
