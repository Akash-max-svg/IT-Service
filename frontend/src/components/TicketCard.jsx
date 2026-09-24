import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SLAIndicator from './SLAIndicator';
import { MessageSquare, Paperclip, User, Calendar } from 'lucide-react';

const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket._id}`)}
      className="glass-card cursor-pointer rounded-xl p-5 hover:shadow-lg transition-all border border-slate-700/60 hover:border-indigo-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-indigo-400">
            {ticket.ticketNumber}
          </span>
          <PriorityBadge priority={ticket.priority} size="xs" />
        </div>
        <StatusBadge status={ticket.status} size="xs" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-white line-clamp-1 group-hover:text-indigo-300">
        {ticket.title}
      </h3>

      <p className="mt-1 text-sm text-slate-400 line-clamp-2 leading-relaxed">
        {ticket.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/50">
          {ticket.category}
        </span>
        {ticket.subcategory && (
          <span className="text-slate-500">• {ticket.subcategory}</span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
            {ticket.assignedTo?.name ? ticket.assignedTo.name.charAt(0) : '?'}
          </div>
          <span>{ticket.assignedTo?.name || 'Unassigned'}</span>
        </div>

        <div className="flex items-center gap-3">
          {ticket.attachments?.length > 0 && (
            <span className="flex items-center gap-1 text-slate-400">
              <Paperclip className="h-3 w-3" />
              {ticket.attachments.length}
            </span>
          )}
          <SLAIndicator ticket={ticket} />
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
