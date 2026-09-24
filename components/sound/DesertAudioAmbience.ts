// Procedural Desert Ambience Synthesizer (Web Audio API)
// Synthesizes realistic desert wind gusts, weathered saloon wood creaks, and rolling stone friction
// Zero external audio files mandate.

import { soundManager } from "./SoundManager";

class DesertAudioAmbience {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private isRunning: boolean = false;

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windLowpass: BiquadFilterNode | null = null;
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
      const stored = localStorage.getItem("mb_desert_audio_muted") || localStorage.getItem("mb_sound_muted");
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
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Generates dual-channel rich pink noise buffer for warm desert atmospheric wind
  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.42;
      b6 = white * 0.115926;

      left[i] = pink;
      right[i] = pink * 0.95 + (Math.random() * 0.08 - 0.04); // subtle stereo spread
    }
    return buffer;
  }

  public start(): void {
    if (this.isRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isRunning = true;

    // Master ambient gain - clearly audible 0.65 level
    this.masterGain = ctx.createGain();
    const targetGain = this.isMuted ? 0.0001 : 0.65;
    this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    if (!this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 1.2);
    }
    this.masterGain.connect(ctx.destination);

    // 1. Procedural Desert Wind Loop
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    // Gentle lowpass to keep deep warm desert body
    this.windLowpass = ctx.createBiquadFilter();
    this.windLowpass.type = "lowpass";
    this.windLowpass.frequency.setValueAtTime(750, ctx.currentTime);

    // Dynamic bandpass filter for wind howl & gusts
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(380, ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.1, ctx.currentTime);

    // LFO for slow undulating wind gust swell
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.16, ctx.currentTime); // ~6.2s gust cycle
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(180, ctx.currentTime); // Modulates 200Hz - 560Hz
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.windFilter.frequency);

    this.windGain = ctx.createGain();
    this.windGain.gain.setValueAtTime(0.95, ctx.currentTime);

    this.windSource.connect(this.windLowpass);
    this.windLowpass.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.lfo.start();
    this.windSource.start();

    // Schedule natural saloon wood creaks
    this.scheduleWoodCreak();
  }

  private scheduleWoodCreak(): void {
    if (!this.isRunning) return;
    const nextInterval = 5000 + Math.random() * 8000; // Every 5 to 13 seconds
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
      const startFreq = 95 + Math.random() * 35;
      const endFreq = startFreq + (Math.random() * 45 - 20);
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + 0.45);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(520, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.08);
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
      osc.frequency.setValueAtTime(75, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.19);
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
        this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
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
    }, 600);
  }

  public toggleMute(): boolean {
    const ctx = this.getContext();
    this.isMuted = !this.isMuted;

    if (typeof window !== "undefined") {
      localStorage.setItem("mb_desert_audio_muted", String(this.isMuted));
      localStorage.setItem("mb_sound_muted", String(this.isMuted));
    }

    // Sync soundManager mute state
    soundManager.setMuted(this.isMuted);

    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!this.isRunning) {
      this.start();
    }

    if (ctx && this.masterGain) {
      if (this.isMuted) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      } else {
        this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 0.8);
        // Play instant clear confirmation sound
        soundManager.playUnmuteCue();
      }
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
