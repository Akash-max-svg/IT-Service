import React, { useEffect, useState } from 'react';
import { SignUpPage } from './SignUpPage';
import { LoginPage } from './LoginPage';
import { VantaNetCustomizer } from './components/VantaNetCustomizer';
import { VantaSettings, DEFAULT_VANTA_SETTINGS } from './types/vanta';

interface Student {
  id: number;
  name: string;
  age: number;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'signup' | 'login' | 'students'>('signup');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [vantaSettings, setVantaSettings] = useState<VantaSettings>(DEFAULT_VANTA_SETTINGS);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error('Failed to fetch students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-dot"></span>
          <span>FSD2 Portal</span>
        </div>

        <div className="nav-center">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
            <button
              className={`nav-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In (Login)
            </button>
            <button
              className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Students Directory
            </button>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className="customize-trigger-btn"
            onClick={() => setCustomizerOpen(true)}
            title="Customize Vanta.NET parameters & Grab Code"
          >
            <span className="sparkle-icon">✨</span>
            <span>Customize Vanta.NET</span>
          </button>
        </div>
      </nav>

      {/* Pages */}
      <main className="content-area">
        {activeTab === 'signup' && (
          <SignUpPage
            settings={vantaSettings}
            onSuccess={() => fetchStudents()}
            onNavigateToLogin={() => setActiveTab('login')}
          />
        )}

        {activeTab === 'login' && (
          <LoginPage
            settings={vantaSettings}
            onNavigateToSignUp={() => setActiveTab('signup')}
            onLoginSuccess={() => setActiveTab('students')}
          />
        )}

        {activeTab === 'students' && (
          <div className="directory-page">
            <div className="directory-container">
              <div className="directory-header">
                <h2>Registered Students</h2>
                <p>Live records served from Express REST API (<code>/api/students</code>)</p>
              </div>

              {loading ? (
                <p className="loading-text">Loading student records...</p>
              ) : students.length === 0 ? (
                <p className="empty-text">No students registered yet. Go to the Sign Up page to add one!</p>
              ) : (
                <div className="students-grid">
                  {students.map((student) => (
                    <div key={student.id} className="student-card">
                      <div className="student-avatar">{student.name.charAt(0).toUpperCase()}</div>
                      <div className="student-info">
                        <h3>{student.name}</h3>
                        <p>Age: {student.age}</p>
                        <span className="student-id">ID: #{student.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Live Customizer Drawer */}
      <VantaNetCustomizer
        settings={vantaSettings}
        onChange={setVantaSettings}
        onReset={() => setVantaSettings(DEFAULT_VANTA_SETTINGS)}
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
      />
    </div>
  );
}
