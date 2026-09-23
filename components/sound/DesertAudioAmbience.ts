// Procedural Desert Ambience Synthesizer (Web Audio API)
// Synthesizes realistic desert wind gusts, weathered saloon wood creaks, and rolling stone friction
// Zero external audio files mandate.

class DesertAudioAmbience {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private isRunning: boolean = false;

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  // Wood Creak Timer
  private woodCreakTimer: ReturnType<typeof setTimeout> | null = null;

  // Listeners for UI state reactivity
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mb_desert_audio_muted");
      if (stored !== null) {
        this.isMuted = stored === "true";
      }
    }
  }

  public subscribe(cb: (muted: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.isMuted));
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public start(): void {
    if (this.isRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isRunning = true;

    // Master ambient gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.001, ctx.currentTime);
    if (!this.isMuted) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 2.5);
    }
    this.masterGain.connect(ctx.destination);

    // 1. Procedural Desert Wind Loop
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 6);
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    // Dynamic bandpass filter for wind howl & gusts
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(320, ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    // LFO for slow undulating wind gust swell
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.18, ctx.currentTime); // ~5.5s gust cycle
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(140, ctx.currentTime); // Modulates 180Hz - 460Hz
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.windFilter.frequency);

    this.windGain = ctx.createGain();
    this.windGain.gain.setValueAtTime(0.85, ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.lfo.start();
    this.windSource.start();

    // Schedule natural saloon wood creaks
    this.scheduleWoodCreak();
  }

  private scheduleWoodCreak(): void {
    if (!this.isRunning) return;
    const nextInterval = 6000 + Math.random() * 9000; // Every 6 to 15 seconds
    this.woodCreakTimer = setTimeout(() => {
      if (this.isRunning && !this.isMuted) {
        this.triggerWoodCreak();
      }
      this.scheduleWoodCreak();
    }, nextInterval);
  }

  public triggerWoodCreak(): void {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      const startFreq = 85 + Math.random() * 30;
      const endFreq = startFreq + (Math.random() * 40 - 20);
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + 0.45);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio context might be suspended or busy
    }
  }

  // Stone Ball rolling friction sound
  public playRollingStoneStep(): void {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Fail silently
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.woodCreakTimer) {
      clearTimeout(this.woodCreakTimer);
      this.woodCreakTimer = null;
    }

    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      } catch {
        // Safe exit
      }
    }

    setTimeout(() => {
      try {
        if (this.windSource) {
          this.windSource.stop();
          this.windSource.disconnect();
          this.windSource = null;
        }
        if (this.lfo) {
          this.lfo.stop();
          this.lfo.disconnect();
          this.lfo = null;
        }
      } catch {
        // Already stopped
      }
    }, 850);
  }

  public toggleMute(): boolean {
    const ctx = this.getContext();
    this.isMuted = !this.isMuted;

    if (typeof window !== "undefined") {
      localStorage.setItem("mb_desert_audio_muted", String(this.isMuted));
    }

    if (ctx && this.masterGain) {
      if (this.isMuted) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      } else {
        if (!this.isRunning) {
          this.start();
        }
        this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 1.2);
      }
    } else if (!this.isMuted && !this.isRunning) {
      this.start();
    }

    this.notify();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const desertAudio = new DesertAudioAmbience();
