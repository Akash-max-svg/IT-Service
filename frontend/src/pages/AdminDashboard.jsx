import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { adminAPI, ticketAPI, userAPI, getSocket } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SLAIndicator from '../components/SLAIndicator';
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
  CartesianGrid,
  LabelList,
} from 'recharts';
import {
  ShieldCheck,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Users,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Flame,
  Zap,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Check,
  Copy,
  ArrowUpRight,
  Paperclip,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Mail,
  Building,
  Briefcase,
  ExternalLink,
  Download,
  BarChart2,
  PieChart as PieChartIcon,
  X,
} from 'lucide-react';
import { downloadTicketPDF, downloadTicketsListPDF } from '../utils/pdfGenerator';

const COLORS = ['#f59e0b', '#d97706', '#10b981', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = {
  CRITICAL: '#ef4444', // Red
  HIGH: '#eab308',     // Yellow
  MEDIUM: '#10b981',   // Green
  LOW: '#3b82f6',      // Blue
};
const STATUS_COLORS = {
  OPEN: '#3b82f6',
  ASSIGNED: '#6366f1',
  'IN PROGRESS': '#f59e0b',
  'WAITING FOR USER': '#a855f7',
  ESCALATED: '#ef4444',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
  REOPENED: '#f97316',
};
const CATEGORY_PALETTE = [
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Resolution states
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [pieChartMode, setPieChartMode] = useState('priority'); // 'priority' | 'status'
  const [barChartMode, setBarChartMode] = useState('category'); // 'category' | 'department'

  // Interaction states
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedDescId, setExpandedDescId] = useState(null);

  // Fetch all initial data
  const loadDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [metricsRes, ticketsRes, agentsRes] = await Promise.allSettled([
        adminAPI.getMetrics(),
        ticketAPI.getTickets({ limit: 200 }),
        userAPI.getAgents(),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      }
      if (ticketsRes.status === 'fulfilled') {
        setTickets(ticketsRes.value.data.tickets || []);
      }
      if (agentsRes.status === 'fulfilled') {
        setAgents(agentsRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const socket = getSocket();
    const handleUpdate = () => {
      loadDashboardData(true);
    };

    socket.on('new_ticket', (ticket) => {
      loadDashboardData(true);
      if (ticket) {
        setToastMessage({
          type: 'new_problem',
          text: `🚨 New Problem Lodged: [${ticket.ticketNumber || 'New'}] "${ticket.title || 'Untitled'}" (${ticket.priority || 'MEDIUM'} Priority) - Needs Agent Assignment!`,
        });
        setTimeout(() => setToastMessage(null), 7000);
      }
    });
    socket.on('ticket_updated', handleUpdate);
    socket.on('ticket_escalated', handleUpdate);
    socket.on('ticket_reopened', handleUpdate);
    socket.on('notification', handleUpdate);

    return () => {
      socket.off('new_ticket');
      socket.off('ticket_updated', handleUpdate);
      socket.off('ticket_escalated', handleUpdate);
      socket.off('ticket_reopened', handleUpdate);
      socket.off('notification', handleUpdate);
    };
  }, []);

  // Assign Ticket to Agent Handler
  const handleAssignToAgent = async (ticketId, selectedAgentId) => {
    if (!selectedAgentId) return;

    try {
      setAssigningTicketId(ticketId);
      const { data: updatedTicket } = await ticketAPI.assignTicket(ticketId, selectedAgentId);

      // Instantly update ticket in local state
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? updatedTicket : t))
      );

      const targetAgent = agents.find((a) => a._id === selectedAgentId);
      const agentDisplayName = targetAgent ? targetAgent.name : 'Support Agent';

      setToastMessage({
        type: 'success',
        text: `Incident ${updatedTicket.ticketNumber || ''} assigned to ${agentDisplayName}. Status updated to ASSIGNED.`,
      });
      setTimeout(() => setToastMessage(null), 4500);

      // Refresh metrics in background
      adminAPI.getMetrics().then(({ data }) => setMetrics(data)).catch(() => {});
    } catch (err) {
      console.error('Assignment failed:', err);
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to assign agent to this incident',
      });
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      setAssigningTicketId(null);
    }
  };

  // Complete and solve problem / write solution handler
  const handleCompleteAndSolve = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!resolvingTicket) return;
    const cleanSolution = (resolutionNotes || '').trim();
    if (!cleanSolution) {
      alert('Please enter or select resolution notes describing how the problem was solved.');
      return;
    }

    const currentTicket = resolvingTicket;
    const nowIso = new Date().toISOString();

    // Close modal right away so user sees immediate reaction in table
    setResolvingTicket(null);
    setResolutionNotes('');

    // Immediately optimistically update local state across AdminDashboard
    setTickets((prev) =>
      prev.map((t) =>
        t._id === currentTicket._id
          ? {
              ...t,
              status: 'RESOLVED',
              resolutionNotes: cleanSolution,
              solution: cleanSolution,
              resolvedAt: t.resolvedAt || nowIso,
              assignedTo: t.assignedTo || user,
            }
          : t
      )
    );

    // Show immediate affirmative toast
    setToastMessage({
      type: 'success',
      text: `✅ Problem Done • Your assigned task is completed! Incident [${currentTicket.ticketNumber}] marked as RESOLVED with assigned solution.`,
    });
    setTimeout(() => setToastMessage(null), 6000);

    try {
      setIsSubmittingResolution(true);
      const { data: updated } = await ticketAPI.updateStatus(currentTicket._id, {
        status: 'RESOLVED',
        resolutionNotes: cleanSolution,
        solution: cleanSolution,
      });

      if (updated) {
        setTickets((prev) =>
          prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t))
        );
      }

      // Refresh metrics in background
      adminAPI.getMetrics().then(({ data }) => setMetrics(data)).catch(() => {});
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to complete and solve ticket',
      });
      setTimeout(() => setToastMessage(null), 4500);
      loadDashboardData(true);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const copyTicketNumber = (tNumber, id) => {
    navigator.clipboard.writeText(tNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered tickets calculation
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status Filter
      if (statusFilter === 'UNASSIGNED') {
        if (ticket.assignedTo) return false;
      } else if (statusFilter !== 'ALL') {
        if (ticket.status !== statusFilter) return false;
      }

      // Priority Filter
      if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ticketNum = (ticket.ticketNumber || '').toLowerCase();
        const title = (ticket.title || '').toLowerCase();
        const desc = (ticket.description || '').toLowerCase();
        const cat = (ticket.category || '').toLowerCase();
        const employeeName = (ticket.createdBy?.name || '').toLowerCase();
        const employeeEmail = (ticket.createdBy?.email || '').toLowerCase();
        const dept = (ticket.createdBy?.departmentName || ticket.departmentName || '').toLowerCase();
        const agentName = (ticket.assignedTo?.name || '').toLowerCase();

        return (
          ticketNum.includes(query) ||
          title.includes(query) ||
          desc.includes(query) ||
          cat.includes(query) ||
          employeeName.includes(query) ||
          employeeEmail.includes(query) ||
          dept.includes(query) ||
          agentName.includes(query)
        );
      }

      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white rounded-3xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg shadow-amber-500/20" />
          <span className="text-xs font-semibold text-slate-500">Aggregating IT enterprise metrics & incident queue...</span>
        </div>
      </div>
    );
  }

  const counts = metrics?.counts || {};

  // Live and accurate calculations for charts matching real-time tickets state
  const priorityChartData = useMemo(() => {
    const countsMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    if (tickets.length > 0) {
      tickets.forEach((t) => {
        const p = (t.priority || 'MEDIUM').toUpperCase();
        if (countsMap[p] !== undefined) countsMap[p]++;
        else countsMap[p] = (countsMap[p] || 0) + 1;
      });
    } else if (metrics?.priorityDistribution) {
      metrics.priorityDistribution.forEach((p) => {
        const key = (p._id || 'MEDIUM').toUpperCase();
        countsMap[key] = p.count;
      });
    }

    const total = Object.values(countsMap).reduce((a, b) => a + b, 0);

    return Object.entries(countsMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: PRIORITY_COLORS[name] || '#f59e0b',
      }))
      .filter((entry) => entry.value > 0);
  }, [tickets, metrics]);

  // All 4 priority tiers for comprehensive administrative overview cards
  const allPriorityCards = useMemo(() => {
    const countsMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    if (tickets.length > 0) {
      tickets.forEach((t) => {
        const p = (t.priority || 'MEDIUM').toUpperCase();
        if (countsMap[p] !== undefined) countsMap[p]++;
      });
    } else if (metrics?.priorityDistribution) {
      metrics.priorityDistribution.forEach((p) => {
        const key = (p._id || 'MEDIUM').toUpperCase();
        if (countsMap[key] !== undefined) countsMap[key] = p.count;
      });
    }

    const total = Object.values(countsMap).reduce((a, b) => a + b, 0);

    return [
      { name: 'CRITICAL', label: 'Critical Tier', value: countsMap.CRITICAL, color: PRIORITY_COLORS.CRITICAL, percentage: total > 0 ? Math.round((countsMap.CRITICAL / total) * 100) : 0 },
      { name: 'HIGH', label: 'High Tier', value: countsMap.HIGH, color: PRIORITY_COLORS.HIGH, percentage: total > 0 ? Math.round((countsMap.HIGH / total) * 100) : 0 },
      { name: 'MEDIUM', label: 'Medium Tier', value: countsMap.MEDIUM, color: PRIORITY_COLORS.MEDIUM, percentage: total > 0 ? Math.round((countsMap.MEDIUM / total) * 100) : 0 },
      { name: 'LOW', label: 'Low Tier', value: countsMap.LOW, color: PRIORITY_COLORS.LOW, percentage: total > 0 ? Math.round((countsMap.LOW / total) * 100) : 0 },
    ];
  }, [tickets, metrics]);

  const statusChartData = useMemo(() => {
    const statusMap = {
      OPEN: 0,
      ASSIGNED: 0,
      'IN PROGRESS': 0,
      'WAITING FOR USER': 0,
      ESCALATED: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };

    if (tickets.length > 0) {
      tickets.forEach((t) => {
        const s = t.status || 'OPEN';
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
    } else if (metrics?.statusDistribution) {
      metrics.statusDistribution.forEach((s) => {
        if (s._id) statusMap[s._id] = s.count;
      });
    }

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return Object.entries(statusMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: STATUS_COLORS[name] || '#f59e0b',
      }))
      .filter((entry) => entry.value > 0);
  }, [tickets, metrics]);

  const categoryChartData = useMemo(() => {
    const map = {};
    if (tickets.length > 0) {
      tickets.forEach((t) => {
        const c = t.category || 'General';
        map[c] = (map[c] || 0) + 1;
      });
    } else if (metrics?.categoryDistribution) {
      metrics.categoryDistribution.forEach((c) => {
        if (c._id) map[c._id] = c.count;
      });
    }

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map)
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [tickets, metrics]);

  const departmentChartData = useMemo(() => {
    const map = {};
    tickets.forEach((t) => {
      const d = t.createdBy?.departmentName || t.departmentName || 'General Support';
      map[d] = (map[d] || 0) + 1;
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map)
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_PALETTE[(idx + 2) % CATEGORY_PALETTE.length],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [tickets]);

  const activePieData = pieChartMode === 'priority' ? priorityChartData : statusChartData;
  const totalPieCount = activePieData.reduce((acc, curr) => acc + curr.value, 0);

  const activeBarData = barChartMode === 'category' ? categoryChartData : departmentChartData;
  const totalBarCount = activeBarData.reduce((acc, curr) => acc + curr.count, 0);

  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (!percent || percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={800}
        fontFamily="monospace"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-2xl border border-amber-300 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-1 z-50">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: data.color }} />
            <span className="font-extrabold text-slate-900 text-sm">{data.name}</span>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-lg font-black text-slate-950">{data.value}</span>
            <span className="text-slate-600 text-xs font-semibold">({data.percentage}% of total)</span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold pt-0.5">Click slice to filter incident queue →</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-2xl border border-amber-300 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-1 z-50">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: data.color || '#f59e0b' }} />
            <span className="font-extrabold text-slate-900 text-sm">{data.name}</span>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-lg font-black text-slate-950">{data.count}</span>
            <span className="text-slate-600 text-xs font-semibold">incidents ({data.percentage}%)</span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold pt-0.5">Click bar to filter incident queue →</p>
        </div>
      );
    }
    return null;
  };

  // Quick count stats for the tickets queue
  const unassignedCount = tickets.filter((t) => !t.assignedTo).length;
  const assignedCount = tickets.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN PROGRESS').length;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-semibold shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'new_problem'
              ? 'bg-amber-50 text-amber-950 border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/50'
              : toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-300 shadow-rose-200'
          }`}
        >
          {toastMessage.type === 'new_problem' ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 animate-bounce" />
          ) : toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Executive Header Banner - White with Gold Accents */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-white p-6 sm:p-8 shadow-md">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Global IT Command & Governance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl tracking-tight">
              Executive Service Desk Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Review employee submitted problems, check live SLA compliance, and assign available support agents to immediate resolution queues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 hover:bg-amber-100 shadow-sm transition-colors disabled:opacity-50"
              title="Refresh Queue"
            >
              <RefreshCw className={`h-4 w-4 text-amber-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
            </button>
            <button
              onClick={() => navigate('/users')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Users className="h-4 w-4 text-amber-600" />
              <span>Roster Management</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold px-4 py-3 text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <TrendingUp className="h-4 w-4 text-slate-950" />
              <span>SLA Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row - White Backgrounds & Gold Accents */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div
          onClick={() => {
            setStatusFilter('ALL');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="cursor-pointer rounded-2xl p-4 border border-slate-200 bg-white shadow-sm hover:border-amber-400 hover:shadow-md transition-all min-h-[105px] shrink-0"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Volume</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{tickets.length || counts.totalTickets || 0}</p>
          <span className="text-[10px] text-amber-600 font-medium">Logged incidents →</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('UNASSIGNED');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="cursor-pointer rounded-2xl p-4 border border-amber-300 bg-amber-50/50 shadow-sm hover:border-amber-500 hover:shadow-md transition-all min-h-[105px] shrink-0"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Unassigned</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-600 font-mono">{unassignedCount}</p>
          <span className="text-[10px] text-amber-700 font-bold">Needs Agent Assignment →</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('ASSIGNED');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="cursor-pointer rounded-2xl p-4 border border-slate-200 bg-white shadow-sm hover:border-amber-400 hover:shadow-md transition-all min-h-[105px] shrink-0"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assigned</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">{assignedCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Awaiting agent start →</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('IN PROGRESS');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="cursor-pointer rounded-2xl p-4 border border-slate-200 bg-white shadow-sm hover:border-amber-400 hover:shadow-md transition-all min-h-[105px] shrink-0"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In Progress</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-600 font-mono">{inProgressCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Under active triage →</span>
        </div>

        <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm min-h-[105px] shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 font-mono">
            {counts.slaCompliance || 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Service target</span>
        </div>

        <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm min-h-[105px] shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">User CSAT</span>
          <div className="mt-2 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-extrabold text-amber-500">{counts.avgCSAT || '5.0'}</span>
            <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Satisfaction score</span>
        </div>
      </div>

      {/* EXECUTIVE OPERATIONAL ANALYTICS: INTERACTIVE PIE CHART & BAR CHART */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Live Incident Analytics & Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Visualizing severity distribution, lifecycle volume, and classification metrics
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-[11px] font-bold text-amber-900 font-mono shadow-sm">
            Live Synchronized ({tickets.length} Incidents)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. EFFICIENT PIE / DONUT CHART */}
          <div className="min-w-0 rounded-3xl p-6 border border-slate-200 bg-white shadow-md flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <PieChartIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {pieChartMode === 'priority' ? 'Incident Severity & Priority' : 'Incident Lifecycle Status'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {pieChartMode === 'priority' ? 'Critical vs. Standard SLA tiers' : 'Active vs. Solved tickets breakdown'}
                    </p>
                  </div>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPieChartMode('priority')}
                    className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                      pieChartMode === 'priority'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => setPieChartMode('status')}
                    className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                      pieChartMode === 'status'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Status
                  </button>
                </div>
              </div>

              {/* Chart Visual with Centered Donut Metric */}
              <div className="relative w-full h-72 min-w-0">
                {activePieData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <Inbox className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs font-semibold">No incident data recorded yet</span>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <Pie
                          key={`pie-${pieChartMode}`}
                          data={activePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={98}
                          paddingAngle={activePieData.length > 1 ? 4 : 0}
                          dataKey="value"
                          nameKey="name"
                          label={renderCustomizedPieLabel}
                          labelLine={false}
                          onClick={(entry) => {
                            if (pieChartMode === 'priority' && entry?.name) {
                              setPriorityFilter(entry.name);
                              document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
                            } else if (pieChartMode === 'status' && entry?.name) {
                              setStatusFilter(entry.name);
                              document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="cursor-pointer focus:outline-none"
                        >
                          {activePieData.map((entry, index) => (
                            <Cell
                              key={`pie-cell-${entry.name}-${index}`}
                              fill={entry.color}
                              stroke="#ffffff"
                              strokeWidth={3}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Metric */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-slate-950 font-mono tracking-tight leading-none">
                        {totalPieCount}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                        {pieChartMode === 'priority' ? 'Total Incidents' : 'Status Total'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Custom Interactive Legend Badges */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              {pieChartMode === 'priority' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allPriorityCards.map((tier) => (
                    <button
                      key={tier.name}
                      type="button"
                      onClick={() => {
                        setPriorityFilter(tier.name);
                        document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/50 transition-all text-left cursor-pointer group"
                      title={`Filter by ${tier.name}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tier.color }} />
                        <span className="text-[11px] font-bold text-slate-800 group-hover:text-amber-900">{tier.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-sm font-extrabold text-slate-900">{tier.value}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">({tier.percentage}%)</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {activePieData.map((entry) => (
                    <button
                      key={entry.name}
                      type="button"
                      onClick={() => {
                        setStatusFilter(entry.name);
                        document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
                      title={`Click to filter queue by ${entry.name}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                      <span className="font-bold text-slate-900 group-hover:text-amber-800">{entry.name}</span>
                      <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {entry.value} ({entry.percentage}%)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. EFFICIENT BAR CHART */}
          <div className="min-w-0 rounded-3xl p-6 border border-slate-200 bg-white shadow-md flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {barChartMode === 'category' ? 'Incidents by Category' : 'Incidents by Department'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {barChartMode === 'category' ? 'Volume distribution across IT categories' : 'Request volume per corporate department'}
                    </p>
                  </div>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setBarChartMode('category')}
                    className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                      barChartMode === 'category'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarChartMode('department')}
                    className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                      barChartMode === 'department'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Department
                  </button>
                </div>
              </div>

              {/* Bar Chart Visual */}
              <div className="w-full h-72 min-w-0">
                {activeBarData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <Inbox className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs font-semibold">No category volume data available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      key={`bar-${barChartMode}`}
                      data={activeBarData}
                      margin={{ top: 22, right: 15, left: -5, bottom: 45 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        fontWeight={600}
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        height={45}
                        dy={6}
                        tickFormatter={(val) => (val && val.length > 14 ? `${val.substring(0, 12)}...` : val)}
                      />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} width={30} />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                        onClick={(entry) => {
                          if (entry?.name) {
                            setSearchQuery(entry.name);
                            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <LabelList dataKey="count" position="top" fill="#1e293b" fontSize={11} fontWeight={700} offset={6} />
                        {activeBarData.map((entry, index) => (
                          <Cell key={`bar-cell-${entry.name}-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick summary footer for Bar chart */}
            <div className="border-t border-slate-100 pt-4 mt-2 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="font-medium">
                Active Categories / Divisions: <strong className="text-slate-900 font-bold">{activeBarData.length}</strong>
              </span>
              <span className="text-[11px] text-amber-700 font-semibold">
                Click any bar to filter queue table →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ALL SUBMITTED TICKETS & AGENT ASSIGNMENT SECTION */}
      <div id="incident-queue-section" className="rounded-3xl border border-slate-200 bg-white shadow-md p-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-300">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Employee Incidents & Agent Assignment Queue
                  </h2>
                  <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold font-mono text-amber-800">
                    {filteredTickets.length} / {tickets.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Problems entered by Employees appear here. Assign an available Support Agent to each complaint.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              Available Agents:
            </span>
            <span className="rounded-xl bg-amber-50 border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800 font-mono inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {agents.length} Online Agents Ready
            </span>
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
            <input
              type="text"
              placeholder="Search by ticket #, employee, title, department, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UNASSIGNED', label: `Unassigned (${unassignedCount})` },
                { id: 'OPEN', label: 'Open' },
                { id: 'ASSIGNED', label: 'Assigned' },
                { id: 'IN PROGRESS', label: 'In Progress' },
                { id: 'RESOLVED', label: 'Resolved' },
                { id: 'CLOSED', label: 'Closed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    statusFilter === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-amber-500 focus:outline-none transition-colors"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={() => downloadTicketsListPDF(filteredTickets, 'Admin Incident Register')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold px-3 py-2 text-xs transition-colors shadow-sm"
              title="Download all filtered problem tickets in PDF format"
            >
              <Download className="h-3.5 w-3.5 text-amber-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-amber-50 p-5 text-amber-600 mb-3 border border-amber-200 shadow-sm">
                <Inbox className="h-8 w-8 text-amber-500" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No incidents match your criteria</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try clearing or adjusting your search filters to view tickets.'
                  : 'No tickets currently logged in the database.'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-amber-50/70 uppercase tracking-wider text-slate-700 border-b border-amber-200/80 font-mono text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-4 font-bold text-slate-800">Ticket #</th>
                  <th scope="col" className="px-4 py-4 font-bold text-slate-800">Employee</th>
                  <th scope="col" className="px-4 py-4 font-bold text-slate-800">Title & Description</th>
                  <th scope="col" className="px-3 py-4 font-bold text-slate-800">Category</th>
                  <th scope="col" className="px-3 py-4 font-bold text-slate-800">Priority</th>
                  <th scope="col" className="px-3 py-4 font-bold text-slate-800">Status</th>
                  <th scope="col" className="px-4 py-4 font-bold text-slate-800">Created Date</th>
                  <th scope="col" className="px-4 py-4 font-bold text-slate-800 min-w-[210px]">Assign to Available Agent</th>
                  <th scope="col" className="px-4 py-4 font-bold text-right text-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const isAssigning = assigningTicketId === ticket._id;
                  const isCopied = copiedId === ticket._id;
                  const isExpanded = expandedDescId === ticket._id;
                  const employee = ticket.createdBy || {};
                  const employeeName = employee.name || 'Anonymous User';
                  const employeeEmail = employee.email || 'No email';
                  const department = employee.departmentName || ticket.departmentName || 'General';
                  const currentAgentId = ticket.assignedTo?._id || ticket.assignedTo || '';

                  return (
                    <tr
                      key={ticket._id}
                      className="hover:bg-amber-50/30 transition-colors duration-150 group"
                    >
                      {/* Ticket Number */}
                      <td className="px-4 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                            className="font-mono text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline transition-colors flex items-center gap-1"
                          >
                            <span>{ticket.ticketNumber}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyTicketNumber(ticket.ticketNumber, ticket._id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy Ticket ID"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Employee Details */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-bold text-slate-950 text-xs shrink-0 shadow-sm">
                            {employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-slate-950 text-xs truncate max-w-[130px]" title={employeeName}>
                              {employeeName}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium truncate max-w-[130px]" title={employeeEmail}>
                              {employeeEmail}
                            </div>
                            <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-slate-600 font-semibold">
                              <Building className="h-2.5 w-2.5 text-amber-600" />
                              <span className="truncate max-w-[110px]">{department}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="px-4 py-4 align-top max-w-xs md:max-w-sm">
                        <div
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                          className="font-bold text-slate-950 hover:text-amber-600 cursor-pointer transition-colors leading-snug line-clamp-1"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {isExpanded ? (
                            <span>{ticket.description}</span>
                          ) : (
                            <span className="line-clamp-2">{ticket.description}</span>
                          )}
                          {ticket.description && ticket.description.length > 80 && (
                            <button
                              type="button"
                              onClick={() => setExpandedDescId(isExpanded ? null : ticket._id)}
                              className="ml-1 text-[10px] text-amber-600 hover:text-amber-700 font-semibold"
                            >
                              {isExpanded ? 'Show less' : 'More'}
                            </button>
                          )}
                        </div>

                        {/* Display Problem Done & Verified Solution */}
                        {(['RESOLVED', 'CLOSED'].includes(ticket.status) || ticket.resolutionNotes || ticket.solution) && (
                          <div className="mt-2.5 rounded-2xl border border-emerald-300 bg-emerald-50/95 p-3.5 shadow-sm space-y-1.5 ring-1 ring-emerald-400/40 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Problem Done • Assigned Task Completed</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-950 font-medium whitespace-pre-wrap leading-relaxed">
                              <span className="font-bold text-emerald-800">Assigned Solution: </span>
                              {ticket.resolutionNotes || ticket.solution || 'Verified & marked as solved.'}
                            </p>
                            {ticket.resolvedAt && (
                              <div className="text-[10px] font-mono text-emerald-700 pt-0.5">
                                Completed At: {new Date(ticket.resolvedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {ticket.attachments?.length > 0 && (
                          <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Paperclip className="h-2.5 w-2.5 text-amber-600" />
                            <span>{ticket.attachments.length} {ticket.attachments.length === 1 ? 'file' : 'files'}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-4 align-top whitespace-nowrap">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200">
                          {ticket.category}
                        </span>
                        {ticket.subcategory && (
                          <span className="block text-[10px] text-slate-500 mt-1 truncate max-w-[100px]">
                            {ticket.subcategory}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-4 align-top whitespace-nowrap">
                        <PriorityBadge priority={ticket.priority} size="xs" />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-4 align-top whitespace-nowrap">
                        <StatusBadge status={ticket.status} size="xs" />
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-4 align-top whitespace-nowrap font-mono text-[11px] text-slate-500">
                        <div>
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(ticket.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Working Assign to Available Agent Option */}
                      <td className="px-4 py-4 align-top min-w-[210px]">
                        <div className="space-y-1.5">
                          <div className="relative">
                            <select
                              value={currentAgentId}
                              disabled={isAssigning}
                              onChange={(e) => handleAssignToAgent(ticket._id, e.target.value)}
                              className={`w-full rounded-xl py-2 pl-2.5 pr-8 text-xs font-semibold border transition-all ${
                                currentAgentId
                                  ? 'bg-white text-slate-800 border-slate-300 focus:border-amber-500'
                                  : 'bg-amber-100/90 text-amber-900 border-amber-400 focus:border-amber-600 shadow-sm'
                              } focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50`}
                            >
                              <option value="" disabled={Boolean(currentAgentId)}>
                                {currentAgentId ? 'Reassign Agent...' : '⚡ Assign to Available Agent...'}
                              </option>
                              {agents.map((ag) => (
                                <option key={ag._id} value={ag._id} className="bg-white text-slate-900">
                                  {ag.name} ({ag.role || 'Agent'}{ag.specialization ? ` • ${ag.specialization}` : ''})
                                </option>
                              ))}
                            </select>

                            {isAssigning && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                              </div>
                            )}
                          </div>

                          {/* Current Assignee Indicator */}
                          {ticket.assignedTo ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                              <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate max-w-[160px]">
                                Assigned to: <strong className="text-slate-950 font-black">{ticket.assignedTo.name}</strong>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
                              <span>Needs assignment to agent</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          {/* Complete & Solve Problem / Edit Solution Button */}
                          {!['RESOLVED', 'CLOSED'].includes(ticket.status) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingTicket(ticket);
                                setResolutionNotes(ticket.resolutionNotes || ticket.solution || '');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-3 py-1.5 text-xs transition-all shadow-sm shadow-emerald-600/20"
                              title="Mark as complete and record solution"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Complete / Solve</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingTicket(ticket);
                                setResolutionNotes(ticket.resolutionNotes || ticket.solution || '');
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1.5 text-xs font-bold transition-colors shadow-sm"
                              title="Update or expand written solution"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Task Done • Edit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => downloadTicketPDF(ticket)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50 transition-all shadow-sm"
                            title="Download Ticket Problem Report (PDF)"
                          >
                            <Download className="h-3.5 w-3.5 text-amber-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs transition-all shadow-sm"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Real-Time System Activity Feed */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-md p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-600" /> Real-Time Incident State Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stream of status transitions, agent allocations, and escalations
            </p>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="group flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>View Full Compliance Log</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {(metrics?.recentActivity || []).map((act) => (
            <div
              key={act._id}
              onClick={() => {
                if (act.ticket?._id) navigate(`/tickets/${act.ticket._id}`);
              }}
              className="flex items-center justify-between py-3.5 cursor-pointer hover:bg-amber-50/40 px-3 rounded-2xl transition-all text-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-8 w-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-800 text-xs shadow-sm">
                  {act.performedBy?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 group-hover:text-amber-700">
                      {act.performedBy?.name}
                    </span>
                    <span className="font-mono text-[11px] text-amber-600 font-semibold">
                      [{act.ticket?.ticketNumber || 'INCIDENT'}]
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5">{act.notes || act.action}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Complete & Solve Problem / Resolution Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-emerald-300/80 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Assign Solution & Mark Problem Done
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record verified resolution notes. The assigned task will immediately show as completed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResolvingTicket(null);
                  setResolutionNotes('');
                }}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Incident Context Overview */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-lg border border-amber-300">
                    {resolvingTicket.ticketNumber}
                  </span>
                  <PriorityBadge priority={resolvingTicket.priority} size="xs" />
                  <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-amber-200">
                    {resolvingTicket.category}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-semibold">
                  Submitted by: <strong className="text-slate-900">{resolvingTicket.createdBy?.name || 'Employee'}</strong>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{resolvingTicket.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {resolvingTicket.description}
              </p>

              {resolvingTicket.assignedTo && (
                <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-800 font-medium border-t border-amber-200/60 mt-2">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Current Assignee: <strong className="text-slate-950 font-bold">{resolvingTicket.assignedTo.name}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Resolution Templates */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>⚡ Quick Resolution Presets (1-Click Fill)</span>
                <span className="text-[10px] text-slate-400 font-normal">Click to insert template</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Diagnostic completed: root cause resolved and verified working with employee.',
                  'Software update and configuration patch successfully applied and tested.',
                  'Credentials and user account permissions reset; employee confirmed access.',
                  'Network routing and connectivity parameters restored and verified.',
                  'Hardware component inspected and repaired; full diagnostic passed.',
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResolutionNotes(tpl)}
                    className="text-left text-[11px] font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-xl px-2.5 py-1.5 transition-all shadow-sm active:scale-95"
                  >
                    • {tpl.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCompleteAndSolve} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 flex items-center justify-between">
                  <span>Verified Solution & Action Taken *</span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">Visible to Employee & Support Team</span>
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Provide clear technical details: explain how the problem was resolved, root cause eliminated, and operational status confirmed..."
                  className="w-full rounded-2xl border border-slate-300 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all font-sans"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setResolvingTicket(null);
                    setResolutionNotes('');
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution || !resolutionNotes.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmittingResolution ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                  <span>Confirm Solution & Mark Done</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
