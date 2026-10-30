import * as Tone from 'tone';

// 1. Map pitch to 360° color wheel (HSL)
export function noteToHue(midiNote: number): number {
  return ((midiNote % 12) / 12) * 360;
}

// 2. Synthesizer with real-time parameter taps
export class SynestheticEngine {
  synth: Tone.PolySynth;
  filter: Tone.Filter;
  analyser: Tone.Analyser;

  constructor() {
    this.analyser = new Tone.Analyser('waveform', 256);
    this.filter = new Tone.Filter(2000, 'lowpass');
    
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 1.2 }
    }).chain(this.filter, this.analyser, Tone.Destination);
  }

  triggerNote(note: string, velocity: number) {
    this.synth.triggerAttackRelease(note, '8n', undefined, velocity);
    const midi = Tone.Frequency(note).toMidi();
    
    // Emit color event directly to your visualizer
    return {
      hue: noteToHue(midi),
      saturation: Math.min(100, this.filter.frequency.value / 40),
      lightness: Math.max(20, velocity * 80)
    };
  }
}