import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import VantaNet from 'vanta/dist/vanta.net.min';
import { VantaSettings } from './types/vanta';

interface SignUpPageProps {
  settings: VantaSettings;
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export function SignUpPage({ settings, onSuccess, onNavigateToLogin }: SignUpPageProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Ensure THREE is globally available for Vanta
    if (typeof window !== 'undefined') {
      (window as any).THREE = THREE;
    }

    const netInit = VantaNet.default || VantaNet;
    const colorNum = parseInt(settings.color.replace('#', '0x'), 16);
    const bgNum = parseInt(settings.backgroundColor.replace('#', '0x'), 16);

    if (!vantaEffectRef.current && vantaRef.current) {
      try {
        vantaEffectRef.current = netInit({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: colorNum,
          backgroundColor: bgNum,
          backgroundAlpha: settings.enableBgImage ? settings.backgroundAlpha : 1,
          points: settings.points,
          maxDistance: settings.maxDistance,
          spacing: settings.spacing,
          showDots: settings.showDots,
        });
      } catch (err) {
        console.error('Failed to initialize Vanta.NET:', err);
      }
    } else if (vantaEffectRef.current) {
      try {
        vantaEffectRef.current.setOptions({
          color: colorNum,
          backgroundColor: bgNum,
          backgroundAlpha: settings.enableBgImage ? settings.backgroundAlpha : 1,
          points: settings.points,
          maxDistance: settings.maxDistance,
          spacing: settings.spacing,
          showDots: settings.showDots,
        });
      } catch (err) {
        console.error('Failed to update Vanta options:', err);
      }
    }

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, [
    settings.color,
    settings.backgroundColor,
    settings.backgroundAlpha,
    settings.points,
    settings.maxDistance,
    settings.spacing,
    settings.showDots,
    settings.enableBgImage,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age) {
      setMessage({ text: 'Please fill in all fields.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), age: Number(age) }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ text: `Student "${data.name}" registered successfully!`, type: 'success' });
        setName('');
        setAge('');
        if (onSuccess) onSuccess();
      } else {
        setMessage({ text: 'Failed to sign up. Please try again.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page" ref={vantaRef}>
      {/* Background Image Layer */}
      {settings.enableBgImage && (
        <div
          className="vanta-bg-image-layer"
          style={{
            backgroundImage: `url('${settings.bgImageUrl}')`,
            opacity: settings.bgImageOpacity,
          }}
        />
      )}

      <div className="signup-overlay">
        <div className="signup-card">
          <div className="signup-header">
            <h2>Sign Up</h2>
            <p>Create your student registration profile</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="student-name">Student Name</label>
              <input
                id="student-name"
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-age">Student Age</label>
              <input
                id="student-age"
                type="number"
                placeholder="Enter age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min="1"
                max="120"
              />
            </div>

            {message && (
              <div className={`form-feedback ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Complete Sign Up'}
            </button>
          </form>

          {onNavigateToLogin && (
            <div className="auth-footer-link" style={{ marginBottom: 16 }}>
              <span>Already registered?</span>{' '}
              <button type="button" className="link-btn" onClick={onNavigateToLogin}>
                Sign in here
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
