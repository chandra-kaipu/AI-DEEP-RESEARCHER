import { FocusSoundType } from '../types';

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private currentOscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private currentSoundType: FocusSoundType = 'none';
  private targetVolume: number = 0.4;
  private isMuted: boolean = false;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(volume: number): void {
    this.targetVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.ctx) {
      const actualVol = this.isMuted ? 0 : this.targetVolume * 0.3; // Scale to pleasant level
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(actualVol, this.ctx.currentTime + 0.05);
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    this.setVolume(this.targetVolume);
  }

  public stop(): void {
    if (!this.ctx) return;

    if (this.gainNode) {
      this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    }

    setTimeout(() => {
      if (this.currentSource) {
        try {
          (this.currentSource as any).stop?.();
          this.currentSource.disconnect();
        } catch {}
        this.currentSource = null;
      }

      for (const osc of this.currentOscillators) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      }
      this.currentOscillators = [];
      this.currentSoundType = 'none';
    }, 120);
  }

  public play(type: FocusSoundType, volume: number = 0.4): void {
    if (type === 'none') {
      this.stop();
      return;
    }

    const ctx = this.initContext();
    this.stop();

    this.currentSoundType = type;
    this.targetVolume = volume;

    // Create main gain
    const masterGain = ctx.createGain();
    const effectiveVol = this.isMuted ? 0 : volume * 0.3;
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(effectiveVol, ctx.currentTime + 0.2);
    masterGain.connect(ctx.destination);
    this.gainNode = masterGain;

    if (type === 'white') {
      this.createWhiteNoise(ctx, masterGain);
    } else if (type === 'pink') {
      this.createPinkNoise(ctx, masterGain);
    } else if (type === 'brown') {
      this.createBrownNoise(ctx, masterGain);
    } else if (type === 'binaural') {
      this.create40HzFocusDrone(ctx, masterGain);
    }
  }

  private createWhiteNoise(ctx: AudioContext, destination: AudioNode): void {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Gentle low-pass filter to prevent piercing highs
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(destination);
    whiteNoise.start(0);
    this.currentSource = whiteNoise;
  }

  private createPinkNoise(ctx: AudioContext, destination: AudioNode): void {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Paul Kellet's filtered pink noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const pinkNoise = ctx.createBufferSource();
    pinkNoise.buffer = noiseBuffer;
    pinkNoise.loop = true;

    pinkNoise.connect(destination);
    pinkNoise.start(0);
    this.currentSource = pinkNoise;
  }

  private createBrownNoise(ctx: AudioContext, destination: AudioNode): void {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Brownian integration algorithm
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate gain
    }

    const brownNoise = ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    // Gentle warm filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    brownNoise.connect(filter);
    filter.connect(destination);
    brownNoise.start(0);
    this.currentSource = brownNoise;
  }

  private create40HzFocusDrone(ctx: AudioContext, destination: AudioNode): void {
    // 40Hz Gamma Isochronic Focus Drone
    // Root warm harmonic carrier at 136.1 Hz (Om/Cosmic frequency) + 40Hz rhythmic pulse
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(136.1, ctx.currentTime);

    const foundation = ctx.createOscillator();
    foundation.type = 'sine';
    foundation.frequency.setValueAtTime(68.05, ctx.currentTime); // Sub-octave

    // 40Hz amplitude modulation LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(40, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);

    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0.7, ctx.currentTime);

    lfo.connect(carrierGain.gain);
    carrier.connect(carrierGain);
    foundation.connect(carrierGain);
    carrierGain.connect(destination);

    carrier.start(0);
    foundation.start(0);
    lfo.start(0);

    this.currentOscillators = [carrier, foundation, lfo];
  }

  public playChime(): void {
    try {
      const ctx = this.initContext();
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0.001, ctx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
      chimeGain.connect(ctx.destination);

      // Bell harmonics
      const freqs = [528, 792, 1056];
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.connect(chimeGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.8);
      });
    } catch (err) {
      console.error('Failed to play chime:', err);
    }
  }

  public getCurrentSound(): FocusSoundType {
    return this.currentSoundType;
  }
}

export const soundscape = new SoundscapeEngine();
