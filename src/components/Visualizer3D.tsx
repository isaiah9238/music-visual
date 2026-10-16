import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AudioAnalyzer } from '../lib/audioAnalyzer';

interface Visualizer3DProps {
  analyzer: AudioAnalyzer;
  isPlaying: boolean;
}

export const Visualizer3D: React.FC<Visualizer3DProps> = ({ analyzer, isPlaying }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, and WebGL Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x11111b, 0.035);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x89b4fa, 2, 20);
    pointLight.position.set(2, 4, 5);
    scene.add(pointLight);

    const bassLight = new THREE.PointLight(0xf38ba8, 0, 15);
    bassLight.position.set(-3, -2, 2);
    scene.add(bassLight);

    // 3. Central Wireframe Mesh (Reactive Core)
    const geometry = new THREE.IcosahedronGeometry(2.2, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x89b4fa,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coreMesh = new THREE.Mesh(geometry, material);
    scene.add(coreMesh);

    // 4. Particle Starfield
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 30;
      positions[i + 1] = (Math.random() - 0.5) * 30;
      positions[i + 2] = (Math.random() - 0.5) * 30;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xcba6f7,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Reactive Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Query real-time frequency bands from the Web Audio Analyzer
      const { bass, mid, treble } = analyzer.getEnergyLevels();

      // Base rotation modulated by mid frequencies
      coreMesh.rotation.x = elapsedTime * 0.2 + mid * 0.4;
      coreMesh.rotation.y = elapsedTime * 0.3 + mid * 0.6;

      // Scale core mesh on low-end bass hits (exponential expansion)
      const targetScale = 1.0 + Math.pow(bass, 1.8) * 0.9;
      coreMesh.scale.set(targetScale, targetScale, targetScale);

      // Modulate point light intensities based on spectrum energy
      bassLight.intensity = Math.pow(bass, 2) * 5.0;
      pointLight.intensity = 1.5 + treble * 3.0;

      // Rotate particle field
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Viewport Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 7. Cleanup & Resource Disposal on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [analyzer]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-hidden bg-[#11111b]"
    />
  );
};

export default Visualizer3D;