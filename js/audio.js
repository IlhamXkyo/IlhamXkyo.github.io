/**
 * Procedural Web Audio API Sound Generator
 * Generates tactile mechanical clicks, interface acoustic feedback, and telemetry blips.
 * Zero external audio files required.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    // Enabled by default unless explicitly muted by user
    this.enabled = localStorage.getItem('kyo_audio_enabled') !== 'false';
    this.windNode = null;
    this.windGain = null;
    this.windFilter = null;
    this.windActive = false;

    // Browser audio autoplay policy: transparently unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.enabled) this.ensureContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  ensureContext() {
    if (!this.enabled) return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('kyo_audio_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.ensureContext();
      this.chirp(880, 0.08, 'sine');
    } else {
      this.stopWind();
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  // Tactile mechanical key click (narrow impulse + high bandpass)
  click() {
    if (!this.ensureContext()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Mode change chirp
  chirp(startFreq = 440, duration = 0.08, waveType = 'sine') {
    if (!this.ensureContext()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, t + duration);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // Terminal keystroke blip
  terminalTick() {
    if (!this.ensureContext()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, t);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.02);
  }

  // Zombie process killed thump
  processKill() {
    if (!this.ensureContext()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Aerodynamic wind rushing procedural noise
  startWind(initialSpeedRatio = 0.4) {
    if (!this.ensureContext() || this.windActive) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      // Pink-ish noise filter
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut * 0.95) + (white * 0.05);
        lastOut = data[i];
      }

      this.windNode = this.ctx.createBufferSource();
      this.windNode.buffer = buffer;
      this.windNode.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(200 + initialSpeedRatio * 800, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.01 + initialSpeedRatio * 0.08, this.ctx.currentTime);

      this.windNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      this.windNode.start();
      this.windActive = true;
    } catch (e) {
      // Audio autoplay policy guard
    }
  }

  setWindSpeed(speedRatio) {
    if (!this.enabled) return;
    if (!this.windActive) {
      this.startWind(speedRatio);
      return;
    }
    if (!this.windFilter || !this.windGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const clamped = Math.max(0.1, Math.min(1.0, speedRatio));
    this.windFilter.frequency.setTargetAtTime(150 + clamped * 1200, t, 0.05);
    this.windGain.gain.setTargetAtTime(0.02 + clamped * 0.1, t, 0.05);
  }

  stopWind() {
    if (!this.windActive) return;
    try {
      if (this.windNode) {
        this.windNode.stop();
        this.windNode.disconnect();
      }
    } catch (e) {}
    this.windActive = false;
  }
}

export const sound = new SoundEngine();
