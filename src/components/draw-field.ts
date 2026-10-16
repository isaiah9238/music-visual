import type { Rgb } from "@/lib/spectrum";
import { STAGE, VOICES } from "@/lib/voices";

export type Ripple = {
  u: number;
  v: number;
  born: number;
  life: number;
  rgb: Rgb;
  strength: number;
  gap: number;
};

export function drawField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ripples: readonly Ripple[],
  levels: readonly number[],
  energy: number,
  rgb: Rgb,
  now: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#090a0c";
  ctx.fillRect(0, 0, w, h);

  const cx = STAGE.cx * w;
  const cy = STAGE.cy * h;
  const rx = STAGE.rx * w;
  const ry = STAGE.ry * h;

  const room = ctx.createRadialGradient(cx, cy, ry * 0.15, cx, cy, Math.max(w, h) * 0.62);
  const wash = 0.045 + energy * 0.2;
  room.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${wash})`);
  room.addColorStop(0.42, "rgba(18, 20, 26, 0.55)");
  room.addColorStop(1, "rgba(9, 10, 12, 0)");
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(236, 231, 223, 0.035)";
  ctx.fill();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.28 + energy * 0.45})`;
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(236, 231, 223, 0.06)";
  for (const ring of [0.45, 0.75]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * ring, ry * ring, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ripple of ripples) {
    const age = (now - ripple.born) / ripple.life;
    if (age < 0 || age >= 1) continue;
    const depth = 0.78 + ((ripple.v + 1) / 2) * 0.4;
    const x = (STAGE.cx + ripple.u * STAGE.rx) * w;
    const y = (STAGE.cy + ripple.v * STAGE.ry) * h;
    const base = (0.045 + age * 1.12) * depth;
    const fade = (1 - age) * (1 - age);
    for (let k = 0; k < 2; k++) {
      const radius = base - k * ripple.gap;
      if (radius <= 0.02) continue;
      const alpha = Math.min(0.95, fade * ripple.strength * (k === 0 ? 1.45 : 0.7));
      ctx.beginPath();
      ctx.ellipse(x, y, radius * rx, radius * ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ripple.rgb[0]}, ${ripple.rgb[1]}, ${ripple.rgb[2]}, ${alpha})`;
      ctx.lineWidth = k === 0 ? 2.75 : 1.15;
      ctx.stroke();
    }
  }

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i] ?? 0;
    if (level < 0.05) continue;
    const voice = VOICES[i];
    const x = (STAGE.cx + voice.u * STAGE.rx) * w;
    const y = (STAGE.cy + voice.v * STAGE.ry) * h;
    const radius = 16 + level * 70;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.28 + level * 0.5})`);
    glow.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(
    cx,
    cy,
    Math.min(w, h) * 0.2,
    cx,
    cy,
    Math.max(w, h) * 0.72,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}
