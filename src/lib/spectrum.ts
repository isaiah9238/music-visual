/** Acoustic fullness, read as visible light. Not a shared unit — a comparison. */

export const LAMBDA_RED = 700;
export const LAMBDA_VIOLET = 400;
export const ACTIVE_LEVEL = 0.2;

const EM_FLEX = [1.05, 1.15, 1.05, 4.4, 0.85, 0.85, 0.85] as const;
const EM_TOTAL = EM_FLEX.reduce((sum, n) => sum + n, 0);
const EM_BEFORE_VISIBLE = EM_FLEX[0] + EM_FLEX[1] + EM_FLEX[2];

/** Marker travel, in percent of the ribbon, matching the band fractions. */
export const VISIBLE_START = (EM_BEFORE_VISIBLE / EM_TOTAL) * 100;
export const VISIBLE_WIDTH = (EM_FLEX[3] / EM_TOTAL) * 100;

export const EM_BANDS = [
  { id: "rf", label: "RF", title: "Radio", flex: EM_FLEX[0] },
  { id: "mw", label: "µW", title: "Microwave", flex: EM_FLEX[1] },
  { id: "ir", label: "IR", title: "Infrared", flex: EM_FLEX[2] },
  { id: "vis", label: "Visible", title: "Visible light", flex: EM_FLEX[3] },
  { id: "uv", label: "UV", title: "Ultraviolet", flex: EM_FLEX[4] },
  { id: "x", label: "X", title: "X-ray", flex: EM_FLEX[5] },
  { id: "g", label: "γ", title: "Gamma", flex: EM_FLEX[6] },
] as const;

export type Rgb = [number, number, number];

export type MomentReading = {
  silent: boolean;
  name: string;
  ev: number;
  nm: number;
  energy: number;
  rgb: Rgb;
  active: number;
  total: number;
  line: string;
};

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Fullness of the chord first, loudness second. Every note awake → near 1. */
export function momentEnergy(active: number, total: number, power: number): number {
  const occupancy = total <= 0 ? 0 : active / total;
  return clamp01(0.75 * occupancy + 0.25 * clamp01(power));
}

export function energyToWavelength(energy: number): number {
  return LAMBDA_RED + (LAMBDA_VIOLET - LAMBDA_RED) * clamp01(energy);
}

export function photonEv(nm: number): number {
  return 1239.84193 / nm;
}

export function colorName(nm: number): string {
  if (nm < 430) return "Violet";
  if (nm < 455) return "Indigo";
  if (nm < 490) return "Blue";
  if (nm < 520) return "Cyan";
  if (nm < 565) return "Green";
  if (nm < 590) return "Yellow";
  if (nm < 635) return "Orange";
  return "Red";
}

/** Approximate spectral locus, 380–780 nm. */
export function wavelengthToRgb(wavelength: number): Rgb {
  const nm = wavelength;
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm >= 380 && nm < 440) {
    r = -((nm - 440) / (440 - 380));
    b = 1;
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm >= 490 && nm < 510) {
    g = 1;
    b = -((nm - 510) / (510 - 490));
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
  } else if (nm >= 580 && nm < 645) {
    r = 1;
    g = -((nm - 645) / (645 - 580));
  } else if (nm >= 645 && nm <= 780) {
    r = 1;
  }

  let factor = 0;
  if (nm >= 380 && nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / (420 - 380);
  else if (nm >= 420 && nm <= 700) factor = 1;
  else if (nm > 700 && nm <= 780) factor = 0.3 + (0.7 * (780 - nm)) / (780 - 700);

  const gamma = 0.8;
  const channel = (c: number) => Math.round(255 * Math.pow(clamp01(c * factor), gamma));
  return [channel(r), channel(g), channel(b)];
}

export function rgbCss(rgb: Rgb, alpha = 1): string {
  if (alpha >= 1) return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${alpha})`;
}

export function readingFromLevels(levels: number[]): MomentReading {
  const total = levels.length;
  const active = levels.reduce((n, level) => n + (level >= ACTIVE_LEVEL ? 1 : 0), 0);
  const power = total === 0 ? 0 : levels.reduce((sum, level) => sum + level, 0) / total;
  const silent = active === 0 && power < 0.04;
  const energy = silent ? 0 : momentEnergy(active, total, power);
  const nm = energyToWavelength(energy);
  const ev = photonEv(nm);
  const name = silent ? "Silent" : colorName(nm);
  const evText = `${ev.toFixed(2)} eV`;
  let line = "Nothing is sounding.";
  if (!silent && active === total) {
    line = `Every note is being hit. ${evText}, ${name.toLowerCase()}.`;
  } else if (!silent && active === 1) {
    line = `One note is sounding. ${evText}, ${name.toLowerCase()}.`;
  } else if (!silent) {
    line = `${active} of ${total} notes are sounding. ${evText}, ${name.toLowerCase()}.`;
  }
  return {
    silent,
    name,
    ev,
    nm,
    energy,
    rgb: wavelengthToRgb(nm),
    active,
    total,
    line,
  };
}
