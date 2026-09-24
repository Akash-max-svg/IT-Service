import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Flame,
  Zap,
} from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#10b981',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const { data } = await adminAPI.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20" />
          <span className="text-xs font-semibold text-slate-400">Aggregating IT enterprise metrics...</span>
        </div>
      </div>
    );
  }

  const counts = metrics?.counts || {};
  const priorityData = (metrics?.priorityDistribution || []).map((p) => ({
    name: p._id,
    value: p.count,
    color: PRIORITY_COLORS[p._id] || '#6366f1',
  }));

  const categoryData = (metrics?.categoryDistribution || []).map((c) => ({
    name: c._id,
    count: c.count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Global IT Command & Governance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
              Executive Service Desk Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time telemetry on incident volumes, SLA compliance, department distribution, and support team capacity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/users')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-800/80 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700/80 shadow-md transition-colors"
            >
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Roster Management</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Full SLA Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Volume</span>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">{counts.totalTickets || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Logged incidents</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Queue</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            {(counts.openTickets || 0) + (counts.inProgressTickets || 0)}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Needs resolution</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolved Rate</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
            {(counts.resolvedTickets || 0) + (counts.closedTickets || 0)}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Closed requests</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SLA Compliance</span>
          <p className="mt-2 text-2xl font-extrabold text-indigo-400 font-mono">
            {counts.slaCompliance || 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Service target</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SLA Breaches</span>
          <p className="mt-2 text-2xl font-extrabold text-rose-400 font-mono">{counts.breachedTickets || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Missed deadlines</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">User CSAT</span>
          <div className="mt-2 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-extrabold text-amber-400">{counts.avgCSAT || '5.0'}</span>
            <span className="text-xs text-slate-500 font-bold">/ 5.0</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Satisfaction score</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Incidents by Classification Category
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Volume distribution across IT services</p>
            </div>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 font-mono border border-indigo-500/20">
              Live Aggregate
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Incidents by Severity & Priority
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Critical vs. Standard SLA tiers</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono border border-emerald-500/20">
              Active Tiers
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-Time System Activity Feed */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" /> Real-Time Incident State Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stream of status transitions, agent allocations, and escalations
            </p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="group flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View Full Compliance Log</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {(metrics?.recentActivity || []).map((act) => (
            <div
              key={act._id}
              onClick={() => {
                if (act.ticket?._id) navigate(`/tickets/${act.ticket._id}`);
              }}
              className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-slate-800/40 px-3 rounded-2xl transition-all text-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-slate-200 text-xs shadow-sm group-hover:border-indigo-500/40 group-hover:text-white transition-colors">
                  {act.performedBy?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-indigo-200">
                      {act.performedBy?.name}
                    </span>
                    <span className="font-mono text-[11px] text-indigo-400 font-semibold">
                      [{act.ticket?.ticketNumber || 'INCIDENT'}]
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{act.notes || act.action}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
