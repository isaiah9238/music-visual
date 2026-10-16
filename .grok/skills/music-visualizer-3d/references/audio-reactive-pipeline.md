# Audio Reactive Node Template

```typescript
export class AudioAnalyzer {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;

  constructor(fftSize = 512) {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.85;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  public async connectAudioElement(audioEl: HTMLAudioElement) {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    const source = this.ctx.createMediaElementSource(audioEl);
    source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public getEnergyBands(): { bass: number; mid: number; treble: number } {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Bin indices calculation based on nyquist rate (ctx.sampleRate / 2)
    const binCount = this.dataArray.length;
    const bass = this.average(0, Math.floor(binCount * 0.1)) / 255;
    const mid = this.average(Math.floor(binCount * 0.1), Math.floor(binCount * 0.5)) / 255;
    const treble = this.average(Math.floor(binCount * 0.5), binCount) / 255;

    return { bass, mid, treble };
  }

  private average(start: number, end: number): number {
    let sum = 0;
    for (let i = start; i < end; i++) sum += this.dataArray[i];
    return sum / (end - start);
  }
}