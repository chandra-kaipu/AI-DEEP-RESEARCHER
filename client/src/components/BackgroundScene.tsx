import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BackgroundSceneProps {
  isResearching?: boolean;
  isDark?: boolean;
}

export const BackgroundScene: React.FC<BackgroundSceneProps> = ({
  isResearching = false,
  isDark = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Color definitions
    const primaryColor = new THREE.Color('#D97757'); // Clay terracotta
    const secondaryColor = new THREE.Color('#8C9C7C'); // Muted sage
    const tertiaryColor = new THREE.Color('#5B7C99'); // Dusty blue
    const darkLineColor = new THREE.Color('#E3DDCD');

    // Soft organic background plane with dynamic gradient
    const bgPlaneGeo = new THREE.PlaneGeometry(600, 400, 16, 16);
    const bgUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uDark: { value: isDark ? 1.0 : 0.0 },
      uResearching: { value: isResearching ? 1.0 : 0.0 },
    };

    const bgMat = new THREE.ShaderMaterial({
      uniforms: bgUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uDark;
        uniform float uResearching;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          
          // Organic shifting centers
          vec2 c1 = vec2(0.3 + sin(uTime * 0.2) * 0.15, 0.3 + cos(uTime * 0.15) * 0.15);
          vec2 c2 = vec2(0.7 + cos(uTime * 0.25) * 0.15, 0.7 + sin(uTime * 0.18) * 0.15);
          vec2 c3 = vec2(uMouse.x, 1.0 - uMouse.y);

          float d1 = length(uv - c1);
          float d2 = length(uv - c2);
          float d3 = length(uv - c3);

          // Warm paper or dark ink background base
          vec3 baseBg = uDark > 0.5 ? vec3(0.149, 0.149, 0.141) : vec3(0.961, 0.949, 0.918); // #F5F2EA
          vec3 terracotta = vec3(0.851, 0.467, 0.341); // #D97757
          vec3 sage = vec3(0.549, 0.612, 0.486); // #8C9C7C

          float intensity1 = smoothstep(0.7, 0.0, d1) * (uResearching > 0.5 ? 0.28 : 0.16);
          float intensity2 = smoothstep(0.65, 0.0, d2) * (uResearching > 0.5 ? 0.24 : 0.12);
          float intensity3 = smoothstep(0.5, 0.0, d3) * (uResearching > 0.5 ? 0.15 : 0.07);

          vec3 color = mix(baseBg, terracotta, intensity1);
          color = mix(color, sage, intensity2);
          color = mix(color, terracotta, intensity3);

          gl_FragColor = vec4(color, 0.92);
        }
      `,
      depthWrite: false,
    });

    const bgMesh = new THREE.Mesh(bgPlaneGeo, bgMat);
    bgMesh.position.z = -20;
    scene.add(bgMesh);

    // Particle Synapse Network
    const particleCount = 85;
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];
    const originalPositions: { x: number; y: number; z: number }[] = [];

    const boundsX = 180;
    const boundsY = 110;

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * boundsX * 2;
      const y = (Math.random() - 0.5) * boundsY * 2;
      const z = (Math.random() - 0.5) * 40;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions.push({ x, y, z });

      const speedMult = prefersReducedMotion ? 0.05 : 0.35;
      velocities.push({
        x: (Math.random() - 0.5) * speedMult,
        y: (Math.random() - 0.5) * speedMult,
        z: (Math.random() - 0.5) * 0.1,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: primaryColor,
      size: 4.5,
      transparent: true,
      opacity: isDark ? 0.7 : 0.6,
      blending: THREE.NormalBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Synapse Lines
    const maxConnections = particleCount * 6;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending,
      linewidth: 1,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // Mouse coordinates in normalized [-1, 1] and World units
    const mousePos = { x: 0, y: 0, worldX: 0, worldY: 0, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.x = nx;
      mousePos.y = ny;
      mousePos.active = true;

      // Project into world coordinates
      mousePos.worldX = (nx * boundsX) / 1.5;
      mousePos.worldY = (ny * boundsY) / 1.5;

      bgUniforms.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height
      );
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update shader uniforms
      bgUniforms.uTime.value = elapsedTime;
      bgUniforms.uDark.value = isDark ? 1.0 : 0.0;
      bgUniforms.uResearching.value = isResearching ? 1.0 : 0.0;

      // Dynamics multiplier when research in flight
      const researchSpeed = isResearching ? 2.2 : 1.0;
      const motionMult = prefersReducedMotion ? 0.05 : 1.0;

      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Update particles
      for (let i = 0; i < particleCount; i++) {
        let px = posArray[i * 3];
        let py = posArray[i * 3 + 1];
        let pz = posArray[i * 3 + 2];

        // Normal drift
        px += velocities[i].x * researchSpeed * motionMult;
        py += velocities[i].y * researchSpeed * motionMult;

        // Soft bounce boundaries
        if (px < -boundsX || px > boundsX) velocities[i].x *= -1;
        if (py < -boundsY || py > boundsY) velocities[i].y *= -1;

        // Mouse gentle repulsion
        if (!prefersReducedMotion && mousePos.active) {
          const dx = px - mousePos.worldX;
          const dy = py - mousePos.worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 45) {
            const force = (45 - dist) * 0.035;
            px += (dx / dist) * force;
            py += (dy / dist) * force;
          }
        }

        posArray[i * 3] = px;
        posArray[i * 3 + 1] = py;
        posArray[i * 3 + 2] = pz;
      }
      posAttr.needsUpdate = true;

      // Update synapse network lines
      let lineIndex = 0;
      const connectionDist = isResearching ? 46 : 38;
      const lPos = lineGeometry.attributes.position as THREE.BufferAttribute;
      const lCol = lineGeometry.attributes.color as THREE.BufferAttribute;
      const lPosArr = lPos.array as Float32Array;
      const lColArr = lCol.array as Float32Array;

      // Research pulse color
      const pulseVal = Math.sin(elapsedTime * 6) * 0.5 + 0.5;
      const activeColor = isResearching ? primaryColor : (isDark ? tertiaryColor : secondaryColor);

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (lineIndex >= maxConnections * 6) break;

          const x1 = posArray[i * 3];
          const y1 = posArray[i * 3 + 1];
          const z1 = posArray[i * 3 + 2];

          const x2 = posArray[j * 3];
          const y2 = posArray[j * 3 + 1];
          const z2 = posArray[j * 3 + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDist) {
            // Line points
            lPosArr[lineIndex] = x1;
            lPosArr[lineIndex + 1] = y1;
            lPosArr[lineIndex + 2] = z1;
            lPosArr[lineIndex + 3] = x2;
            lPosArr[lineIndex + 4] = y2;
            lPosArr[lineIndex + 5] = z2;

            // Line colors
            const alpha = 1.0 - dist / connectionDist;
            const r = activeColor.r * (isResearching ? (0.8 + 0.4 * pulseVal) : 1);
            const g = activeColor.g;
            const b = activeColor.b;

            lColArr[lineIndex] = r * alpha;
            lColArr[lineIndex + 1] = g * alpha;
            lColArr[lineIndex + 2] = b * alpha;
            lColArr[lineIndex + 3] = r * alpha;
            lColArr[lineIndex + 4] = g * alpha;
            lColArr[lineIndex + 5] = b * alpha;

            lineIndex += 6;
          }
        }
      }

      lineGeometry.setDrawRange(0, lineIndex / 3);
      lPos.needsUpdate = true;
      lCol.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bgPlaneGeo.dispose();
      bgMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isResearching, isDark]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none opacity-30 dark:opacity-40 transition-opacity duration-500"
      aria-hidden="true"
    />
  );
};
