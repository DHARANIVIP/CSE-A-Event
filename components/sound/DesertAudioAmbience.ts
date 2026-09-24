// Cinematic Desert & Cowboy Theme Audio Engine
// Features the iconic western cowboy theme soundtrack from YouTube (YHbizE2_Ngk)
// Plays automatically ONCE on entering the website, then stops automatically when completed.

import { soundManager } from "./SoundManager";

class DesertAudioAmbience {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private isRunning: boolean = false;
  private isPlayingEntryAudio: boolean = false;

  // Background Soundtrack Audio Element
  private themeAudio: HTMLAudioElement | null = null;

  // Web Audio Procedural Nodes (Wind & Ambience)
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
      this.initThemeAudio();
    }
  }

  public subscribe(cb: (muted: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.isMuted));
  }

  private initThemeAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.themeAudio) {
      try {
        const audio = new Audio();
        audio.loop = false; // Only play once per user specification
        audio.preload = "auto";

        // Prioritize webm (Opus), fallback to m4a (AAC)
        if (audio.canPlayType('audio/webm; codecs="opus"')) {
          audio.src = "/audio/cowboy-theme.webm";
        } else {
          audio.src = "/audio/cowboy-theme.m4a";
        }

        audio.volume = 0.75;
        this.themeAudio = audio;
      } catch {
        // Fallback for SSR
      }
    }
    return this.themeAudio;
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

  // Dual-channel rich pink noise buffer for warm desert atmospheric wind
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
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.35;
      b6 = white * 0.115926;

      left[i] = pink;
      right[i] = pink * 0.95 + (Math.random() * 0.08 - 0.04);
    }
    return buffer;
  }

  // Automatically plays the background soundtrack once upon entering the website, then stops automatically
  public playOnceOnEntry(): void {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("mb_entry_audio_played")) return;

    const audio = this.initThemeAudio();
    if (!audio) return;

    audio.loop = false; // Only once
    audio.volume = 0.75;

    // Automatically stop when the audio track finishes
    audio.onended = () => {
      this.stop();
      this.isPlayingEntryAudio = false;
      this.isMuted = true;
      this.notify();
    };

    const startAudio = () => {
      audio
        .play()
        .then(() => {
          sessionStorage.setItem("mb_entry_audio_played", "true");
          this.isPlayingEntryAudio = true;
          this.isMuted = false;
          this.startProceduralAmbience();
          this.notify();
        })
        .catch(() => {
          // If browser policy prevents instant autoplay without user gesture,
          // automatically start on the very first touch/click/scroll upon entering
          const onFirstInteraction = () => {
            if (!sessionStorage.getItem("mb_entry_audio_played") && this.themeAudio) {
              this.themeAudio
                .play()
                .then(() => {
                  sessionStorage.setItem("mb_entry_audio_played", "true");
                  this.isPlayingEntryAudio = true;
                  this.isMuted = false;
                  this.startProceduralAmbience();
                  this.notify();
                })
                .catch(() => {});
            }
            window.removeEventListener("pointerdown", onFirstInteraction);
            window.removeEventListener("click", onFirstInteraction);
            window.removeEventListener("keydown", onFirstInteraction);
            window.removeEventListener("touchstart", onFirstInteraction);
          };

          window.addEventListener("pointerdown", onFirstInteraction, { once: true, passive: true });
          window.addEventListener("click", onFirstInteraction, { once: true, passive: true });
          window.addEventListener("keydown", onFirstInteraction, { once: true, passive: true });
          window.addEventListener("touchstart", onFirstInteraction, { once: true, passive: true });
        });
    };

    startAudio();
  }

  private startProceduralAmbience(): void {
    if (this.isRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isRunning = true;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 1.2);
    this.masterGain.connect(ctx.destination);

    // Procedural Desert Wind Loop
    const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windLowpass = ctx.createBiquadFilter();
    this.windLowpass.type = "lowpass";
    this.windLowpass.frequency.setValueAtTime(650, ctx.currentTime);

    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(360, ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.1, ctx.currentTime);

    this.lfo = ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(160, ctx.currentTime);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.windFilter.frequency);

    this.windGain = ctx.createGain();
    this.windGain.gain.setValueAtTime(0.75, ctx.currentTime);

    this.windSource.connect(this.windLowpass);
    this.windLowpass.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.lfo.start();
    this.windSource.start();

    this.scheduleWoodCreak();
  }

  public start(): void {
    const audio = this.initThemeAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.loop = false;
      audio.volume = 0.75;
      audio.onended = () => {
        this.stop();
        this.isMuted = true;
        this.notify();
      };
      audio.play().catch(() => {});
    }
    this.startProceduralAmbience();
  }

  private scheduleWoodCreak(): void {
    if (!this.isRunning) return;
    const nextInterval = 6000 + Math.random() * 8000;
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
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Safe exit
    }
  }

  public playRollingStoneStep(): void {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(75, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {
      // Safe exit
    }
  }

  public stop(): void {
    if (this.themeAudio) {
      this.themeAudio.pause();
    }

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
        // Safe exit
      }
      this.isRunning = false;
    }, 600);
  }

  public toggleMute(): boolean {
    const ctx = this.getContext();
    this.isMuted = !this.isMuted;

    soundManager.setMuted(this.isMuted);

    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const audio = this.initThemeAudio();
    if (audio) {
      if (this.isMuted) {
        audio.pause();
      } else {
        audio.currentTime = 0;
        audio.loop = false;
        audio.volume = 0.75;
        audio.onended = () => {
          this.stop();
          this.isMuted = true;
          this.notify();
        };
        audio.play().catch(() => {});
      }
    }

    if (this.isMuted) {
      if (ctx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      }
    } else {
      if (!this.isRunning) {
        this.startProceduralAmbience();
      }
      if (ctx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.8);
      }
      soundManager.playUnmuteCue();
    }

    this.notify();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsRunning(): boolean {
    return this.isRunning || (this.themeAudio ? !this.themeAudio.paused : false);
  }
}

export const desertAudio = new DesertAudioAmbience();
