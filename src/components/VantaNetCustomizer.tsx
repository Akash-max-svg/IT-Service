import React, { useState } from 'react';
import { VantaSettings } from '../types/vanta';

interface VantaNetCustomizerProps {
  settings: VantaSettings;
  onChange: (newSettings: VantaSettings) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PALETTES = [
  { name: 'Cyber Cyan', color: '#3fe8d4', bg: '#080b11' },
  { name: 'Neon Emerald', color: '#10b981', bg: '#06130d' },
  { name: 'Indigo Net', color: '#6366f1', bg: '#0b0d1b' },
  { name: 'Electric Purple', color: '#c084fc', bg: '#13091e' },
  { name: 'Sunset Amber', color: '#f59e0b', bg: '#180e05' },
];

const PRESET_IMAGES = [
  {
    name: 'Cyber Matrix',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Deep Space',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Circuit Board',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
  },
  {
    name: 'Dark Mesh',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
  },
];

export function VantaNetCustomizer({
  settings,
  onChange,
  onReset,
  isOpen,
  onClose,
}: VantaNetCustomizerProps) {
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeTab, setCodeTab] = useState<'script' | 'react'>('script');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hexToIntString = (hex: string) => `0x${hex.replace('#', '')}`;

  const generatedScriptCode = `<!-- Three.js & Vanta.NET Dependencies -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"></script>

<!-- CSS: Container with Background Image -->
<style>
  .auth-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
    ${
      settings.enableBgImage
        ? `background-image: linear-gradient(rgba(0,0,0,${1 - settings.bgImageOpacity}), rgba(0,0,0,${
            1 - settings.bgImageOpacity
          })), url('${settings.bgImageUrl}');\n    background-size: cover;\n    background-position: center;`
        : `background-color: ${settings.backgroundColor};`
    }
  }
  .auth-page .vanta-canvas {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    pointer-events: none !important;
  }
</style>

<!-- Initializer: Paste into Settings -> Custom Code -> Footer Code (or page script) -->
<script>
  function setVanta() {
    if (window.VANTA && window.VANTA.NET) {
      window.VANTA.NET({
        el: ".auth-page",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: ${hexToIntString(settings.color)},
        backgroundColor: ${hexToIntString(settings.backgroundColor)},
        backgroundAlpha: ${settings.backgroundAlpha},
        points: ${settings.points.toFixed(2)},
        maxDistance: ${settings.maxDistance.toFixed(2)},
        spacing: ${settings.spacing.toFixed(2)},
        showDots: ${settings.showDots}
      });
    }
  }
  
  if (typeof _strk !== "undefined") {
    _strk.push(function() {
      setVanta();
      if (window.edit_page && window.edit_page.Event) {
        window.edit_page.Event.subscribe("Page.beforeNewOneFadeIn", setVanta);
      }
    });
  } else {
    document.addEventListener("DOMContentLoaded", setVanta);
  }
</script>`;

  const generatedReactCode = `import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import VantaNet from 'vanta/dist/vanta.net.min';

export function AuthBackground({ children }: { children?: React.ReactNode }) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).THREE = THREE;
    }

    const netInit = VantaNet.default || VantaNet;
    if (!effectRef.current && vantaRef.current) {
      effectRef.current = netInit({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: ${hexToIntString(settings.color)},
        backgroundColor: ${hexToIntString(settings.backgroundColor)},
        backgroundAlpha: ${settings.backgroundAlpha},
        points: ${settings.points},
        maxDistance: ${settings.maxDistance},
        spacing: ${settings.spacing},
        showDots: ${settings.showDots},
      });
    }

    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        ${
          settings.enableBgImage
            ? `backgroundImage: "linear-gradient(rgba(0,0,0,${
                1 - settings.bgImageOpacity
              }), rgba(0,0,0,${1 - settings.bgImageOpacity})), url('${settings.bgImageUrl}')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',`
            : `backgroundColor: '${settings.backgroundColor}',`
        }
      }}
    >
      <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
        {children}
      </div>
    </div>
  );
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="customizer-backdrop" onClick={onClose} />
      <aside className="customizer-drawer">
        <div className="customizer-header">
          <div>
            <h3>Customize Vanta.NET</h3>
            <p>Tweak colors, 3D network density, and background image</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="customizer-body">
          {/* Quick Palettes */}
          <div className="control-section">
            <label className="section-label">Color Themes</label>
            <div className="palette-grid">
              {PRESET_PALETTES.map((p) => (
                <button
                  key={p.name}
                  className={`palette-chip ${settings.color === p.color ? 'active' : ''}`}
                  onClick={() => onChange({ ...settings, color: p.color, backgroundColor: p.bg })}
                >
                  <span className="dot" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Background Color Pickers */}
          <div className="control-section">
            <label className="section-label">Colors</label>
            <div className="color-pickers-row">
              <div className="color-field">
                <span className="field-title">Network Color</span>
                <div className="picker-wrapper">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => onChange({ ...settings, color: e.target.value })}
                  />
                  <code>{settings.color}</code>
                </div>
              </div>

              <div className="color-field">
                <span className="field-title">Background Color</span>
                <div className="picker-wrapper">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
                  />
                  <code>{settings.backgroundColor}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Sliders: Points, MaxDistance, Spacing */}
          <div className="control-section">
            <label className="section-label">3D Network Geometry</label>

            <div className="slider-group">
              <div className="slider-header">
                <span>points</span>
                <strong>{settings.points}</strong>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={settings.points}
                onChange={(e) => onChange({ ...settings, points: Number(e.target.value) })}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>maxDistance</span>
                <strong>{settings.maxDistance}</strong>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="1"
                value={settings.maxDistance}
                onChange={(e) => onChange({ ...settings, maxDistance: Number(e.target.value) })}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>spacing</span>
                <strong>{settings.spacing}</strong>
              </div>
              <input
                type="range"
                min="10"
                max="25"
                step="1"
                value={settings.spacing}
                onChange={(e) => onChange({ ...settings, spacing: Number(e.target.value) })}
              />
            </div>

            <div className="checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showDots}
                  onChange={(e) => onChange({ ...settings, showDots: e.target.checked })}
                />
                <span>showDots (Display point nodes)</span>
              </label>
            </div>
          </div>

          {/* Background Image Controls */}
          <div className="control-section">
            <div className="section-header-row">
              <label className="section-label">Background Image</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableBgImage}
                  onChange={(e) => onChange({ ...settings, enableBgImage: e.target.checked })}
                />
                <span className="slider round"></span>
              </label>
            </div>

            {settings.enableBgImage && (
              <div className="bg-image-controls">
                <div className="preset-images-grid">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      className={`image-chip ${settings.bgImageUrl === img.url ? 'active' : ''}`}
                      onClick={() => onChange({ ...settings, bgImageUrl: img.url })}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>

                <div className="custom-url-field">
                  <span className="field-title">Image URL</span>
                  <input
                    type="text"
                    value={settings.bgImageUrl}
                    onChange={(e) => onChange({ ...settings, bgImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-header">
                    <span>Image Opacity</span>
                    <strong>{Math.round(settings.bgImageOpacity * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={settings.bgImageOpacity}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        bgImageOpacity: Number(e.target.value),
                        backgroundAlpha: 1 - Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="customizer-footer">
          <button className="reset-btn" onClick={onReset}>
            Reset Defaults
          </button>
          <button className="grab-code-btn" onClick={() => setShowCodeModal(true)}>
            Grab the Code ⚡
          </button>
        </div>
      </aside>

      {/* Code Modal */}
      {showCodeModal && (
        <div className="modal-backdrop" onClick={() => setShowCodeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Grab the Code</h3>
                <p>Ready to paste into Strikingly.com, HTML, or React</p>
              </div>
              <button className="close-btn" onClick={() => setShowCodeModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={`tab-btn ${codeTab === 'script' ? 'active' : ''}`}
                onClick={() => setCodeTab('script')}
              >
                HTML / Strikingly Code
              </button>
              <button
                className={`tab-btn ${codeTab === 'react' ? 'active' : ''}`}
                onClick={() => setCodeTab('react')}
              >
                React / Vite Component
              </button>
            </div>

            <div className="code-container">
              <pre>
                <code>{codeTab === 'script' ? generatedScriptCode : generatedReactCode}</code>
              </pre>
            </div>

            <div className="modal-footer">
              <button
                className="copy-btn"
                onClick={() =>
                  copyToClipboard(codeTab === 'script' ? generatedScriptCode : generatedReactCode)
                }
              >
                {copied ? '✓ Copied to Clipboard!' : 'Copy Code'}
              </button>
              <button className="close-action-btn" onClick={() => setShowCodeModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
