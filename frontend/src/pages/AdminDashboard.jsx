import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

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

    socket.on('new_ticket', handleUpdate);
    socket.on('ticket_updated', handleUpdate);
    socket.on('ticket_escalated', handleUpdate);
    socket.on('ticket_reopened', handleUpdate);
    socket.on('notification', handleUpdate);

    return () => {
      socket.off('new_ticket', handleUpdate);
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
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20" />
          <span className="text-xs font-semibold text-slate-400">Aggregating IT enterprise metrics & incident queue...</span>
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

  // Quick count stats for the tickets queue
  const unassignedCount = tickets.filter((t) => !t.assignedTo).length;
  const assignedCount = tickets.filter((t) => t.status === 'ASSIGNED').length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN PROGRESS').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-semibold shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/80 via-[#190e2f] to-[#090514] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>Global IT Command & Governance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
              Executive Service Desk Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time telemetry on incident volumes, SLA compliance, employee request queues, and automated agent dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-950/40 px-4 py-3 text-xs font-bold text-purple-200 hover:bg-purple-900/40 shadow-md transition-colors disabled:opacity-50"
              title="Refresh Queue"
            >
              <RefreshCw className={`h-4 w-4 text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => navigate('/users')}
              className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-950/40 px-4 py-3 text-xs font-bold text-purple-200 hover:bg-purple-900/40 shadow-md transition-colors"
            >
              <Users className="h-4 w-4 text-purple-400" />
              <span>Roster Management</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-950/40 px-4 py-3 text-xs font-bold text-purple-200 hover:bg-purple-900/40 shadow-md transition-colors"
            >
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>SLA Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div
          onClick={() => {
            setStatusFilter('ALL');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="glass-card cursor-pointer rounded-2xl p-4 border border-slate-800/80 hover:border-indigo-500/50 transition-all hover:scale-[1.02]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Volume</span>
          <p className="mt-2 text-2xl font-extrabold text-white font-mono">{tickets.length || counts.totalTickets || 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Logged incidents →</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('UNASSIGNED');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="glass-card cursor-pointer rounded-2xl p-4 border border-slate-800/80 hover:border-amber-500/50 transition-all hover:scale-[1.02]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Unassigned</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">{unassignedCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Needs assignment →</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('ASSIGNED');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="glass-card cursor-pointer rounded-2xl p-4 border border-slate-800/80 hover:border-sky-500/50 transition-all hover:scale-[1.02]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Assigned</span>
          <p className="mt-2 text-2xl font-extrabold text-sky-400 font-mono">{assignedCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Awaiting agent start →</span>
        </div>

        <div
          onClick={() => {
            setStatusFilter('IN PROGRESS');
            document.getElementById('incident-queue-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="glass-card cursor-pointer rounded-2xl p-4 border border-slate-800/80 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">In Progress</span>
          <p className="mt-2 text-2xl font-extrabold text-purple-400 font-mono">{inProgressCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Under active triage →</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SLA Compliance</span>
          <p className="mt-2 text-2xl font-extrabold text-indigo-400 font-mono">
            {counts.slaCompliance || 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Service target</span>
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

      {/* ALL SUBMITTED TICKETS & AGENT ASSIGNMENT SECTION */}
      <div id="incident-queue-section" className="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl p-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/30 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    All Employee Submitted Incidents
                  </h2>
                  <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold font-mono text-purple-300">
                    {filteredTickets.length} / {tickets.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fetch and review all employee issues directly from MongoDB and assign them to available Support Agents.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Available Agents:
            </span>
            <span className="rounded-xl bg-slate-800/90 border border-slate-700/70 px-3 py-1 text-xs font-bold text-emerald-400 font-mono inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {agents.length} Online
            </span>
          </div>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search by ticket #, employee, title, department, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-900/90 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills / Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-400">
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
                      ? 'bg-purple-600 text-white shadow-sm font-bold shadow-purple-900/50'
                      : 'hover:text-slate-200 hover:bg-slate-800/60'
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
                className="rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-2xl bg-slate-800/80 p-5 text-slate-500 mb-3 border border-slate-700/60 shadow-inner">
                <Inbox className="h-8 w-8 text-indigo-400" />
              </div>
              <h4 className="text-base font-bold text-white">No incidents match your criteria</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try clearing or adjusting your search filters to view tickets.'
                  : 'No tickets currently logged in the MongoDB database.'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPriorityFilter('ALL');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold hover:bg-indigo-600/50 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-4 font-bold">Ticket #</th>
                  <th scope="col" className="px-4 py-4 font-bold">Employee</th>
                  <th scope="col" className="px-4 py-4 font-bold">Title & Description</th>
                  <th scope="col" className="px-3 py-4 font-bold">Category</th>
                  <th scope="col" className="px-3 py-4 font-bold">Priority</th>
                  <th scope="col" className="px-3 py-4 font-bold">Status</th>
                  <th scope="col" className="px-4 py-4 font-bold">Created Date</th>
                  <th scope="col" className="px-4 py-4 font-bold min-w-[210px]">Assign to Agent</th>
                  <th scope="col" className="px-4 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
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
                      className="hover:bg-slate-800/40 transition-colors duration-150 group"
                    >
                      {/* Ticket Number */}
                      <td className="px-4 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                            className="font-mono text-xs font-bold text-purple-400 hover:text-purple-300 hover:underline transition-colors flex items-center gap-1"
                          >
                            <span>{ticket.ticketNumber}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyTicketNumber(ticket.ticketNumber, ticket._id)}
                            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                            title="Copy Ticket ID"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Employee Details */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                            {employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[130px]" title={employeeName}>
                              {employeeName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[130px]" title={employeeEmail}>
                              {employeeEmail}
                            </div>
                            <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-medium">
                              <Building className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[110px]">{department}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="px-4 py-4 align-top max-w-xs md:max-w-sm">
                        <div
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                          className="font-semibold text-white hover:text-indigo-300 cursor-pointer transition-colors leading-snug line-clamp-1"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {isExpanded ? (
                            <span>{ticket.description}</span>
                          ) : (
                            <span className="line-clamp-2">{ticket.description}</span>
                          )}
                          {ticket.description && ticket.description.length > 80 && (
                            <button
                              type="button"
                              onClick={() => setExpandedDescId(isExpanded ? null : ticket._id)}
                              className="ml-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              {isExpanded ? 'Show less' : 'More'}
                            </button>
                          )}
                        </div>
                        {ticket.attachments?.length > 0 && (
                          <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            <Paperclip className="h-2.5 w-2.5" />
                            <span>{ticket.attachments.length} {ticket.attachments.length === 1 ? 'file' : 'files'}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-4 align-top whitespace-nowrap">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60">
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
                      <td className="px-4 py-4 align-top whitespace-nowrap font-mono text-[11px] text-slate-400">
                        <div>
                          {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(ticket.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Working Assign to Agent Option */}
                      <td className="px-4 py-4 align-top min-w-[210px]">
                        <div className="space-y-1.5">
                          <div className="relative">
                            <select
                              value={currentAgentId}
                              disabled={isAssigning}
                              onChange={(e) => handleAssignToAgent(ticket._id, e.target.value)}
                              className={`w-full rounded-xl py-1.5 pl-2.5 pr-8 text-xs font-medium border transition-all ${
                                currentAgentId
                                  ? 'bg-slate-900 text-slate-200 border-slate-700/80 focus:border-indigo-500'
                                  : 'bg-amber-950/20 text-amber-300 border-amber-500/40 focus:border-amber-400'
                              } focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50`}
                            >
                              <option value="" disabled={Boolean(currentAgentId)}>
                                {currentAgentId ? 'Reassign Agent...' : '⚡ Assign to Agent...'}
                              </option>
                              {agents.map((ag) => (
                                <option key={ag._id} value={ag._id} className="bg-slate-900 text-slate-200">
                                  {ag.name} ({ag.role || 'Agent'}{ag.specialization ? ` • ${ag.specialization}` : ''})
                                </option>
                              ))}
                            </select>

                            {isAssigning && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                              </div>
                            )}
                          </div>

                          {/* Current Assignee Indicator */}
                          {ticket.assignedTo ? (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                              <UserCheck className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[160px] font-medium">
                                Assigned: {ticket.assignedTo.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>Not yet assigned to any agent</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-700/60"
                        >
                          <span>Details</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
