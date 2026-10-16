/** Eight notes of a C major chord, standing in the room. Lower notes are closer. */

export type Voice = {
  id: string;
  name: string;
  freq: number;
  /** Horizontal place, −1 left … 1 right. */
  u: number;
  /** Depth, −1 far … 1 near. */
  v: number;
};

export const STAGE = { cx: 0.5, cy: 0.5, rx: 0.36, ry: 0.42 };

export const VOICES: readonly Voice[] = [
  { id: "c2", name: "C2", freq: 65.41, u: 0.0, v: 0.82 },
  { id: "g2", name: "G2", freq: 98.0, u: -0.7, v: 0.36 },
  { id: "c3", name: "C3", freq: 130.81, u: 0.68, v: 0.4 },
  { id: "e3", name: "E3", freq: 164.81, u: -0.9, v: -0.06 },
  { id: "g3", name: "G3", freq: 196.0, u: 0.06, v: -0.14 },
  { id: "c4", name: "C4", freq: 261.63, u: 0.76, v: -0.32 },
  { id: "e4", name: "E4", freq: 329.63, u: -0.46, v: -0.64 },
  { id: "g4", name: "G4", freq: 392.0, u: 0.3, v: -0.88 },
];

export type ListenMode = "ensemble" | "one" | "every" | "mic" | "track";

export const CYCLE = 28;

export function stagePoint(voice: Voice): { x: number; y: number } {
  return {
    x: STAGE.cx + voice.u * STAGE.rx,
    y: STAGE.cy + voice.v * STAGE.ry,
  };
}

function pulsed(level: number, elapsed: number, index: number): number {
  if (level <= 0) return 0;
  return level * (0.86 + 0.14 * Math.sin(elapsed * 1.7 + index * 0.9));
}

/** Which notes are awake in the composed field, before strikes or a recording. */
export function scoreTargets(elapsed: number, mode: ListenMode): number[] {
  const zeros = VOICES.map(() => 0);
  if (mode === "mic" || mode === "track") return zeros;
  if (mode === "every") return VOICES.map((_, i) => pulsed(0.9, elapsed, i));
  if (mode === "one") {
    zeros[0] = pulsed(0.7, elapsed, 0);
    return zeros;
  }

  const t = elapsed % CYCLE;
  const sections: { until: number; count: number; level: number; only?: number }[] = [
    { until: 4.5, count: 1, level: 0.64 },
    { until: 9, count: 2, level: 0.68 },
    { until: 13.5, count: 4, level: 0.72 },
    { until: 18, count: 6, level: 0.76 },
    { until: 22, count: 7, level: 0.8 },
    { until: 26.2, count: 8, level: 0.92 },
    { until: CYCLE, count: 1, level: 0.55, only: 3 },
  ];
  const section = sections.find((item) => t < item.until) ?? sections[0];
  if (section.only !== undefined) {
    zeros[section.only] = pulsed(section.level, elapsed, section.only);
    return zeros;
  }
  for (let i = 0; i < section.count; i++) zeros[i] = pulsed(section.level, elapsed, i);
  return zeros;
}
