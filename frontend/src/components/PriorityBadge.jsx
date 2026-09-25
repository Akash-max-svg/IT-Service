import React from 'react';
import { Flame, ArrowUp, ArrowDown, Minus, ShieldAlert } from 'lucide-react';

const priorityConfig = {
  CRITICAL: {
    bg: 'bg-gradient-to-r from-red-500/20 to-rose-600/20 text-red-200 border-red-500/40 shadow-sm shadow-red-950/50 ring-1 ring-red-500/20',
    icon: Flame,
    label: 'Critical',
    dot: 'bg-red-400',
  },
  HIGH: {
    bg: 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-200 border-amber-500/35 shadow-sm shadow-amber-950/30',
    icon: ArrowUp,
    label: 'High',
    dot: 'bg-amber-400',
  },
  MEDIUM: {
    bg: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-200 border-blue-500/25',
    icon: Minus,
    label: 'Medium',
    dot: 'bg-blue-400',
  },
  LOW: {
    bg: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-200 border-emerald-500/25',
    icon: ArrowDown,
    label: 'Low',
    dot: 'bg-emerald-400',
  },
};

const PriorityBadge = ({ priority, showIcon = true, size = 'sm' }) => {
  const normPriority = (priority || 'MEDIUM').toUpperCase();
  const config = priorityConfig[normPriority] || priorityConfig.MEDIUM;
  const Icon = config.icon;

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs font-bold'
      : 'px-2.5 py-1 text-[11px] font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-mono tracking-wider uppercase select-none ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className="h-3 w-3 stroke-[2.5]" />}
      <span>{config.label}</span>
    </span>
  );
};

export default PriorityBadge;
