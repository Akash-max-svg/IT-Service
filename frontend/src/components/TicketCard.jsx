import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SLAIndicator from './SLAIndicator';
import { Paperclip, ArrowUpRight, Clock, Building2 } from 'lucide-react';

const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket._id}`)}
      className="group relative flex flex-col justify-between rounded-2xl p-5 border border-slate-200 hover:border-amber-400 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
              {ticket.ticketNumber}
            </span>
            <PriorityBadge priority={ticket.priority} size="xs" />
          </div>
          <StatusBadge status={ticket.status} size="xs" />
        </div>

        {/* Title */}
        <h3 className="mt-3.5 text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
          {ticket.title}
        </h3>

        {/* Description snippet */}
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>

        {/* Category & Tags */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700 border border-slate-200 font-medium">
            {ticket.category}
          </span>
          {ticket.subcategory && (
            <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-slate-500 border border-slate-100">
              {ticket.subcategory}
            </span>
          )}
          {ticket.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-amber-700 font-mono border border-amber-200">
              <Paperclip className="h-3 w-3" />
              {ticket.attachments.length}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {ticket.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-[9px] font-bold text-slate-950">
                {ticket.assignedTo.name?.charAt(0)}
              </div>
              <span className="truncate max-w-[100px] text-[11px] font-medium text-slate-700">
                {ticket.assignedTo.name}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium italic">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SLAIndicator ticket={ticket} />
          <div className="rounded-lg p-1 text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
