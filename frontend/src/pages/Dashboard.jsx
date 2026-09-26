import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ticketAPI, getSocket } from '../services/api';
import TicketTable from '../components/TicketTable';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import {
  PlusCircle,
  Inbox,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  HelpCircle,
  ShieldCheck,
  Check,
  ArrowUpRight,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await ticketAPI.getTickets({ limit: 8 });
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets', err);
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

    socket.on('notification', handleUpdate);
    socket.on('ticket_updated', handleUpdate);
    return () => {
      socket.off('notification', handleUpdate);
      socket.off('ticket_updated', handleUpdate);
    };
  }, []);

  const totalCount = tickets.length;
  const activeCount = tickets.filter((t) =>
    ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'WAITING FOR USER', 'ESCALATED', 'REOPENED'].includes(t.status)
  ).length;
  const resolvedCount = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'CLOSED').length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner - White with Gold Accents */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-white p-6 sm:p-8 shadow-md">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>{user?.departmentName || 'Employee'} IT Helpdesk Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Lodge equipment breakdown complaints, report software glitches, and track real-time resolution from dedicated IT agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/create-ticket')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>File a Complaint</span>
            </button>
            <button
              onClick={() => navigate('/my-tickets')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Inbox className="h-4 w-4 text-amber-600" />
              <span>Track All ({totalCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Incidents */}
        <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm hover:border-amber-300 transition-all min-h-[128px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Requests</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-300">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalCount}</span>
            <span className="text-xs text-slate-500">complaints</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Historical submitted issues</p>
        </div>

        {/* Active Incidents */}
        <div className="rounded-2xl p-5 border border-amber-300 bg-amber-50/40 shadow-sm hover:border-amber-500 transition-all min-h-[128px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Under Review</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 text-amber-800 border border-amber-300">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-mono">{activeCount}</span>
            <span className="text-xs text-amber-700 font-semibold">in progress</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Active diagnostic queue</p>
        </div>

        {/* Resolved / Closed */}
        <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm hover:border-emerald-300 transition-all min-h-[128px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolved</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{resolvedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">completed</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Ready for feedback or closed</p>
        </div>

        {/* Critical Outages */}
        <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm hover:border-rose-300 transition-all min-h-[128px] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Urgent P1</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 border border-rose-300">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">{criticalCount}</span>
            <span className="text-xs text-rose-500 font-semibold">high priority</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Fast-track SLA resolution</p>
        </div>
      </div>

      {/* Interactive Standard Lifecycle Stepper */}
      <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" /> Standard Incident Lifecycle & SLA Pipeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How your IT incident is triaged, diagnosed, resolved, and verified
            </p>
          </div>
          <span className="text-[11px] text-amber-700 font-mono hidden sm:inline-block font-semibold">
            ITIL Incident Management Framework
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 text-center text-xs">
          <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-3.5 flex flex-col justify-between shrink-0 min-h-[110px]">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-xs">
                1
              </span>
            </div>
            <div className="font-bold text-amber-800">OPEN</div>
            <div className="text-[11px] text-slate-500 mt-1">Logged with priority</div>
          </div>

          <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-3.5 flex flex-col justify-between shrink-0 min-h-[110px]">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-xs">
                2
              </span>
            </div>
            <div className="font-bold text-amber-800">ASSIGNED</div>
            <div className="text-[11px] text-slate-500 mt-1">Admin assigns agent</div>
          </div>

          <div className="rounded-2xl border border-amber-400 bg-amber-100/60 p-3.5 flex flex-col justify-between shrink-0 min-h-[110px]">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-amber-300 text-amber-900 font-bold flex items-center justify-center text-xs">
                3
              </span>
            </div>
            <div className="font-bold text-amber-900">IN PROGRESS</div>
            <div className="text-[11px] text-slate-500 mt-1">Agent diagnoses problem</div>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3.5 flex flex-col justify-between shrink-0 min-h-[110px]">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-xs">
                4
              </span>
            </div>
            <div className="font-bold text-purple-700">WAIT / ESC</div>
            <div className="text-[11px] text-slate-500 mt-1">User input or Tier-2</div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex flex-col justify-between shrink-0 min-h-[110px]">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-xs">
                5
              </span>
            </div>
            <div className="font-bold text-emerald-700">RESOLVED</div>
            <div className="text-[11px] text-slate-500 mt-1">Agent solves problem</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between shrink-0 min-h-[110px]">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                6
              </span>
            </div>
            <div className="font-bold text-slate-700">CLOSED</div>
            <div className="text-[11px] text-slate-500 mt-1">Employee confirms fix</div>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Your Recent Service Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your most recently submitted incidents and tickets</p>
          </div>
          <button
            onClick={() => navigate('/my-tickets')}
            className="group flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>View All Tickets</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <TicketTable tickets={tickets} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
