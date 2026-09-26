import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  Headphones,
  FileText,
  Lock,
  PhoneCall,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';

const Footer = () => {
  const location = useLocation();
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  // Identify active portal context
  let portalTitle = 'Enterprise IT Service Desk';
  let portalBadge = 'Global Operations';

  if (location.pathname.startsWith('/admin') || role === 'Admin') {
    portalTitle = 'Executive Admin Command & Governance Console';
    portalBadge = 'Admin Control Tier';
  } else if (location.pathname.startsWith('/agent') || role === 'Agent') {
    portalTitle = 'Agent Incident Resolution & Triage Center';
    portalBadge = 'Tier-1 & Tier-2 Support';
  } else if (location.pathname.startsWith('/dashboard') || role === 'Employee') {
    portalTitle = 'Employee Self-Service IT Portal';
    portalBadge = 'Employee Workplace Services';
  }

  return (
    <footer className="w-full mt-auto relative z-20 border-t-2 border-[#b8860b]/70 bg-gradient-to-r from-[#d4af37] via-[#f3cf65] to-[#c59b27] text-slate-950 shadow-[0_-8px_32px_rgba(212,175,55,0.3)]">
      {/* Top Accent Shimmer Line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#b8860b] via-[#fff3b0] to-[#b8860b] opacity-90" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Portal Context */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-400 shadow-md ring-2 ring-black/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-black text-sm text-slate-950 tracking-tight">
                  IT Service Desk OS
                </span>
                <span className="rounded-full bg-slate-950/15 border border-slate-950/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">
                  {portalBadge}
                </span>
                <span className="rounded-full bg-emerald-600/20 border border-emerald-700/30 px-2 py-0.5 text-[10px] font-bold text-emerald-950 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-900/90 font-medium mt-0.5">
                {portalTitle} • Enterprise SLA Compliance & Lifecycle Management
              </p>
            </div>
          </div>

          {/* SLA & Quick Support Status */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-black/10 border border-black/15 px-3.5 py-2 text-xs font-bold text-slate-950 backdrop-blur-sm shadow-sm">
              <Activity className="h-4 w-4 text-emerald-800" />
              <span>99.98% Service Uptime</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl bg-black/10 border border-black/15 px-3.5 py-2 text-xs font-bold text-slate-950 backdrop-blur-sm shadow-sm">
              <PhoneCall className="h-3.5 w-3.5 text-slate-950" />
              <span>
                IT Hotline: <strong className="font-mono text-slate-950 font-black">ext. 4357</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Footer Divider */}
        <div className="mt-5 pt-4 border-t border-black/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-900/80 font-semibold">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <span>© {new Date().getFullYear()} Enterprise IT Helpdesk. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-900/40">•</span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-950" /> 256-Bit TLS Encrypted
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/my-tickets"
              className="text-slate-950 hover:text-black font-bold underline-offset-2 hover:underline transition-colors"
            >
              My Incident History
            </Link>
            <span className="text-slate-900/40">•</span>
            <Link
              to="/settings"
              className="text-slate-950 hover:text-black font-bold underline-offset-2 hover:underline transition-colors"
            >
              System Preferences
            </Link>
            <span className="text-slate-900/40">•</span>
            <span className="font-mono text-[10px] bg-slate-950/15 px-2 py-0.5 rounded-lg border border-black/15 text-slate-950 font-bold">
              v2.4.0-GOLD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
