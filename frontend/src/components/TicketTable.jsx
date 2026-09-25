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
      <div className="flex h-64 items-center justify-center bg-white rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg shadow-amber-500/20" />
          <span className="text-xs font-semibold text-slate-500">Loading incident queue...</span>
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl">
        <div className="rounded-2xl bg-amber-50 p-5 text-amber-600 mb-3 border border-amber-200 shadow-sm">
          <Inbox className="h-8 w-8 text-amber-500" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No incidents found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
          No tickets match the selected filters or there are no items in this queue yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-amber-50/70 uppercase tracking-wider text-slate-700 border-b border-amber-200/80 font-mono text-[11px]">
          <tr>
            <th scope="col" className="px-5 py-4 font-bold text-slate-800">Ticket ID</th>
            <th scope="col" className="px-5 py-4 font-bold text-slate-800">Summary & Category</th>
            <th scope="col" className="px-4 py-4 font-bold text-slate-800">Priority</th>
            <th scope="col" className="px-4 py-4 font-bold text-slate-800">Status</th>
            <th scope="col" className="px-4 py-4 font-bold text-slate-800">Assignee</th>
            <th scope="col" className="px-4 py-4 font-bold text-slate-800">SLA Target</th>
            <th scope="col" className="px-4 py-4 font-bold text-slate-800">Logged</th>
            <th scope="col" className="px-5 py-4 font-bold text-right text-slate-800">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr
              key={ticket._id}
              onClick={() => navigate(`/tickets/${ticket._id}`)}
              className="cursor-pointer hover:bg-amber-50/40 transition-all duration-150 group"
            >
              {/* Ticket ID */}
              <td className="px-5 py-4 whitespace-nowrap">
                <span className="font-mono text-xs font-bold text-amber-600 group-hover:text-amber-700">
                  {ticket.ticketNumber}
                </span>
              </td>

              {/* Title & Category */}
              <td className="px-5 py-4 max-w-xs sm:max-w-md">
                <div className="font-semibold text-slate-900 truncate text-xs group-hover:text-amber-700 transition-colors">
                  {ticket.title}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200 font-medium text-slate-700">
                    {ticket.category}
                  </span>
                  {ticket.subcategory && (
                    <span className="text-slate-500 truncate max-w-[120px]">
                      • {ticket.subcategory}
                    </span>
                  )}
                  {ticket.attachments?.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-slate-500 font-mono">
                      <Paperclip className="h-3 w-3 text-amber-500" />
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
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-[10px] font-bold text-white shadow-sm">
                      {ticket.assignedTo.name?.charAt(0)}
                    </div>
                    <span className="truncate max-w-[110px] font-medium text-slate-800">
                      {ticket.assignedTo.name}
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 italic">
                    Unassigned
                  </span>
                )}
              </td>

              {/* SLA Target */}
              <td className="px-4 py-4 whitespace-nowrap">
                <SLAIndicator ticket={ticket} />
              </td>

              {/* Logged Date */}
              <td className="px-4 py-4 whitespace-nowrap text-[11px] text-slate-500 font-mono">
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
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs transition-all shadow-sm"
                >
                  <span>View Problem</span>
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

