import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ticketAPI, getSocket } from '../services/api';
import { normalizeRole } from '../utils/roleUtils';
import TicketTable from '../components/TicketTable';
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
} from 'lucide-react';

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQueueTab, setActiveQueueTab] = useState('my-assigned');

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
      fetchTickets();
    } catch (err) {
      alert('Failed to claim ticket');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-[#06261d] to-[#02130e] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <Headphones className="h-3.5 w-3.5 text-emerald-400" />
              <span>Support Specialist Console</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
              Triage Workspace • {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Specialization: <strong className="text-emerald-400 font-semibold">{user?.specialization || 'IT Generalist'}</strong> • Assigned Unit: {user?.departmentName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-300 shadow-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Triage Queue Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Triage Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* My Assigned */}
        <div
          onClick={() => setActiveQueueTab('my-assigned')}
          className={`glass-card cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeQueueTab === 'my-assigned'
              ? 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-emerald-500/20'
              : 'border-slate-800 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">My Assigned</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{myAssignedTickets.length}</span>
            <span className="text-xs text-slate-400">tickets</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Currently allocated to you</p>
        </div>

        {/* Unassigned Pool */}
        <div
          onClick={() => setActiveQueueTab('unassigned')}
          className={`glass-card cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeQueueTab === 'unassigned'
              ? 'border-sky-500 bg-sky-950/30 ring-2 ring-sky-500/40 shadow-sky-500/10'
              : 'border-slate-800 hover:border-sky-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unassigned Pool</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-400 font-mono">{unassignedTickets.length}</span>
            <span className="text-xs text-sky-400/80">awaiting pickup</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Needs agent triage</p>
        </div>

        {/* Escalated */}
        <div
          onClick={() => setActiveQueueTab('escalated')}
          className={`glass-card cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeQueueTab === 'escalated'
              ? 'border-rose-500 bg-rose-950/30 ring-2 ring-rose-500/40 shadow-rose-500/10'
              : 'border-slate-800 hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Escalated</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">{escalatedTickets.length}</span>
            <span className="text-xs text-rose-400/80">tier-2</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">High priority escalation</p>
        </div>

        {/* SLA Breached */}
        <div
          onClick={() => setActiveQueueTab('breached')}
          className={`glass-card cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
            activeQueueTab === 'breached'
              ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/40 shadow-amber-500/10'
              : 'border-slate-800 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SLA At-Risk</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{breachedTickets.length}</span>
            <span className="text-xs text-amber-400/80">breached</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Time window exceeded</p>
        </div>
      </div>

      {/* Main Triage Queue Table */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 p-5 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveQueueTab('my-assigned')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'my-assigned'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              My Assigned ({myAssignedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('unassigned')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'unassigned'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Unassigned Pool ({unassignedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('reopened')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'reopened'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Reopened ({reopenedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('escalated')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'escalated'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Escalated ({escalatedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('breached')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'breached'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Breached SLA ({breachedTickets.length})
            </button>
            <button
              onClick={() => setActiveQueueTab('resolved')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeQueueTab === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Resolved ({resolvedTickets.length})
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Queue: <span className="font-bold text-white">{getFilteredTickets().length}</span> active incident(s)
          </span>
        </div>

        <TicketTable tickets={getFilteredTickets()} loading={loading} onClaim={handleClaim} />
      </div>
    </div>
  );
};

export default AgentDashboard;
