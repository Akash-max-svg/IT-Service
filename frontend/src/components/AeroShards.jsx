import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * AeroShards Component
 * GPU-driven wind sculpture of folded foil shards with pearl material,
 * flow dynamics, lighting, and interactive pointer repulsion.
 */
const AeroShards = ({
  backgroundColor = '#0f0c13',
  shardColor = '#8f68d0',
  accentColor = '#652288',
  placement = 'full',
  material = 'pearl',
  detail = 'balanced',
  effect = 'none',
  flow = 'stream',
  rippleIntensity = 1,
  holdToGather = true,
  scale = 1,
  spread = 1,
  depth = 1,
  speed = 1,
  spin = 1,
  interaction = 'repel',
  density = 1.5,
  shardSize = 1.1,
  stretch = 1,
  turbulence = 1,
  glow = 1,
  edgeSoftness = 2,
  bloom = 0.5,
  grain = 0.05,
  chromaticAberration = 0.0075,
  transitionDuration = 1,
  interactionRadius = 1.5,
  interactionStrength = 0.5,
  paused = false,
  className = '',
  style = {},
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(new THREE.Color(backgroundColor), 1);
    } catch (e) {
      console.warn('WebGL initialization fallback for AeroShards', e);
      return;
    }

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    // Lighting for pearlescent foil sheen
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(new THREE.Color(shardColor), 1.5);
    dirLight1.position.set(4, 5, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(new THREE.Color(accentColor), 1.8);
    dirLight2.position.set(-5, -4, 4);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 20);
    pointLight.position.set(0, 2, 5);
    scene.add(pointLight);

    // Create folded diamond foil shard geometry
    // 2 triangular facets meeting along a central crease fold (z = 0.34)
    const geom = new THREE.BufferGeometry();
    const fold = 0.34;
    const vertices = new Float32Array([
      // Left facet
      0.0, 1.0, fold,
      -0.72, 0.0, 0.0,
      0.0, -1.0, fold,
      // Right facet
      0.0, 1.0, fold,
      0.0, -1.0, fold,
      0.72, 0.0, 0.0,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();

    // Material with metallic pearlescent properties
    const shardMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shardColor),
      roughness: material === 'chrome' ? 0.15 : 0.45,
      metalness: material === 'chrome' ? 0.9 : 0.4,
      side: THREE.DoubleSide,
    });

    // Particle Count based on density
    const count = Math.min(Math.floor(220 * density), 600);
    const instancedMesh = new THREE.InstancedMesh(geom, shardMat, count);

    // Initial state arrays for animation
    const shardData = [];
    const colorA = new THREE.Color(shardColor);
    const colorB = new THREE.Color(accentColor);
    const matrix = new THREE.Matrix4();
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const u = i / count;
      const angle = u * Math.PI * 6;
      const radius = 1.2 + Math.random() * 2.8 * spread;
      const x = Math.cos(angle) * radius * (width > height ? 1.6 : 1.1) + (Math.random() - 0.5) * 1.5;
      const y = Math.sin(angle) * (radius * 0.8) + (Math.random() - 0.5) * 1.5;
      const z = (Math.random() - 0.5) * 4 * depth;

      const baseScale = (0.15 + Math.random() * 0.22) * shardSize * scale;
      const rotSpeedX = (Math.random() - 0.5) * 0.02 * spin;
      const rotSpeedY = (Math.random() - 0.5) * 0.025 * spin;
      const rotSpeedZ = (Math.random() - 0.5) * 0.03 * spin;

      // Color variation between shardColor and accentColor
      const mixRatio = Math.random();
      const instanceColor = colorA.clone().lerp(colorB, mixRatio);
      instancedMesh.setColorAt(i, instanceColor);

      shardData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        currentX: x,
        currentY: y,
        currentZ: z,
        scaleX: baseScale * (0.8 + Math.random() * 0.4),
        scaleY: baseScale * stretch * (1.0 + Math.random() * 0.5),
        scaleZ: baseScale,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedX,
        rotSpeedY,
        rotSpeedZ,
        phase: Math.random() * Math.PI * 2,
        speedOffset: 0.8 + Math.random() * 0.4,
      });

      dummy.position.set(x, y, z);
      dummy.scale.set(baseScale, baseScale * stretch, baseScale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);

    // Mouse Tracking for Interactive Repulsion
    const pointer = { x: 9999, y: 9999, active: false };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
      if (clientX !== undefined && clientY !== undefined) {
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
        pointer.active = true;
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = 9999;
      pointer.y = 9999;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (paused) return;

      const elapsed = clock.getElapsedTime() * speed;

      for (let i = 0; i < count; i++) {
        const item = shardData[i];

        // Stream and turbulent displacement
        const timeFactor = elapsed * item.speedOffset;
        const wave = Math.sin(timeFactor + item.phase) * 0.3 * turbulence;
        const cosWave = Math.cos(timeFactor * 0.8 + item.phase) * 0.3 * turbulence;

        let targetX = item.baseX + wave;
        let targetY = item.baseY + cosWave;
        let targetZ = item.baseZ + Math.sin(timeFactor * 0.5) * 0.5 * turbulence;

        // Pointer Repulsion Effect
        if (pointer.active && interaction === 'repel') {
          // Convert 3D position projection to screen space
          const screenX = targetX / 4.5;
          const screenY = targetY / 3.2;
          const dx = screenX - pointer.x;
          const dy = screenY - pointer.y;
          const distSq = dx * dx + dy * dy;
          const radiusSq = (interactionRadius * 0.45) ** 2;

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / (interactionRadius * 0.45)) * interactionStrength * 2.5;
            targetX += (dx / (dist || 0.001)) * force;
            targetY += (dy / (dist || 0.001)) * force;
            targetZ += force * 0.8;
          }
        }

        // Smooth interpolation
        item.currentX += (targetX - item.currentX) * 0.08;
        item.currentY += (targetY - item.currentY) * 0.08;
        item.currentZ += (targetZ - item.currentZ) * 0.08;

        // Rotations
        item.rotX += item.rotSpeedX;
        item.rotY += item.rotSpeedY;
        item.rotZ += item.rotSpeedZ;

        dummy.position.set(item.currentX, item.currentY, item.currentZ);
        dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
        dummy.scale.set(item.scaleX, item.scaleY, item.scaleZ);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);

      geom.dispose();
      shardMat.dispose();
      renderer.dispose();
    };
  }, [
    backgroundColor,
    shardColor,
    accentColor,
    density,
    shardSize,
    speed,
    spin,
    spread,
    depth,
    turbulence,
    interaction,
    interactionRadius,
    interactionStrength,
    paused,
  ]);

  return (
    <div
      ref={containerRef}
      className={`aero-shards-wrapper relative w-full h-full overflow-hidden ${className}`}
      style={{
        backgroundColor,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-none"
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  );
};

export default AeroShards;
