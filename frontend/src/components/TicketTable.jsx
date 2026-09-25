import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import SLAIndicator from './SLAIndicator';
import { Eye, Paperclip, ChevronRight, Inbox, Clock, User, ArrowUpRight } from 'lucide-react';

const TicketTable = ({ tickets = [], loading = false, onClaim }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20" />
          <span className="text-xs font-semibold text-slate-400">Loading incident queue...</span>
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-2xl bg-slate-800/80 p-5 text-slate-500 mb-3 border border-slate-700/60 shadow-inner">
          <Inbox className="h-8 w-8 text-indigo-400" />
        </div>
        <h4 className="text-base font-bold text-white">No incidents found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
          No tickets match the selected filters or there are no items in this queue yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-900/90 uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono text-[11px]">
          <tr>
            <th scope="col" className="px-5 py-4 font-bold">Ticket ID</th>
            <th scope="col" className="px-5 py-4 font-bold">Summary & Category</th>
            <th scope="col" className="px-4 py-4 font-bold">Priority</th>
            <th scope="col" className="px-4 py-4 font-bold">Status</th>
            <th scope="col" className="px-4 py-4 font-bold">Assignee</th>
            <th scope="col" className="px-4 py-4 font-bold">SLA Target</th>
            <th scope="col" className="px-4 py-4 font-bold">Logged</th>
            <th scope="col" className="px-5 py-4 font-bold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {tickets.map((ticket) => (
            <tr
              key={ticket._id}
              onClick={() => navigate(`/tickets/${ticket._id}`)}
              className="cursor-pointer hover:bg-slate-800/50 transition-all duration-150 group"
            >
              {/* Ticket ID */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                  {ticket.ticketNumber}
                </span>
              </td>

              {/* Title & Category */}
              <td className="px-5 py-4 max-w-xs sm:max-w-md">
                <div className="font-semibold text-white truncate text-xs group-hover:text-indigo-200 transition-colors">
                  {ticket.title}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-0.5 border border-slate-700/60 font-medium">
                    {ticket.category}
                  </span>
                  {ticket.subcategory && (
                    <span className="text-slate-500 truncate max-w-[120px]">
                      • {ticket.subcategory}
                    </span>
                  )}
                  {ticket.attachments?.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-slate-400 font-mono">
                      <Paperclip className="h-3 w-3 text-indigo-400" />
                      {ticket.attachments.length}
                    </span>
                  )}
                </div>
              </td>

              {/* Priority */}
              <td className="px-4 py-4 whitespace-nowrap">
                <PriorityBadge priority={ticket.priority} size="xs" />
              </td>

              {/* Status */}
              <td className="px-4 py-4 whitespace-nowrap">
                <StatusBadge status={ticket.status} size="xs" />
              </td>

              {/* Assignee */}
              <td className="px-4 py-4 whitespace-nowrap">
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white shadow-sm">
                      {ticket.assignedTo.name?.charAt(0)}
                    </div>
                    <span className="truncate max-w-[110px] font-medium text-slate-200">
                      {ticket.assignedTo.name}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-700/40 italic">
                    Unassigned
                  </span>
                )}
              </td>

              {/* SLA Target */}
              <td className="px-4 py-4 whitespace-nowrap">
                <SLAIndicator ticket={ticket} />
              </td>

              {/* Logged Date */}
              <td className="px-4 py-4 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>

              {/* Action Button */}
              <td className="px-5 py-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tickets/${ticket._id}`);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:border-indigo-500/40 border border-slate-700/60"
                >
                  <span>View</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;
