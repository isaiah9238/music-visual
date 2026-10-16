---
name: music-visualizer-3d
description: Build and modify audio-reactive 3D visualizers using Three.js and the Web Audio API. Use when generating frequency-driven mesh deformers, parametric particle fields, FFT audio analyzers, or microphone/file audio loops.
version: 1.0.0
---

# 3D Music Visualizer Architecture

## Mission
Construct high-performance, real-time 3D audio visualizers by binding Web Audio API frequency analysis nodes to Three.js shader uniforms and parametric geometries.

## Pipeline Architecture
1. **Audio Engine Initialization:**
   - Initialize `AudioContext` on user gesture.
   - Establish `AnalyserNode` with `fftSize` set to $2048$ (or $512$ for low-latency particle updates) and `smoothingTimeConstant: 0.8`.
   - Support both HTML5 `<audio>` element streams (`MediaElementAudioSourceNode`) and live microphone input (`MediaStreamAudioSourceNode`).
2. **Signal Decomposition:**
   - Split frequency spectra into discrete sub-bands:
     - **Sub-Bass / Kick:** $20 - 100\text{ Hz}$ (mapped to scale pulse, bloom, and impulse displacement).
     - **Mid-Range:** $250 - 2000\text{ Hz}$ (mapped to mesh twist, wireframe displacement, and surface wave frequency).
     - **Treble / Air:** $4000 - 16000\text{ Hz}$ (mapped to high-frequency particle jitter and neon color transitions).
3. **GPU Render Loop Integration:**
   - Do NOT rebuild buffer geometry every frame.
   - Pass FFT byte arrays into GLSL custom shaders via dynamic uniforms (`uniform float uBass;`, `uniform float uTime;`) or `DataTexture` for complete frequency arrays.
   - Target 60 FPS update loop inside `requestAnimationFrame`.

## Verification Gate
- Verify that `audioContext.resume()` triggers on explicit user click/tap to bypass browser autoplay blocks.
- Ensure audio analysis nodes disconnect and contexts close on scene unmount to prevent audio thread memory leaks.