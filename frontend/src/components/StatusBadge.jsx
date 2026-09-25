import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  HelpCircle, 
  RotateCcw, 
  Archive, 
  Flame 
} from 'lucide-react';

const statusConfig = {
  OPEN: {
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-sm shadow-blue-500/5',
    dot: 'bg-blue-400',
    icon: HelpCircle,
    label: 'Open',
  },
  ASSIGNED: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-sm shadow-sky-500/5',
    dot: 'bg-sky-400',
    icon: UserCheck,
    label: 'Assigned',
  },
  'IN PROGRESS': {
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10',
    dot: 'bg-amber-400 animate-pulse',
    icon: Clock,
    label: 'In Progress',
  },
  'WAITING FOR USER': {
    bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/5',
    dot: 'bg-purple-400',
    icon: AlertCircle,
    label: 'Waiting on User',
  },
  ESCALATED: {
    bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30',
    dot: 'bg-rose-500 animate-ping',
    icon: Flame,
    label: 'Escalated',
  },
  RESOLVED: {
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
    label: 'Resolved',
  },
  CLOSED: {
    bg: 'bg-slate-800 text-slate-400 border-slate-700/60',
    dot: 'bg-slate-500',
    icon: Archive,
    label: 'Closed',
  },
  REOPENED: {
    bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm shadow-orange-500/10',
    dot: 'bg-orange-400 animate-pulse',
    icon: RotateCcw,
    label: 'Reopened',
  },
};

const StatusBadge = ({ status, size = 'sm', showIcon = false }) => {
  const config = statusConfig[status] || statusConfig.OPEN;
  const Icon = config.icon;

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-bold tracking-wide'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md ${config.bg} ${sizeClasses} transition-all duration-200 select-none`}
    >
      {showIcon ? (
        <Icon className="h-3 w-3 stroke-[2.5]" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
