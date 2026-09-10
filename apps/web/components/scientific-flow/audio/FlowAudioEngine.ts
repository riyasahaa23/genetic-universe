// Web Audio API pure synthesizer engine for subtle ambient soundscape and stage cues
// 100% self-contained, no external audio files required

export class FlowAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isMuted: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    // Lazy initialize on user interaction
  }

  private initContext() {
    if (this.isInitialized && this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.06, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Lowpass filter for deep, soothing warm background
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      // Low drone oscillators (A1 = 55Hz, E2 = 82.4Hz)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = "sine";
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = "sine";
      this.droneOsc2.frequency.setValueAtTime(82.41, this.ctx.currentTime);

      // Gentle LFO for breathing texture
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.type = "sine";
      this.lfoOsc.frequency.setValueAtTime(0.12, this.ctx.currentTime);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
      this.lfoOsc.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);

      this.droneOsc1.connect(this.filter);
      this.droneOsc2.connect(this.filter);
      this.filter.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.lfoOsc.start();

      this.isInitialized = true;
    } catch {
      // Gracefully ignore audio failure in unsupported environments
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.isInitialized && !muted) {
      this.initContext();
    }
    if (this.ctx && this.masterGain) {
      if (this.ctx.state === "suspended" && !muted) {
        this.ctx.resume();
      }
      const targetGain = muted ? 0 : 0.06;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft crystalline chime on chapter advance
  public playTransitionChime(chapterIndex: number) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Pentatonic pitch set [C5, D5, E5, G5, A5, C6, D6, E6, G6, A6]
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];
      const freq = notes[chapterIndex % notes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      // Slight pitch drift
      osc.frequency.exponentialRampToValueAtTime(freq * 1.008, now + 1.2);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch {
      // ignore
    }
  }

  // Crossover shimmer for Chapter 4
  public playCrossoverShimmer() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const pitches = [1318.51, 1567.98, 1975.53, 2637.02];
      pitches.forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.12);

        gain.gain.setValueAtTime(0.02, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.0);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.1);
      });
    } catch {
      // ignore
    }
  }

  // Ethereal chord for Chapter 7 novelty
  public playNoveltyChord() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [392.0, 493.88, 587.33, 739.99]; // G-B-D-F#maj7
      chord.forEach((f) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 2.1);
      });
    } catch {
      // ignore
    }
  }

  // Harmonic resolution chord for Chapter 9 rescue
  public playRescueChord() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [261.63, 329.63, 392.0, 523.25]; // C-E-G-C peaceful triad
      chord.forEach((f) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch {
      // ignore
    }
  }

  public cleanup() {
    try {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
    } catch {
      // ignore
    }
  }
}

export const flowAudio = new FlowAudioEngine();
