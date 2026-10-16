export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  public init(audioElement: HTMLAudioElement): void {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.sourceNode = this.ctx.createMediaElementSource(audioElement);
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getEnergyLevels(): { bass: number; mid: number; treble: number } {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    const bins = this.dataArray.length;

    // Sub-bass to low-mid: 0 - ~250 Hz
    const bassAvg = this.average(0, Math.floor(bins * 0.12));
    // Mid frequencies: ~250 Hz - 2 kHz
    const midAvg = this.average(Math.floor(bins * 0.12), Math.floor(bins * 0.5));
    // Treble: > 2 kHz
    const trebleAvg = this.average(Math.floor(bins * 0.5), bins);

    return {
      bass: bassAvg / 255,
      mid: midAvg / 255,
      treble: trebleAvg / 255
    };
  }

  private average(start: number, end: number): number {
    if (!this.dataArray || start >= end) return 0;
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += this.dataArray[i];
    }
    return sum / (end - start);
  }

  public dispose(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}