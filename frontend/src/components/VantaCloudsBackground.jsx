import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import VantaClouds from 'vanta/dist/vanta.clouds.min';

/**
 * VantaCloudsBackground Component
 * Renders the requested interactive 3D Vanta Clouds effect across all roles (Admin, Agent, Employee)
 * Supports mouseControls, touchControls, and responsive auto-resizing.
 */
const VantaCloudsBackground = () => {
  const vantaRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    // Ensure THREE is globally available on window for Vanta
    if (typeof window !== 'undefined') {
      window.THREE = THREE;
    }

    const initClouds =
      (window.VANTA && window.VANTA.CLOUDS) ||
      (VantaClouds && (VantaClouds.default || VantaClouds));

    const createEffect = () => {
      if (!effectRef.current && vantaRef.current) {
        try {
          const cloudsFunc =
            (window.VANTA && window.VANTA.CLOUDS) ||
            (VantaClouds && (VantaClouds.default || VantaClouds));

          if (typeof cloudsFunc === 'function') {
            // Clean up any stray child elements before creating canvas
            vantaRef.current.innerHTML = '';

            effectRef.current = cloudsFunc({
              el: vantaRef.current,
              THREE: THREE,
              mouseControls: true,
              touchControls: false, // Prevents hijacking touchpad/touch gesture scrolling
              gyroControls: false,
              minHeight: 200.0,
              minWidth: 200.0,
              scale: 3.0, // High-performance optimization (prevents GPU throttling & browser freezing)
              scaleMobile: 8.0,
              speed: 0.8,
              skyColor: 0x68b8d7,
              cloudColor: 0xadc1de,
              cloudShadowColor: 0x183550,
              sunColor: 0xff9919,
              sunGlareColor: 0xff6633,
              sunlightColor: 0xff9933,
            });
          }
        } catch (err) {
          console.warn('Vanta Clouds initialization warning:', err);
        }
      }
    };

    if (initClouds) {
      createEffect();
    } else {
      const timer = setTimeout(createEffect, 150);
      return () => clearTimeout(timer);
    }

    return () => {
      if (effectRef.current) {
        try {
          effectRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        effectRef.current = null;
      }
      if (vantaRef.current) {
        vantaRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      id="vanta-clouds-bg"
      ref={vantaRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};

export default VantaCloudsBackground;
