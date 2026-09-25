import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

/**
 * SLAIndicator Component
 * Features a real-time rolling timer for the 2-day (48-hour) agent resolution target window.
 */
const SLAIndicator = ({ ticket, type = 'resolution', showBar = false }) => {
  const [now, setNow] = useState(Date.now());

  // Real-time rolling clock: updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!ticket) return null;

  const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket.status);

  // If resolutionDueAt is not explicitly set, default to 2 days (48 hours) from ticket creation
  const createdTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000; // 48 hours = 2 days
  const defaultResolutionDue = createdTime + twoDaysMs;

  const targetDate =
    type === 'response'
      ? ticket.responseDueAt
      : ticket.resolutionDueAt || new Date(defaultResolutionDue);

  const isBreached =
    type === 'response'
      ? ticket.isResponseBreached
      : ticket.isResolutionBreached || (now > new Date(targetDate).getTime() && !isResolved);

  if (isResolved && type === 'resolution') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        <span>Solved / SLA Met</span>
      </span>
    );
  }

  if (isBreached) {
    const overdueMs = now - new Date(targetDate).getTime();
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <span
        title="Agent resolution target of 2 days has been exceeded"
        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-300 shadow-sm animate-pulse font-mono"
      >
        <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
        <span>Breached (+{overdueHours > 0 ? `${overdueHours}h ` : ''}{overdueMins}m)</span>
      </span>
    );
  }

  const due = new Date(targetDate).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-300 font-mono">
        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
        <span>2d Target Breached</span>
      </span>
    );
  }

  // Calculate Rolling Time Units: Days, Hours, Minutes, Seconds
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const isUrgent = days === 0 && hours < 4;
  const isModerate = days === 0;

  const colorClass = isUrgent
    ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-rose-100'
    : isModerate
    ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-amber-100'
    : 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm';

  // Format Rolling Timer String
  let rollingTimer = '';
  if (days > 0) {
    rollingTimer = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    rollingTimer = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    rollingTimer = `${minutes}m ${seconds}s`;
  }

  return (
    <div className="inline-flex items-center gap-1" title="2-Day (48h) Agent Resolution Target">
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold shadow-sm transition-colors ${colorClass}`}
      >
        <Clock className={`h-3.5 w-3.5 shrink-0 ${isUrgent ? 'text-rose-600 animate-spin' : 'text-amber-600'}`} />
        <span>{rollingTimer}</span>
        <span className="text-[9px] uppercase font-sans tracking-wide px-1 py-0.2 rounded bg-amber-200/50 text-amber-900 ml-0.5">
          2d Target
        </span>
      </span>
    </div>
  );
};

export default SLAIndicator;
