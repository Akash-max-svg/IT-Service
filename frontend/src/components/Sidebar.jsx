import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  LayoutDashboard,
  PlusCircle,
  Inbox,
  Headphones,
  ShieldCheck,
  Users,
  BarChart3,
  Settings,
  X,
  LifeBuoy,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'Employee';

  const sections = [];

  if (role === 'Admin') {
    sections.push({
      title: 'Governance & Analytics',
      links: [
        { to: '/admin', label: 'Executive Dashboard', icon: ShieldCheck },
        { to: '/reports', label: 'Reports & SLA Analytics', icon: BarChart3 },
        { to: '/users', label: 'User Directory', icon: Users },
      ],
    });
    sections.push({
      title: 'Incident Queue',
      links: [
        { to: '/agent', label: 'Agent Workspace', icon: Headphones },
        { to: '/my-tickets', label: 'All Incidents', icon: Inbox },
      ],
    });
    sections.push({
      title: 'Settings',
      links: [{ to: '/settings', label: 'System Configuration', icon: Settings }],
    });
  } else if (role === 'Agent') {
    sections.push({
      title: 'Support Operations',
      links: [
        { to: '/agent', label: 'Triage Center', icon: Headphones },
        { to: '/my-tickets', label: 'Incident Queue', icon: Inbox },
        { to: '/reports', label: 'SLA Performance', icon: BarChart3 },
      ],
    });
    sections.push({
      title: 'Configuration',
      links: [{ to: '/settings', label: 'Categories & Profile', icon: Settings }],
    });
  } else {
    // Employee
    sections.push({
      title: 'Self-Service Desk',
      links: [
        { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/my-tickets', label: 'My Incident History', icon: Inbox },
      ],
    });
    sections.push({
      title: 'Preferences',
      links: [{ to: '/settings', label: 'My Profile', icon: Settings }],
    });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-950/95 p-4 transition-transform duration-250 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          {/* Mobile close button */}
          <div className="flex items-center justify-between pb-2 lg:hidden border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Menu Navigation
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Submit CTA Button */}
          <div>
            <button
              onClick={() => {
                navigate('/create-ticket');
                if (onClose) onClose();
              }}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <PlusCircle className="h-4 w-4" />
              <span className="tracking-wide">Create New Ticket</span>
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-4">
            {sections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                  {sec.title}
                </p>
                <div className="space-y-0.5">
                  {sec.links.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm shadow-indigo-950/50'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Support Info */}
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950 p-3.5 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <PhoneCall className="h-3.5 w-3.5" />
            </div>
            <span>Emergency IT Line</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
            Critical outage? Call <span className="font-mono font-bold text-indigo-400">ext. 4357</span> or page standby team.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
