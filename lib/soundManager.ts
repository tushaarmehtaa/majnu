const SOUND_SOURCES = [
  "/sfx/correct-guess.mp3",
  "/sfx/wrong-guess.mp3",
  "/sfx/win.mp3",
  "/sfx/loss.mp3",
];

type AudioContextType = AudioContext;

class SoundManager {
  private context: AudioContextType | null = null;

  private buffers = new Map<string, AudioBuffer>();

  private gainNode: GainNode | null = null;

  private unlocked = false;

  private muted = false;

  private lastPlayed = new Map<string, number>();

  private debounceMs = 80;

  async ensureContext(): Promise<AudioContextType> {
    if (typeof window === "undefined") {
      throw new Error("SoundManager can only run in the browser");
    }

    if (!this.context) {
      const AudioContextCtor =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("Web Audio API not supported");
      }
      this.context = new AudioContextCtor();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.updateGain();
    }

    return this.context;
  }

  private updateGain() {
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : 1;
    }
  }

  async preload(sources: string[] = SOUND_SOURCES) {
    await Promise.all(sources.map((source) => this.getBuffer(source).catch(() => null)));
  }

  async unlock() {
    if (typeof window === "undefined") return;
    const ctx = await this.ensureContext();
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => null);
    }
    this.unlocked = true;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.updateGain();
  }

  isMuted(): boolean {
    return this.muted;
  }

  async play(source: string, volume = 1.0) {
    if (typeof window === "undefined" || this.muted) return;
    const ctx = await this.ensureContext();
    if (!this.unlocked) {
      try {
        await this.unlock();
      } catch {
        return;
      }
    }

    const buffer = await this.getBuffer(source);
    if (!buffer) return;

    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const last = this.lastPlayed.get(source) ?? 0;
    if (now - last < this.debounceMs) {
      return;
    }
    this.lastPlayed.set(source, now);

    const node = ctx.createBufferSource();
    node.buffer = buffer;

    const volumeNode = ctx.createGain();
    volumeNode.gain.value = Math.max(0, Math.min(1, volume));
    node.connect(volumeNode);
    volumeNode.connect(this.gainNode ?? ctx.destination);
    
    node.start(0);
  }

  private async getBuffer(source: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(source);
    if (cached) return cached;

    try {
      const ctx = await this.ensureContext();
      const response = await fetch(source);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      this.buffers.set(source, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn("[soundManager] failed to load", source, error);
      return null;
    }
  }
}

export const soundManager = new SoundManager();
