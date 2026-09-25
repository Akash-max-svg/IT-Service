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

const COLORS = ['#f59e0b', '#d97706', '#10b981', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#eab308',
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
      <div className="flex h-96 items-center justify-center bg-white rounded-3xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg shadow-amber-500/20" />
          <span className="text-xs font-semibold text-slate-500">Aggregating IT enterprise metrics & incident queue...</span>
        </div>
      </div>
    );
  }

  const counts = metrics?.counts || {};
  const priorityData = (metrics?.priorityDistribution || []).map((p) => ({
    name: p._id,
    value: p.count,
    color: PRIORITY_COLORS[p._id] || '#f59e0b',
  }));

  const categoryData = (metrics?.categoryDistribution || []).map((c) => ({
    name: c._id,
    count: c.count,
  }));

  // Quick count stats for the tickets queue
  const unassignedCount = tickets.filter((t) => !t.assignedTo).length;
  const assignedCount = tickets.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN PROGRESS').length;

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
          className="cursor-pointer rounded-2xl p-4 border border-slate-200 bg-white shadow-sm hover:border-amber-400 transition-all hover:scale-[1.02]"
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
          className="cursor-pointer rounded-2xl p-4 border border-amber-300 bg-amber-50/50 shadow-sm hover:border-amber-500 transition-all hover:scale-[1.02]"
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
          className="cursor-pointer rounded-2xl p-4 border border-slate-200 bg-white shadow-sm hover:border-amber-400 transition-all hover:scale-[1.02]"
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
          className="cursor-pointer rounded-2xl p-4 border border-slate-200 bg-white shadow-sm hover:border-amber-400 transition-all hover:scale-[1.02]"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In Progress</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-600 font-mono">{inProgressCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Under active triage →</span>
        </div>

        <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 font-mono">
            {counts.slaCompliance || 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Service target</span>
        </div>

        <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">User CSAT</span>
          <div className="mt-2 flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-extrabold text-amber-500">{counts.avgCSAT || '5.0'}</span>
            <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Satisfaction score</span>
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
                            <div className="font-semibold text-slate-900 truncate max-w-[130px]" title={employeeName}>
                              {employeeName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[130px]" title={employeeEmail}>
                              {employeeEmail}
                            </div>
                            <div className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-medium">
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
                          className="font-semibold text-slate-900 hover:text-amber-600 cursor-pointer transition-colors leading-snug line-clamp-1"
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
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                              <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate max-w-[160px]">
                                Assigned to: {ticket.assignedTo.name}
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
                        <button
                          type="button"
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs transition-all shadow-sm"
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
        <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Incidents by Classification Category
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Volume distribution across IT services</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 font-mono border border-amber-300">
              Live Aggregate
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#f59e0b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(245,158,11,0.2)',
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Incidents by Severity & Priority
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Critical vs. Standard SLA tiers</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 font-mono border border-amber-300">
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
                    backgroundColor: '#ffffff',
                    borderColor: '#f59e0b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
    </div>
  );
};

export default AdminDashboard;
