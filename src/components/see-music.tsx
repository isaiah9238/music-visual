import { useEffect, useRef, useState } from "react";
import { drawField, type Ripple } from "@/components/draw-field";
import {
  ACTIVE_LEVEL,
  EM_BANDS,
  VISIBLE_START,
  VISIBLE_WIDTH,
  readingFromLevels,
  rgbCss,
  type MomentReading,
} from "@/lib/spectrum";
import { SoundOut } from "@/lib/sound";
import { VOICES, scoreTargets, stagePoint, type ListenMode } from "@/lib/voices";

type Hud = MomentReading & { levels: number[] };

const MODES: { id: ListenMode; label: string; hint: string }[] = [
  { id: "one", label: "One note", hint: "A single note. The moment stays red." },
  { id: "ensemble", label: "The climb", hint: "Notes join until the moment reaches violet." },
  { id: "every", label: "Every note", hint: "The whole chord at once. Violet." },
];

function openingHud(): Hud {
  const levels = scoreTargets(0, "ensemble");
  return { ...readingFromLevels(levels), levels };
}

export function SeeMusic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const soundRef = useRef<SoundOut | null>(null);
  const strikeRef = useRef<(index: number) => void>(() => {});

  const [mode, setMode] = useState<ListenMode>("ensemble");
  const [soundOn, setSoundOn] = useState(false);
  const [hud, setHud] = useState<Hud>(openingHud);
  const [spoken, setSpoken] = useState(openingHud().line);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const modeRef = useRef(mode);
  const soundOnRef = useRef(soundOn);
  modeRef.current = mode;
  soundOnRef.current = soundOn;

  useEffect(() => {
    if (mode !== "mic" && mode !== "track") soundRef.current?.stopInput();
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sound = new SoundOut();
    soundRef.current = sound;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ripples: Ripple[] = [];
    const strikes = VOICES.map(() => 0);
    const burst = VOICES.map(() => false);
    const acc = VOICES.map(() => 0);
    const levels = scoreTargets(0, "ensemble");
    const seedReading = readingFromLevels(levels);
    const seedNow = performance.now();
    for (let n = 0; n < 5; n++) {
      ripples.push({
        u: VOICES[0].u,
        v: VOICES[0].v,
        born: seedNow - n * 380,
        life: 2.7,
        rgb: seedReading.rgb,
        strength: 0.85,
        gap: 0.05,
      });
    }
    let elapsed = 0;
    let last = performance.now();
    let lastHud = 0;
    let spokenKey = "";
    let alive = true;
    let width = 1;
    let height = 1;

    const fit = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < VOICES.length) {
        event.preventDefault();
        strikes[index] = 1;
        burst[index] = true;
      }
    };
    strikeRef.current = (index: number) => {
      strikes[index] = 1;
      burst[index] = true;
    };
    window.addEventListener("keydown", onKey);

    const frame = (now: number) => {
      if (!alive) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      elapsed += dt;

      const currentMode = modeRef.current;
      const input = currentMode === "mic" || currentMode === "track" ? sound.sampleBands() : null;
      const base = input ?? scoreTargets(elapsed, currentMode);
      for (let i = 0; i < VOICES.length; i++) {
        strikes[i] *= Math.exp(-dt * 1.45);
        const target = Math.max(base[i] ?? 0, strikes[i]);
        const follow = 1 - Math.exp(-dt * (input ? 8 : 4.5));
        levels[i] += (target - levels[i]) * follow;
      }
      sound.setLevels(levels, soundOnRef.current);

      const reading = readingFromLevels(levels);
      for (let i = 0; i < VOICES.length; i++) {
        const level = levels[i] ?? 0;
        if (level < ACTIVE_LEVEL && !burst[i]) {
          acc[i] = 0;
          continue;
        }
        acc[i] += dt;
        const interval = Math.min(0.32, Math.max(0.07, 14 / VOICES[i].freq));
        const step = reduce ? interval * 2.6 : interval;
        if (!burst[i] && acc[i] < step) continue;
        acc[i] = 0;
        burst[i] = false;
        ripples.push({
          u: VOICES[i].u,
          v: VOICES[i].v,
          born: now,
          life: reduce ? 3.6 : 2.55,
          rgb: reading.rgb,
          strength: 0.55 + Math.min(1, level) * 0.45,
          gap: Math.min(0.075, Math.max(0.022, 6.5 / VOICES[i].freq)),
        });
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (now - ripples[i].born > ripples[i].life) ripples.splice(i, 1);
      }
      if (ripples.length > 96) ripples.splice(0, ripples.length - 96);

      const ctx = canvas.getContext("2d");
      if (ctx) drawField(ctx, width, height, ripples, levels, reading.energy, reading.rgb, now);

      if (now - lastHud > 120) {
        lastHud = now;
        const next: Hud = { ...reading, levels: levels.slice() };
        setHud(next);
        const key = `${reading.name}:${reading.active}:${reading.silent}`;
        if (key !== spokenKey) {
          spokenKey = key;
          setSpoken(reading.line);
        }
      }
      requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
      sound.dispose();
      if (soundRef.current === sound) soundRef.current = null;
    };
  }, []);

  async function toggleSound() {
    const sound = soundRef.current;
    if (!sound) return;
    if (soundOn) {
      setSoundOn(false);
      return;
    }
    try {
      await sound.ensure();
      setSoundOn(true);
      setNotice(null);
    } catch {
      setNotice("Sound couldn’t start in this browser.");
    }
  }

  function strike(index: number) {
    strikeRef.current(index);
  }

  async function listenToRoom() {
    const sound = soundRef.current;
    if (!sound || !navigator.mediaDevices?.getUserMedia) {
      setNotice("This browser has no microphone.");
      return;
    }
    try {
      const pending = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      await sound.ensure();
      const stream = await pending;
      sound.attachMic(stream);
      setMode("mic");
      setSoundOn(true);
      setNotice("Listening to the room. Low sounds stand in front, high sounds farther off.");
    } catch {
      setMode("ensemble");
      setNotice("The microphone stayed closed.");
    }
  }

  async function openFile(file: File) {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      await sound.playFile(file);
      setMode("track");
      setSoundOn(true);
      setNotice(file.name);
    } catch {
      setMode("ensemble");
      setNotice("That file didn’t play as audio.");
    }
  }

  const markerLeft = VISIBLE_START + hud.energy * VISIBLE_WIDTH;
  const moment = rgbCss(hud.rgb);
  const grid = EM_BANDS.map((band) => `${band.flex}fr`).join(" ");

  return (
    <main
      className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg text-ink"
      style={{ ["--moment" as string]: moment }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void openFile(file);
      }}
    >
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
      <header className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-7 sm:pt-6">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest text-faint uppercase">Listening field</p>
          <h1 className="font-display text-3xl leading-none font-medium tracking-tight text-balance sm:text-5xl">
            See Music
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl leading-none font-medium sm:text-4xl">{hud.name}</p>
          <p className="mt-2 font-mono text-xs text-muted tabular-nums sm:text-sm">
            {hud.silent ? "— eV" : `${hud.ev.toFixed(2)} eV`}
            <span className="text-faint"> · </span>
            {hud.silent ? "— nm" : `${Math.round(hud.nm)} nm`}
          </p>
          <p className="mt-1 font-mono text-xs text-faint tabular-nums">
            {hud.silent ? "No notes sounding" : `${hud.active} of ${hud.total} notes`}
          </p>
        </div>
      </header>

      <p className="max-w-xl px-4 pt-2 text-sm leading-relaxed text-pretty text-muted sm:px-7 sm:pt-3">
        Each note stands in the room, lower ones closer. Ripples leave from there. One note is red. Every
        note at once is violet.
      </p>

      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
        {VOICES.map((voice, index) => {
          const point = stagePoint(voice);
          const level = hud.levels[index] ?? 0;
          const awake = level >= ACTIVE_LEVEL;
          return (
            <button
              key={voice.id}
              type="button"
              aria-label={`Strike ${voice.name}`}
              onClick={() => strike(index)}
              className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-transform duration-150 ease-out active:scale-[0.96]"
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            >
              <span
                className="block h-3 w-3 rounded-full border border-ink/50"
                style={{
                  background: awake ? moment : "transparent",
                  boxShadow: awake ? `0 0 16px ${moment}` : undefined,
                }}
              />
              <span
                className={`absolute top-full left-1/2 mt-0.5 -translate-x-1/2 font-mono text-xs whitespace-nowrap ${awake ? "text-ink" : "text-faint"}`}
              >
                {voice.name}
              </span>
            </button>
          );
        })}
        {dragging ? (
          <div className="pointer-events-none absolute inset-3 border border-ink/50" />
        ) : null}
      </div>

      <footer className="px-4 pb-4 sm:px-7 sm:pb-6">
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="What is sounding">
          <button
            type="button"
            aria-pressed={soundOn}
            onClick={() => void toggleSound()}
            className={`min-h-11 shrink-0 border px-3 font-mono text-xs tracking-widest uppercase transition-transform duration-150 ease-out active:scale-[0.96] ${
              soundOn ? "border-ink bg-ink text-bg" : "border-line bg-panel text-ink"
            }`}
          >
            {soundOn ? "Sound on" : "Hear it"}
          </button>
          {MODES.map((item) => {
            const on = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                title={item.hint}
                onClick={() => {
                  setNotice(null);
                  setMode(item.id);
                }}
                className="min-h-11 shrink-0 border border-line bg-panel px-3 font-mono text-xs tracking-widest text-muted uppercase transition-transform duration-150 ease-out active:scale-[0.96]"
                style={on ? { borderColor: "var(--moment)", color: "var(--color-ink)" } : undefined}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={mode === "mic"}
            onClick={() => void listenToRoom()}
            className="min-h-11 shrink-0 border border-line bg-panel px-3 font-mono text-xs tracking-widest text-muted uppercase transition-transform duration-150 ease-out active:scale-[0.96]"
            style={mode === "mic" ? { borderColor: "var(--moment)", color: "var(--color-ink)" } : undefined}
          >
            Mic
          </button>
          <button
            type="button"
            aria-pressed={mode === "track"}
            onClick={() => fileRef.current?.click()}
            className="min-h-11 shrink-0 border border-line bg-panel px-3 font-mono text-xs tracking-widest text-muted uppercase transition-transform duration-150 ease-out active:scale-[0.96]"
            style={mode === "track" ? { borderColor: "var(--moment)", color: "var(--color-ink)" } : undefined}
          >
            A track
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="audio/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void openFile(file);
            }}
          />
        </div>

        {notice ? <p className="mb-3 font-mono text-xs text-muted">{notice}</p> : null}

        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-mono text-xs tracking-widest text-faint uppercase">Electromagnetic spectrum</p>
          <p className="hidden font-mono text-xs text-faint sm:block">This moment, as visible light</p>
        </div>
        <div className="relative">
          <div className="em-grid" style={{ gridTemplateColumns: grid }}>
            {EM_BANDS.map((band) => (
              <div key={band.id} className={band.id === "vis" ? "spectrum-visible" : "em-band"} title={band.title}>
                <span className={`em-label ${band.id === "vis" ? "text-bg" : ""}`}>{band.label}</span>
              </div>
            ))}
          </div>
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-ink transition-opacity duration-300"
            style={{ left: `${markerLeft}%`, opacity: hud.silent ? 0 : 1 }}
          />
          <div
            className="pointer-events-none absolute -top-1 h-2 w-2 -translate-x-1/2 rotate-45 border border-ink transition-opacity duration-300"
            style={{
              left: `${markerLeft}%`,
              background: "var(--moment)",
              opacity: hud.silent ? 0 : 1,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-faint">
          <span>Lower energy</span>
          <span>Higher energy</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted">
          {hud.line}{" "}
          <span className="text-faint">
            Keys 1–8 strike where a note stands. Violet is the high end of visible light, not past it.
          </span>
        </p>
      </footer>
    </main>
  );
}
