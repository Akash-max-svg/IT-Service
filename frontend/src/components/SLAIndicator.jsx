import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

const SLAIndicator = ({ ticket, type = 'resolution', showBar = false }) => {
  if (!ticket) return null;

  const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const targetDate = type === 'response' ? ticket.responseDueAt : ticket.resolutionDueAt;
  const isBreached = type === 'response' ? ticket.isResponseBreached : ticket.isResolutionBreached;

  if (isResolved && type === 'resolution') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        <span>SLA Met</span>
      </span>
    );
  }

  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40 animate-pulse">
        <ShieldAlert className="h-3 w-3 text-rose-400" />
        <span>SLA Breached</span>
      </span>
    );
  }

  if (!targetDate) {
    return <span className="text-xs text-slate-500">—</span>;
  }

  const now = new Date().getTime();
  const due = new Date(targetDate).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40">
        <AlertTriangle className="h-3 w-3 text-rose-400" />
        <span>Breached</span>
      </span>
    );
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const isUrgent = hours === 0 && minutes < 60;
  const isModerate = hours < 4;

  const colorClass = isUrgent
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : isModerate
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
    : 'bg-slate-800/80 text-slate-300 border-slate-700/60';

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-mono font-medium ${colorClass}`}
      >
        <Clock className={`h-3 w-3 ${isUrgent ? 'text-rose-400 animate-spin-slow' : 'text-slate-400'}`} />
        <span>
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} left
        </span>
      </span>
    </div>
  );
};

export default SLAIndicator;
