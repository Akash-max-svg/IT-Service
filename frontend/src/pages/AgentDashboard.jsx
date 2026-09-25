import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ticketAPI, getSocket } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SLAIndicator from '../components/SLAIndicator';
import {
  Headphones,
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Zap,
  Activity,
  Flame,
  ArrowRight,
  RotateCcw,
  Check,
  ArrowUpRight,
  FileText,
  AlertCircle,
  HelpCircle,
  Paperclip,
  CheckCircle,
  X,
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQueueTab, setActiveQueueTab] = useState('my-assigned');
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await ticketAPI.getTickets({ limit: 100 });
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchTickets();
    };

    socket.on('new_ticket', handleUpdate);
    socket.on('ticket_escalated', handleUpdate);
    socket.on('ticket_updated', handleUpdate);
    socket.on('ticket_reopened', handleUpdate);
    socket.on('notification', handleUpdate);

    return () => {
      socket.off('new_ticket', handleUpdate);
      socket.off('ticket_escalated', handleUpdate);
      socket.off('ticket_updated', handleUpdate);
      socket.off('ticket_reopened', handleUpdate);
      socket.off('notification', handleUpdate);
    };
  }, []);

  const currentUserId = (user?._id || user?.id)?.toString();
  const isAssignedToUser = (t) => (t.assignedTo?._id || t.assignedTo)?.toString() === currentUserId;

  const myAssignedTickets = tickets.filter(
    (t) => isAssignedToUser(t) && !['RESOLVED', 'CLOSED'].includes(t.status)
  );

  const unassignedTickets = tickets.filter(
    (t) => !t.assignedTo && ['OPEN', 'REOPENED'].includes(t.status)
  );

  const reopenedTickets = tickets.filter(
    (t) => t.status === 'REOPENED' && (isAssignedToUser(t) || !t.assignedTo)
  );

  const escalatedTickets = tickets.filter((t) => t.status === 'ESCALATED');

  const breachedTickets = tickets.filter(
    (t) => (t.isResponseBreached || t.isResolutionBreached) && !['RESOLVED', 'CLOSED'].includes(t.status)
  );

  const resolvedTickets = tickets.filter(
    (t) => isAssignedToUser(t) && ['RESOLVED', 'CLOSED'].includes(t.status)
  );

  const getFilteredTickets = () => {
    switch (activeQueueTab) {
      case 'my-assigned':
        return myAssignedTickets;
      case 'unassigned':
        return unassignedTickets;
      case 'reopened':
        return reopenedTickets;
      case 'escalated':
        return escalatedTickets;
      case 'breached':
        return breachedTickets;
      case 'resolved':
        return resolvedTickets;
      default:
        return tickets;
    }
  };

  const handleClaim = async (ticketId) => {
    try {
      await ticketAPI.assignTicket(ticketId, user._id);
      setToastMessage({ type: 'success', text: 'Ticket successfully claimed and assigned to your queue!' });
      setTimeout(() => setToastMessage(null), 4000);
      fetchTickets();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to claim ticket' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleStartWork = async (ticketId) => {
    try {
      await ticketAPI.updateStatus(ticketId, { status: 'IN PROGRESS' });
      setToastMessage({ type: 'success', text: 'Status changed to IN PROGRESS. Work started!' });
      setTimeout(() => setToastMessage(null), 4000);
      fetchTickets();
    } catch (err) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to start diagnostic' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCompleteAndSolve = async (e) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes describing how the problem was solved.');
      return;
    }

    try {
      setIsSubmittingResolution(true);
      await ticketAPI.updateStatus(resolvingTicket._id, {
        status: 'RESOLVED',
        resolutionNotes: resolutionNotes.trim(),
      });
      setToastMessage({
        type: 'success',
        text: `Incident ${resolvingTicket.ticketNumber} marked as SOLVED & RESOLVED!`,
      });
      setTimeout(() => setToastMessage(null), 4500);
      setResolvingTicket(null);
      setResolutionNotes('');
      fetchTickets();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to mark ticket as resolved',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const filteredTickets = getFilteredTickets();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-semibold shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-300 shadow-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner - White Background with Gold Accents */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-white p-6 sm:p-8 shadow-md">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              <Headphones className="h-3.5 w-3.5 text-amber-600" />
              <span>Assigned Agent Problem Solving Center</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
              Agent Console • {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Review assigned employee problems, begin diagnostics, and complete/resolve technical incidents with verified solutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Specialist Online & Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Triage Cards - White with Gold accents */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* My Assigned */}
        <div
          onClick={() => setActiveQueueTab('my-assigned')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white shadow-sm ${
            activeQueueTab === 'my-assigned'
              ? 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/40 shadow-amber-200'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Assigned To Me</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{myAssignedTickets.length}</span>
            <span className="text-xs text-amber-700 font-semibold">problems to solve</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Currently allocated by Admin</p>
        </div>

        {/* Unassigned Pool */}
        <div
          onClick={() => setActiveQueueTab('unassigned')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white shadow-sm ${
            activeQueueTab === 'unassigned'
              ? 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/40 shadow-amber-200'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Unassigned Pool</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-mono">{unassignedTickets.length}</span>
            <span className="text-xs text-slate-500">awaiting pickup</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Available to claim</p>
        </div>

        {/* SLA Breached */}
        <div
          onClick={() => setActiveQueueTab('breached')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white shadow-sm ${
            activeQueueTab === 'breached'
              ? 'border-rose-500 ring-2 ring-rose-400/50 bg-rose-50/40 shadow-rose-200'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">SLA At-Risk</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">{breachedTickets.length}</span>
            <span className="text-xs text-rose-500">urgent</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Priority resolution required</p>
        </div>

        {/* Resolved By Me */}
        <div
          onClick={() => setActiveQueueTab('resolved')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 bg-white shadow-sm ${
            activeQueueTab === 'resolved'
              ? 'border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/40 shadow-emerald-200'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Solved & Resolved</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{resolvedTickets.length}</span>
            <span className="text-xs text-emerald-600">completed</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Successfully closed problems</p>
        </div>
      </div>

      {/* Main Triage Queue - White Background with Gold Accents */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
        {/* Queue Switcher */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 p-5 gap-3 bg-amber-50/30">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveQueueTab('my-assigned')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'my-assigned'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              My Assigned ({myAssignedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('unassigned')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'unassigned'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              Unassigned Pool ({unassignedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('breached')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'breached'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              Breached SLA ({breachedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('resolved')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'resolved'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50'
              }`}
            >
              Solved / Completed ({resolvedTickets.length})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing <strong className="text-slate-800">{filteredTickets.length}</strong> incident(s)
          </span>
        </div>

        {/* Detailed Incident Cards with Direct Problem Solving Actions */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg shadow-amber-500/20" />
              <span className="text-xs font-semibold text-slate-500">Loading incident queue...</span>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-amber-50 p-5 text-amber-600 mb-3 border border-amber-200 shadow-sm">
              <Inbox className="h-8 w-8 text-amber-500" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No problems in this queue</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              When the Admin assigns incoming employee complaints to you, they will appear here ready to solve.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const employee = ticket.createdBy || {};
              const employeeName = employee.name || 'Employee';
              const employeeEmail = employee.email || '';
              const department = employee.departmentName || ticket.departmentName || 'General';
              const isAssigned = isAssignedToUser(ticket);
              const isResolved = ['RESOLVED', 'CLOSED'].includes(ticket.status);

              return (
                <div
                  key={ticket._id}
                  className="p-5 sm:p-6 hover:bg-amber-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: Problem Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                        {ticket.ticketNumber}
                      </span>
                      <PriorityBadge priority={ticket.priority} size="xs" />
                      <StatusBadge status={ticket.status} size="xs" />
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                        {ticket.category}
                      </span>
                      {ticket.subcategory && (
                        <span className="text-[11px] text-slate-500">
                          • {ticket.subcategory}
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                      className="text-base font-bold text-slate-900 hover:text-amber-600 cursor-pointer transition-colors"
                    >
                      {ticket.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>

                    {/* Employee & SLA Footer */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                          {employeeName.charAt(0)}
                        </div>
                        <span>Reported by: <strong>{employeeName}</strong> ({department})</span>
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <SLAIndicator ticket={ticket} />
                    </div>
                  </div>

                  {/* Right: Problem Solving Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {/* View Problem Button */}
                    <button
                      type="button"
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>View Problem</span>
                    </button>

                    {/* Claim Button for unassigned */}
                    {!ticket.assignedTo && (
                      <button
                        type="button"
                        onClick={() => handleClaim(ticket._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 text-xs transition-colors shadow-sm"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Claim & Solve</span>
                      </button>
                    )}

                    {/* Start Work button if not yet in progress */}
                    {isAssigned && ticket.status === 'ASSIGNED' && (
                      <button
                        type="button"
                        onClick={() => handleStartWork(ticket._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-3.5 py-2 text-xs transition-colors shadow-sm"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-600" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {/* Complete & Solve Problem Button */}
                    {isAssigned && !isResolved && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingTicket(ticket);
                          setResolutionNotes('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold px-4 py-2 text-xs transition-all shadow-md shadow-amber-500/20"
                      >
                        <CheckCircle2 className="h-4 w-4 text-slate-950" />
                        <span>Complete / Solve</span>
                      </button>
                    )}

                    {/* Already Resolved indicator */}
                    {isResolved && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 text-xs font-bold">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span>Solved</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete & Solve Problem Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-amber-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-amber-500" />
                <span>Complete & Solve Problem</span>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs font-bold text-amber-600">
                {resolvingTicket.ticketNumber}
              </span>
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {resolvingTicket.title}
              </h4>
              <p className="text-xs text-slate-500">
                Provide clear resolution notes detailing what steps and fixes were completed to solve this employee issue.
              </p>
            </div>

            <form onSubmit={handleCompleteAndSolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Resolution Notes / Solution Summary *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="E.g., Cleared corrupted DNS cache, re-authenticated domain credentials, and confirmed with the employee that network connectivity is fully restored."
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  disabled={isSubmittingResolution}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                >
                  <Check className="h-4 w-4 text-slate-950" />
                  <span>{isSubmittingResolution ? 'Submitting Solution...' : 'Mark as Solved & Resolved'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
