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
    return () => {
      socket.off('notification', handleUpdate);
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-950/80 via-[#071933] to-[#030917] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300 border border-sky-500/30">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>{user?.departmentName || 'Corporate'} Service Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Report equipment glitches, software installation issues, network connectivity problems, and follow ticket resolution in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/create-ticket')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-sky-600/30 hover:shadow-sky-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Submit IT Ticket</span>
            </button>
            <button
              onClick={() => navigate('/my-tickets')}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-950/40 px-4 py-3 text-xs font-semibold text-sky-200 hover:bg-sky-900/40 transition-colors shadow-md"
            >
              <Inbox className="h-4 w-4 text-sky-400" />
              <span>Track All ({totalCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Incidents */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{totalCount}</span>
            <span className="text-xs text-slate-400">tickets</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Historical submitted issues</p>
        </div>

        {/* Active Incidents */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Under Review</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">{activeCount}</span>
            <span className="text-xs text-amber-400/80">in progress</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Active diagnostic queue</p>
        </div>

        {/* Resolved / Closed */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolved</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">{resolvedCount}</span>
            <span className="text-xs text-emerald-400/80">completed</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Ready for feedback or closed</p>
        </div>

        {/* Critical Outages */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Urgent P1</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">{criticalCount}</span>
            <span className="text-xs text-rose-400/80">high priority</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Fast-track SLA resolution</p>
        </div>
      </div>

      {/* Interactive Standard Lifecycle Stepper */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-400" /> Standard Incident Lifecycle & SLA Pipeline
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              How your IT incident is triaged, diagnosed, resolved, and verified
            </p>
          </div>
          <span className="text-[11px] text-indigo-400 font-mono hidden sm:inline-block">
            ITIL Incident Management Framework
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 text-center text-xs">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-3.5 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                1
              </span>
            </div>
            <div className="font-bold text-blue-400">OPEN</div>
            <div className="text-[11px] text-slate-400 mt-1">Logged with priority & category</div>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3.5 flex flex-col justify-between hover:border-sky-500/50 transition-colors">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs">
                2
              </span>
            </div>
            <div className="font-bold text-sky-400">ASSIGNED</div>
            <div className="text-[11px] text-slate-400 mt-1">Specialist allocated</div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex flex-col justify-between hover:border-amber-500/50 transition-colors">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                3
              </span>
            </div>
            <div className="font-bold text-amber-400">IN PROGRESS</div>
            <div className="text-[11px] text-slate-400 mt-1">Active diagnosis & fix</div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5 flex flex-col justify-between hover:border-purple-500/50 transition-colors">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">
                4
              </span>
            </div>
            <div className="font-bold text-purple-400">WAIT / ESC</div>
            <div className="text-[11px] text-slate-400 mt-1">User input or Tier-2</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                5
              </span>
            </div>
            <div className="font-bold text-emerald-400">RESOLVED</div>
            <div className="text-[11px] text-slate-400 mt-1">Solution deployed</div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3.5 flex flex-col justify-between hover:border-slate-600 transition-colors">
            <div className="flex justify-center mb-2">
              <span className="h-6 w-6 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs">
                6
              </span>
            </div>
            <div className="font-bold text-slate-300">CLOSED</div>
            <div className="text-[11px] text-slate-400 mt-1">CSAT feedback verified</div>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 p-5 sm:px-6">
          <div>
            <h2 className="text-base font-extrabold text-white">Recent Service Requests</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your most recently submitted incidents and tickets</p>
          </div>
          <button
            onClick={() => navigate('/my-tickets')}
            className="group flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
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
