import React from 'react';
import AeroShards from './AeroShards';

/**
 * Reusable AeroBackground Component
 * Wraps the exact AeroShards configuration in a fixed, non-blocking background layer
 * for Admin, Agent, and Employee dashboard layouts.
 */
const AeroBackground = () => {
  return (
    <div
      className="fixed inset-0 w-full h-full z-0 pointer-events-none select-none overflow-hidden"
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
    >
      <AeroShards
        backgroundColor="#0f0c13"
        shardColor="#8f68d0"
        accentColor="#652288"
        placement="full"
        material="pearl"
        detail="balanced"
        effect="none"
        flow="stream"
        rippleIntensity={1}
        holdToGather
        scale={1}
        spread={1}
        depth={1}
        speed={1}
        spin={1}
        interaction="repel"
        density={1.5}
        shardSize={1.1}
        stretch={1}
        turbulence={1}
        glow={1}
        edgeSoftness={2}
        bloom={0.5}
        grain={0.05}
        chromaticAberration={0.0075}
        transitionDuration={1}
        interactionRadius={1.5}
        interactionStrength={0.5}
        paused={false}
      />
    </div>
  );
};

export default AeroBackground;
