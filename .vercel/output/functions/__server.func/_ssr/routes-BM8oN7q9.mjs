import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BM8oN7q9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STAGE = {
	cx: .5,
	cy: .5,
	rx: .36,
	ry: .42
};
var VOICES = [
	{
		id: "c2",
		name: "C2",
		freq: 65.41,
		u: 0,
		v: .82
	},
	{
		id: "g2",
		name: "G2",
		freq: 98,
		u: -.7,
		v: .36
	},
	{
		id: "c3",
		name: "C3",
		freq: 130.81,
		u: .68,
		v: .4
	},
	{
		id: "e3",
		name: "E3",
		freq: 164.81,
		u: -.9,
		v: -.06
	},
	{
		id: "g3",
		name: "G3",
		freq: 196,
		u: .06,
		v: -.14
	},
	{
		id: "c4",
		name: "C4",
		freq: 261.63,
		u: .76,
		v: -.32
	},
	{
		id: "e4",
		name: "E4",
		freq: 329.63,
		u: -.46,
		v: -.64
	},
	{
		id: "g4",
		name: "G4",
		freq: 392,
		u: .3,
		v: -.88
	}
];
function stagePoint(voice) {
	return {
		x: STAGE.cx + voice.u * STAGE.rx,
		y: STAGE.cy + voice.v * STAGE.ry
	};
}
function pulsed(level, elapsed, index) {
	if (level <= 0) return 0;
	return level * (.86 + .14 * Math.sin(elapsed * 1.7 + index * .9));
}
/** Which notes are awake in the composed field, before strikes or a recording. */
function scoreTargets(elapsed, mode) {
	const zeros = VOICES.map(() => 0);
	if (mode === "mic" || mode === "track") return zeros;
	if (mode === "every") return VOICES.map((_, i) => pulsed(.9, elapsed, i));
	if (mode === "one") {
		zeros[0] = pulsed(.7, elapsed, 0);
		return zeros;
	}
	const t = elapsed % 28;
	const sections = [
		{
			until: 4.5,
			count: 1,
			level: .64
		},
		{
			until: 9,
			count: 2,
			level: .68
		},
		{
			until: 13.5,
			count: 4,
			level: .72
		},
		{
			until: 18,
			count: 6,
			level: .76
		},
		{
			until: 22,
			count: 7,
			level: .8
		},
		{
			until: 26.2,
			count: 8,
			level: .92
		},
		{
			until: 28,
			count: 1,
			level: .55,
			only: 3
		}
	];
	const section = sections.find((item) => t < item.until) ?? sections[0];
	if (section.only !== void 0) {
		zeros[section.only] = pulsed(section.level, elapsed, section.only);
		return zeros;
	}
	for (let i = 0; i < section.count; i++) zeros[i] = pulsed(section.level, elapsed, i);
	return zeros;
}
function drawField(ctx, w, h, ripples, levels, energy, rgb, now) {
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "#090a0c";
	ctx.fillRect(0, 0, w, h);
	const cx = STAGE.cx * w;
	const cy = STAGE.cy * h;
	const rx = STAGE.rx * w;
	const ry = STAGE.ry * h;
	const room = ctx.createRadialGradient(cx, cy, ry * .15, cx, cy, Math.max(w, h) * .62);
	const wash = .045 + energy * .2;
	room.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${wash})`);
	room.addColorStop(.42, "rgba(18, 20, 26, 0.55)");
	room.addColorStop(1, "rgba(9, 10, 12, 0)");
	ctx.fillStyle = room;
	ctx.fillRect(0, 0, w, h);
	ctx.beginPath();
	ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
	ctx.fillStyle = "rgba(236, 231, 223, 0.035)";
	ctx.fill();
	ctx.lineWidth = 1.25;
	ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${.28 + energy * .45})`;
	ctx.stroke();
	ctx.lineWidth = 1;
	ctx.strokeStyle = "rgba(236, 231, 223, 0.06)";
	for (const ring of [.45, .75]) {
		ctx.beginPath();
		ctx.ellipse(cx, cy, rx * ring, ry * ring, 0, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.save();
	ctx.globalCompositeOperation = "lighter";
	for (const ripple of ripples) {
		const age = (now - ripple.born) / ripple.life;
		if (age < 0 || age >= 1) continue;
		const depth = .78 + (ripple.v + 1) / 2 * .4;
		const x = (STAGE.cx + ripple.u * STAGE.rx) * w;
		const y = (STAGE.cy + ripple.v * STAGE.ry) * h;
		const base = (.045 + age * 1.12) * depth;
		const fade = (1 - age) * (1 - age);
		for (let k = 0; k < 2; k++) {
			const radius = base - k * ripple.gap;
			if (radius <= .02) continue;
			const alpha = Math.min(.95, fade * ripple.strength * (k === 0 ? 1.45 : .7));
			ctx.beginPath();
			ctx.ellipse(x, y, radius * rx, radius * ry, 0, 0, Math.PI * 2);
			ctx.strokeStyle = `rgba(${ripple.rgb[0]}, ${ripple.rgb[1]}, ${ripple.rgb[2]}, ${alpha})`;
			ctx.lineWidth = k === 0 ? 2.75 : 1.15;
			ctx.stroke();
		}
	}
	for (let i = 0; i < levels.length; i++) {
		const level = levels[i] ?? 0;
		if (level < .05) continue;
		const voice = VOICES[i];
		const x = (STAGE.cx + voice.u * STAGE.rx) * w;
		const y = (STAGE.cy + voice.v * STAGE.ry) * h;
		const radius = 16 + level * 70;
		const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
		glow.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${.28 + level * .5})`);
		glow.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
	const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * .2, cx, cy, Math.max(w, h) * .72);
	vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
	vignette.addColorStop(1, "rgba(0, 0, 0, 0.28)");
	ctx.fillStyle = vignette;
	ctx.fillRect(0, 0, w, h);
}
var ACTIVE_LEVEL = .2;
var EM_FLEX = [
	1.05,
	1.15,
	1.05,
	4.4,
	.85,
	.85,
	.85
];
var EM_TOTAL = EM_FLEX.reduce((sum, n) => sum + n, 0);
/** Marker travel, in percent of the ribbon, matching the band fractions. */
var VISIBLE_START = (EM_FLEX[0] + EM_FLEX[1] + EM_FLEX[2]) / EM_TOTAL * 100;
var VISIBLE_WIDTH = EM_FLEX[3] / EM_TOTAL * 100;
var EM_BANDS = [
	{
		id: "rf",
		label: "RF",
		title: "Radio",
		flex: EM_FLEX[0]
	},
	{
		id: "mw",
		label: "µW",
		title: "Microwave",
		flex: EM_FLEX[1]
	},
	{
		id: "ir",
		label: "IR",
		title: "Infrared",
		flex: EM_FLEX[2]
	},
	{
		id: "vis",
		label: "Visible",
		title: "Visible light",
		flex: EM_FLEX[3]
	},
	{
		id: "uv",
		label: "UV",
		title: "Ultraviolet",
		flex: EM_FLEX[4]
	},
	{
		id: "x",
		label: "X",
		title: "X-ray",
		flex: EM_FLEX[5]
	},
	{
		id: "g",
		label: "γ",
		title: "Gamma",
		flex: EM_FLEX[6]
	}
];
function clamp01(n) {
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}
/** Fullness of the chord first, loudness second. Every note awake → near 1. */
function momentEnergy(active, total, power) {
	return clamp01(.75 * (total <= 0 ? 0 : active / total) + .25 * clamp01(power));
}
function energyToWavelength(energy) {
	return 700 + -300 * clamp01(energy);
}
function photonEv(nm) {
	return 1239.84193 / nm;
}
function colorName(nm) {
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
function wavelengthToRgb(wavelength) {
	const nm = wavelength;
	let r = 0;
	let g = 0;
	let b = 0;
	if (nm >= 380 && nm < 440) {
		r = -((nm - 440) / 60);
		b = 1;
	} else if (nm >= 440 && nm < 490) {
		g = (nm - 440) / 50;
		b = 1;
	} else if (nm >= 490 && nm < 510) {
		g = 1;
		b = -((nm - 510) / 20);
	} else if (nm >= 510 && nm < 580) {
		r = (nm - 510) / 70;
		g = 1;
	} else if (nm >= 580 && nm < 645) {
		r = 1;
		g = -((nm - 645) / 65);
	} else if (nm >= 645 && nm <= 780) r = 1;
	let factor = 0;
	if (nm >= 380 && nm < 420) factor = .3 + .7 * (nm - 380) / 40;
	else if (nm >= 420 && nm <= 700) factor = 1;
	else if (nm > 700 && nm <= 780) factor = .3 + .7 * (780 - nm) / 80;
	const gamma = .8;
	const channel = (c) => Math.round(255 * Math.pow(clamp01(c * factor), gamma));
	return [
		channel(r),
		channel(g),
		channel(b)
	];
}
function rgbCss(rgb, alpha = 1) {
	if (alpha >= 1) return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
	return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${alpha})`;
}
function readingFromLevels(levels) {
	const total = levels.length;
	const active = levels.reduce((n, level) => n + (level >= .2 ? 1 : 0), 0);
	const power = total === 0 ? 0 : levels.reduce((sum, level) => sum + level, 0) / total;
	const silent = active === 0 && power < .04;
	const energy = silent ? 0 : momentEnergy(active, total, power);
	const nm = energyToWavelength(energy);
	const ev = photonEv(nm);
	const name = silent ? "Silent" : colorName(nm);
	const evText = `${ev.toFixed(2)} eV`;
	let line = "Nothing is sounding.";
	if (!silent && active === total) line = `Every note is being hit. ${evText}, ${name.toLowerCase()}.`;
	else if (!silent && active === 1) line = `One note is sounding. ${evText}, ${name.toLowerCase()}.`;
	else if (!silent) line = `${active} of ${total} notes are sounding. ${evText}, ${name.toLowerCase()}.`;
	return {
		silent,
		name,
		ev,
		nm,
		energy,
		rgb: wavelengthToRgb(nm),
		active,
		total,
		line
	};
}
/** Speakers, microphone, and a dropped recording. Visuals do not depend on this. */
var SoundOut = class {
	ctx = null;
	master = null;
	voices = [];
	analyser = null;
	freq = /* @__PURE__ */ new Uint8Array(1024);
	mic = null;
	micNode = null;
	fileNode = null;
	fileGain = null;
	lastTargets = [];
	inputKind = "none";
	async ensure() {
		if (this.ctx) {
			if (this.ctx.state === "suspended") await this.ctx.resume();
			return;
		}
		const ctx = new AudioContext();
		const master = ctx.createGain();
		master.gain.value = .95;
		const comp = ctx.createDynamicsCompressor();
		comp.threshold.value = -16;
		comp.knee.value = 18;
		comp.ratio.value = 3.2;
		comp.attack.value = .008;
		comp.release.value = .25;
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
			harmGain.gain.value = voice.freq < 180 ? .08 : .14;
			const filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.value = Math.min(4800, voice.freq * 8);
			filter.Q.value = .35;
			const gain = ctx.createGain();
			gain.gain.value = 0;
			const pan = ctx.createStereoPanner();
			pan.pan.value = Math.max(-1, Math.min(1, voice.u * .85));
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
		analyser.smoothingTimeConstant = .75;
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
	setLevels(levels, audible) {
		if (!this.ctx) return;
		const now = this.ctx.currentTime;
		const synth = audible && this.inputKind === "none";
		for (let i = 0; i < this.voices.length; i++) {
			const body = VOICES[i].freq < 120 ? 1.4 : VOICES[i].freq < 200 ? 1.15 : 1;
			const target = synth ? levels[i] * .16 * body : 0;
			if (Math.abs(target - (this.lastTargets[i] ?? -1)) < .012) continue;
			this.lastTargets[i] = target;
			this.voices[i].gain.gain.setTargetAtTime(target, now, .05);
		}
	}
	attachMic(stream) {
		if (!this.ctx || !this.analyser) return;
		this.stopInput();
		const node = this.ctx.createMediaStreamSource(stream);
		node.connect(this.analyser);
		this.mic = stream;
		this.micNode = node;
		this.inputKind = "mic";
	}
	async playFile(file) {
		await this.ensure();
		if (!this.ctx || !this.analyser || !this.master) return;
		this.stopInput();
		const raw = await file.arrayBuffer();
		const audio = await this.ctx.decodeAudioData(raw.slice(0));
		const src = this.ctx.createBufferSource();
		src.buffer = audio;
		src.loop = true;
		const gain = this.ctx.createGain();
		gain.gain.value = .9;
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
			} catch {}
			this.fileNode.disconnect();
			this.fileNode = null;
		}
		this.fileGain?.disconnect();
		this.fileGain = null;
		this.inputKind = "none";
	}
	/** Eight bands, low to high, gated so a quiet room is not “every note”. */
	sampleBands() {
		if (!this.analyser || !this.ctx || this.inputKind === "none") return null;
		this.analyser.getByteFrequencyData(this.freq);
		const bins = this.analyser.frequencyBinCount;
		const nyquist = this.ctx.sampleRate / 2;
		const edges = [
			40,
			100,
			200,
			400,
			800,
			1600,
			3200,
			6400,
			14e3
		];
		const out = [];
		for (let i = 0; i < VOICES.length; i++) {
			const start = Math.min(bins - 1, Math.floor(edges[i] / nyquist * bins));
			const end = Math.min(bins, Math.max(start + 1, Math.floor(edges[i + 1] / nyquist * bins)));
			let sum = 0;
			for (let k = start; k < end; k++) sum += this.freq[k];
			const shaped = Math.pow(sum / (end - start) / 255, .62);
			out.push(shaped < .2 ? 0 : Math.min(1, (shaped - .2) / .8));
		}
		return out;
	}
	dispose() {
		this.stopInput();
		this.ctx?.close();
		this.ctx = null;
		this.master = null;
		this.voices = [];
		this.analyser = null;
	}
};
var MODES = [
	{
		id: "one",
		label: "One note",
		hint: "A single note. The moment stays red."
	},
	{
		id: "ensemble",
		label: "The climb",
		hint: "Notes join until the moment reaches violet."
	},
	{
		id: "every",
		label: "Every note",
		hint: "The whole chord at once. Violet."
	}
];
function openingHud() {
	const levels = scoreTargets(0, "ensemble");
	return {
		...readingFromLevels(levels),
		levels
	};
}
function SeeMusic() {
	const canvasRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const soundRef = (0, import_react.useRef)(null);
	const strikeRef = (0, import_react.useRef)(() => {});
	const [mode, setMode] = (0, import_react.useState)("ensemble");
	const [soundOn, setSoundOn] = (0, import_react.useState)(false);
	const [hud, setHud] = (0, import_react.useState)(openingHud);
	const [spoken, setSpoken] = (0, import_react.useState)(openingHud().line);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const modeRef = (0, import_react.useRef)(mode);
	const soundOnRef = (0, import_react.useRef)(soundOn);
	modeRef.current = mode;
	soundOnRef.current = soundOn;
	(0, import_react.useEffect)(() => {
		if (mode !== "mic" && mode !== "track") soundRef.current?.stopInput();
	}, [mode]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const sound = new SoundOut();
		soundRef.current = sound;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const ripples = [];
		const strikes = VOICES.map(() => 0);
		const burst = VOICES.map(() => false);
		const acc = VOICES.map(() => 0);
		const levels = scoreTargets(0, "ensemble");
		const seedReading = readingFromLevels(levels);
		const seedNow = performance.now();
		for (let n = 0; n < 5; n++) ripples.push({
			u: VOICES[0].u,
			v: VOICES[0].v,
			born: seedNow - n * 380,
			life: 2.7,
			rgb: seedReading.rgb,
			strength: .85,
			gap: .05
		});
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
			canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		fit();
		const observer = new ResizeObserver(fit);
		if (canvas.parentElement) observer.observe(canvas.parentElement);
		const onKey = (event) => {
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
		strikeRef.current = (index) => {
			strikes[index] = 1;
			burst[index] = true;
		};
		window.addEventListener("keydown", onKey);
		const frame = (now) => {
			if (!alive) return;
			let dt = (now - last) / 1e3;
			last = now;
			if (dt > .05) dt = .05;
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
				if (level < .2 && !burst[i]) {
					acc[i] = 0;
					continue;
				}
				acc[i] += dt;
				const interval = Math.min(.32, Math.max(.07, 14 / VOICES[i].freq));
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
					strength: .55 + Math.min(1, level) * .45,
					gap: Math.min(.075, Math.max(.022, 6.5 / VOICES[i].freq))
				});
			}
			for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].born > ripples[i].life) ripples.splice(i, 1);
			if (ripples.length > 96) ripples.splice(0, ripples.length - 96);
			const ctx = canvas.getContext("2d");
			if (ctx) drawField(ctx, width, height, ripples, levels, reading.energy, reading.rgb, now);
			if (now - lastHud > 120) {
				lastHud = now;
				const next = {
					...reading,
					levels: levels.slice()
				};
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
	function strike(index) {
		strikeRef.current(index);
	}
	async function listenToRoom() {
		const sound = soundRef.current;
		if (!sound || !navigator.mediaDevices?.getUserMedia) {
			setNotice("This browser has no microphone.");
			return;
		}
		try {
			const pending = navigator.mediaDevices.getUserMedia({ audio: {
				echoCancellation: true,
				noiseSuppression: true
			} });
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
	async function openFile(file) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg text-ink",
		style: { ["--moment"]: moment },
		onDragOver: (event) => {
			event.preventDefault();
			setDragging(true);
		},
		onDragLeave: () => setDragging(false),
		onDrop: (event) => {
			event.preventDefault();
			setDragging(false);
			const file = event.dataTransfer.files?.[0];
			if (file) openFile(file);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				"aria-live": "polite",
				children: spoken
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-start justify-between gap-4 px-4 pt-4 sm:px-7 sm:pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-widest text-faint uppercase",
						children: "Listening field"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl leading-none font-medium tracking-tight text-balance sm:text-5xl",
						children: "See Music"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shrink-0 text-right",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl leading-none font-medium sm:text-4xl",
							children: hud.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-xs text-muted tabular-nums sm:text-sm",
							children: [
								hud.silent ? "— eV" : `${hud.ev.toFixed(2)} eV`,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-faint",
									children: " · "
								}),
								hud.silent ? "— nm" : `${Math.round(hud.nm)} nm`
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-xs text-faint tabular-nums",
							children: hud.silent ? "No notes sounding" : `${hud.active} of ${hud.total} notes`
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xl px-4 pt-2 text-sm leading-relaxed text-pretty text-muted sm:px-7 sm:pt-3",
				children: "Each note stands in the room, lower ones closer. Ripples leave from there. One note is red. Every note at once is violet."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						className: "absolute inset-0 h-full w-full",
						"aria-hidden": true
					}),
					VOICES.map((voice, index) => {
						const point = stagePoint(voice);
						const awake = (hud.levels[index] ?? 0) >= ACTIVE_LEVEL;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-label": `Strike ${voice.name}`,
							onClick: () => strike(index),
							className: "absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-transform duration-150 ease-out active:scale-[0.96]",
							style: {
								left: `${point.x * 100}%`,
								top: `${point.y * 100}%`
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block h-3 w-3 rounded-full border border-ink/50",
								style: {
									background: awake ? moment : "transparent",
									boxShadow: awake ? `0 0 16px ${moment}` : void 0
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `absolute top-full left-1/2 mt-0.5 -translate-x-1/2 font-mono text-xs whitespace-nowrap ${awake ? "text-ink" : "text-faint"}`,
								children: voice.name
							})]
						}, voice.id);
					}),
					dragging ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-3 border border-ink/50" }) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "px-4 pb-4 sm:px-7 sm:pb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex flex-wrap gap-2",
						role: "group",
						"aria-label": "What is sounding",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": soundOn,
								onClick: () => void toggleSound(),
								className: `min-h-11 shrink-0 border px-3 font-mono text-xs tracking-widest uppercase transition-transform duration-150 ease-out active:scale-[0.96] ${soundOn ? "border-ink bg-ink text-bg" : "border-line bg-panel text-ink"}`,
								children: soundOn ? "Sound on" : "Hear it"
							}),
							MODES.map((item) => {
								const on = mode === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": on,
									title: item.hint,
									onClick: () => {
										setNotice(null);
										setMode(item.id);
									},
									className: "min-h-11 shrink-0 border border-line bg-panel px-3 font-mono text-xs tracking-widest text-muted uppercase transition-transform duration-150 ease-out active:scale-[0.96]",
									style: on ? {
										borderColor: "var(--moment)",
										color: "var(--color-ink)"
									} : void 0,
									children: item.label
								}, item.id);
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": mode === "mic",
								onClick: () => void listenToRoom(),
								className: "min-h-11 shrink-0 border border-line bg-panel px-3 font-mono text-xs tracking-widest text-muted uppercase transition-transform duration-150 ease-out active:scale-[0.96]",
								style: mode === "mic" ? {
									borderColor: "var(--moment)",
									color: "var(--color-ink)"
								} : void 0,
								children: "Mic"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": mode === "track",
								onClick: () => fileRef.current?.click(),
								className: "min-h-11 shrink-0 border border-line bg-panel px-3 font-mono text-xs tracking-widest text-muted uppercase transition-transform duration-150 ease-out active:scale-[0.96]",
								style: mode === "track" ? {
									borderColor: "var(--moment)",
									color: "var(--color-ink)"
								} : void 0,
								children: "A track"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								className: "sr-only",
								type: "file",
								accept: "audio/*",
								onChange: (event) => {
									const file = event.target.files?.[0];
									event.target.value = "";
									if (file) openFile(file);
								}
							})
						]
					}),
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 font-mono text-xs text-muted",
						children: notice
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-baseline justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs tracking-widest text-faint uppercase",
							children: "Electromagnetic spectrum"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden font-mono text-xs text-faint sm:block",
							children: "This moment, as visible light"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "em-grid",
								style: { gridTemplateColumns: grid },
								children: EM_BANDS.map((band) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: band.id === "vis" ? "spectrum-visible" : "em-band",
									title: band.title,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `em-label ${band.id === "vis" ? "text-bg" : ""}`,
										children: band.label
									})
								}, band.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute top-0 bottom-0 w-px bg-ink transition-opacity duration-300",
								style: {
									left: `${markerLeft}%`,
									opacity: hud.silent ? 0 : 1
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pointer-events-none absolute -top-1 h-2 w-2 -translate-x-1/2 rotate-45 border border-ink transition-opacity duration-300",
								style: {
									left: `${markerLeft}%`,
									background: "var(--moment)",
									opacity: hud.silent ? 0 : 1
								}
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex justify-between font-mono text-xs text-faint",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Lower energy" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Higher energy" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm leading-relaxed text-pretty text-muted",
						children: [
							hud.line,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-faint",
								children: "Keys 1–8 strike where a note stands. Violet is the high end of visible light, not past it."
							})
						]
					})
				]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeeMusic, {});
}
//#endregion
export { Home as component };
