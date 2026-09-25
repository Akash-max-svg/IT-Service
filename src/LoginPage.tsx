import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import VantaNet from 'vanta/dist/vanta.net.min';
import { VantaSettings } from './types/vanta';

interface LoginPageProps {
  settings: VantaSettings;
  onNavigateToSignUp: () => void;
  onLoginSuccess?: (user: { name: string; role: string }) => void;
}

export function LoginPage({
  settings,
  onNavigateToSignUp,
  onLoginSuccess,
}: LoginPageProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize or update Vanta effect when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).THREE = THREE;
    }

    const netInit = VantaNet.default || VantaNet;
    const colorNum = parseInt(settings.color.replace('#', '0x'), 16);
    const bgNum = parseInt(settings.backgroundColor.replace('#', '0x'), 16);

    if (!effectRef.current && vantaRef.current) {
      try {
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
          color: colorNum,
          backgroundColor: bgNum,
          backgroundAlpha: settings.enableBgImage ? settings.backgroundAlpha : 1,
          points: settings.points,
          maxDistance: settings.maxDistance,
          spacing: settings.spacing,
          showDots: settings.showDots,
        });
      } catch (err) {
        console.error('Failed to initialize Vanta.NET on LoginPage:', err);
      }
    } else if (effectRef.current) {
      try {
        effectRef.current.setOptions({
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
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
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

  const handleDemoAccount = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Demo@123');
    setMessage({
      text: `Demo account populated: ${demoRole} (${demoEmail})`,
      type: 'success',
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ text: 'Please fill in both email and password.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    setTimeout(() => {
      setLoading(false);
      setMessage({ text: `Welcome back, ${email.split('@')[0]}!`, type: 'success' });
      if (onLoginSuccess) {
        onLoginSuccess({ name: email.split('@')[0], role: 'Member' });
      }
    }, 600);
  };

  return (
    <div className="auth-page-wrapper" ref={vantaRef}>
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

      {/* Foreground Form Card */}
      <div className="auth-overlay">
        <div className="auth-card">
          <div className="auth-header">
            <div className="badge-tag">ServiceDesk Portal</div>
            <h2>Sign In</h2>
            <p>Access your student & incident management dashboard</p>
          </div>

          {/* 1-Click Demo Accounts */}
          <div className="demo-accounts-box">
            <span className="demo-label">1-Click Demo Logins</span>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => handleDemoAccount('admin@servicedesk.com', 'Admin')}
              >
                Admin
              </button>
              <button
                type="button"
                className="demo-btn agent"
                onClick={() => handleDemoAccount('agent@servicedesk.com', 'Agent')}
              >
                Agent
              </button>
              <button
                type="button"
                className="demo-btn employee"
                onClick={() => handleDemoAccount('student@servicedesk.com', 'Student')}
              >
                Student
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className={`form-feedback ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer-link">
            <span>Don't have an account?</span>{' '}
            <button type="button" className="link-btn" onClick={onNavigateToSignUp}>
              Sign up here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
