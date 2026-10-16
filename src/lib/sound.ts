import { VOICES } from "@/lib/voices";

/** Speakers, microphone, and a dropped recording. Visuals do not depend on this. */
export class SoundOut {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: { gain: GainNode }[] = [];
  private analyser: AnalyserNode | null = null;
  private freq = new Uint8Array(1024);
  private mic: MediaStream | null = null;
  private micNode: MediaStreamAudioSourceNode | null = null;
  private fileNode: AudioBufferSourceNode | null = null;
  private fileGain: GainNode | null = null;
  private lastTargets: number[] = [];
  private inputKind: "none" | "mic" | "file" = "none";

  async ensure(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.95;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.008;
    comp.release.value = 0.25;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 5400;
    master.connect(tone);
    tone.connect(comp);
    comp.connect(ctx.destination);

    const voices = VOICES.map((voice) => {
      const osc = ctx.createOscillator();
      osc.type = voice.freq < 200 ? "triangle" : "sine";
      osc.frequency.value = voice.freq;
      const harm = ctx.createOscillator();
      harm.type = "sine";
      harm.frequency.value = voice.freq * 2;
      const harmGain = ctx.createGain();
      harmGain.gain.value = voice.freq < 180 ? 0.08 : 0.14;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = Math.min(4800, voice.freq * 8);
      filter.Q.value = 0.35;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, voice.u * 0.85));
      osc.connect(filter);
      harm.connect(harmGain);
      harmGain.connect(filter);
      filter.connect(gain);
      gain.connect(pan);
      pan.connect(master);
      osc.start();
      harm.start();
      return { gain };
    });

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    const sink = ctx.createGain();
    sink.gain.value = 0;
    analyser.connect(sink);
    sink.connect(ctx.destination);

    this.ctx = ctx;
    this.master = master;
    this.voices = voices;
    this.analyser = analyser;
    this.freq = new Uint8Array(analyser.frequencyBinCount);
  }

  /** Synth follows the field. A mic or a track replaces it. */
  setLevels(levels: number[], audible: boolean) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const synth = audible && this.inputKind === "none";
    for (let i = 0; i < this.voices.length; i++) {
      const body = VOICES[i].freq < 120 ? 1.4 : VOICES[i].freq < 200 ? 1.15 : 1;
      const target = synth ? levels[i] * 0.16 * body : 0;
      if (Math.abs(target - (this.lastTargets[i] ?? -1)) < 0.012) continue;
      this.lastTargets[i] = target;
      this.voices[i].gain.gain.setTargetAtTime(target, now, 0.05);
    }
  }

  attachMic(stream: MediaStream) {
    if (!this.ctx || !this.analyser) return;
    this.stopInput();
    const node = this.ctx.createMediaStreamSource(stream);
    node.connect(this.analyser);
    this.mic = stream;
    this.micNode = node;
    this.inputKind = "mic";
  }

  async playFile(file: File): Promise<void> {
    await this.ensure();
    if (!this.ctx || !this.analyser || !this.master) return;
    this.stopInput();
    const raw = await file.arrayBuffer();
    const audio = await this.ctx.decodeAudioData(raw.slice(0));
    const src = this.ctx.createBufferSource();
    src.buffer = audio;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.9;
    src.connect(gain);
    gain.connect(this.master);
    gain.connect(this.analyser);
    src.start();
    this.fileNode = src;
    this.fileGain = gain;
    this.inputKind = "file";
  }

  stopInput() {
    this.mic?.getTracks().forEach((track) => track.stop());
    this.mic = null;
    this.micNode?.disconnect();
    this.micNode = null;
    if (this.fileNode) {
      try {
        this.fileNode.stop();
      } catch {
        /* already ended */
      }
      this.fileNode.disconnect();
      this.fileNode = null;
    }
    this.fileGain?.disconnect();
    this.fileGain = null;
    this.inputKind = "none";
  }

  /** Eight bands, low to high, gated so a quiet room is not “every note”. */
  sampleBands(): number[] | null {
    if (!this.analyser || !this.ctx || this.inputKind === "none") return null;
    this.analyser.getByteFrequencyData(this.freq);
    const bins = this.analyser.frequencyBinCount;
    const nyquist = this.ctx.sampleRate / 2;
    const edges = [40, 100, 200, 400, 800, 1600, 3200, 6400, 14000];
    const out: number[] = [];
    for (let i = 0; i < VOICES.length; i++) {
      const start = Math.min(bins - 1, Math.floor((edges[i] / nyquist) * bins));
      const end = Math.min(bins, Math.max(start + 1, Math.floor((edges[i + 1] / nyquist) * bins)));
      let sum = 0;
      for (let k = start; k < end; k++) sum += this.freq[k];
      const shaped = Math.pow(sum / (end - start) / 255, 0.62);
      out.push(shaped < 0.2 ? 0 : Math.min(1, (shaped - 0.2) / 0.8));
    }
    return out;
  }

  dispose() {
    this.stopInput();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.voices = [];
    this.analyser = null;
  }
}
