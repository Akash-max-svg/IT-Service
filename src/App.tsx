import React, { useEffect, useState } from 'react';
import { SignUpPage } from './SignUpPage';

interface Student {
  id: number;
  name: string;
  age: number;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'signup' | 'students'>('signup');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

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
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up Page
          </button>
          <button
            className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Students Directory
          </button>
        </div>
      </nav>

      {activeTab === 'signup' ? (
        <SignUpPage onSuccess={() => fetchStudents()} />
      ) : (
        <div className="directory-page">
          <div className="directory-container">
            <div className="directory-header">
              <h2>Registered Students</h2>
              <p>Active records served from Express REST API (<code>/api/students</code>)</p>
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
    </div>
  );
}
