import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Award,
  Clock,
  ShieldAlert,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  History,
} from 'lucide-react';

const Reports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [{ data: repData }, { data: logsData }] = await Promise.all([
          adminAPI.getReports(),
          adminAPI.getAuditLogs({ limit: 40 }),
        ]);
        setReportsData(repData);
        setAuditLogs(logsData.logs || []);
      } catch (err) {
        console.error('Error fetching reports', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleActionFilterChange = async (act) => {
    setActionFilter(act);
    try {
      const { data } = await adminAPI.getAuditLogs({
        action: act !== 'ALL' ? act : undefined,
        limit: 40,
      });
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to filter audit logs', err);
    }
  };

  const trendData = (reportsData?.monthlyTrend || []).map((t) => ({
    period: `${t._id.month}/${t._id.year}`,
    Created: t.count,
    Resolved: t.resolved,
  }));

  const exportCSV = () => {
    const headers = ['Agent Name', 'Specialization', 'Assigned Incidents', 'Resolved Incidents', 'Avg CSAT Rating'];
    const rows = (reportsData?.agentPerformance || []).map((ag) => [
      `"${ag.name}"`,
      `"${ag.specialization || 'IT Support'}"`,
      ag.assignedCount,
      ag.resolvedCount,
      ag.avgRating,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'agent_performance_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Compiling IT reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            IT Service Desk Reports & SLA Metrics
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Resolution velocity, agent productivity, SLA compliance tracking, and audit trails.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        >
          <Download className="h-4 w-4" /> Export CSV Report
        </button>
      </div>

      {/* Monthly Incident Volume Trend */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Incident Trend & Resolution Velocity</h3>
            <p className="text-xs text-slate-400">Incoming incident volume vs. successfully resolved tickets</p>
          </div>
          <span className="text-xs text-indigo-400 font-mono">Last 6 Months</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.length > 0 ? trendData : [{ period: 'Current', Created: 5, Resolved: 2 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="Created" stroke="#6366f1" strokeWidth={2.5} />
              <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Support Agent Performance Leaderboard */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Support Specialist Productivity & CSAT</h3>
            <p className="text-xs text-slate-400">Total assigned, completed incidents, and average satisfaction score</p>
          </div>
          <Award className="h-5 w-5 text-amber-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
              <tr>
                <th className="px-5 py-3">Specialist</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3 text-center">Assigned</th>
                <th className="px-4 py-3 text-center">Resolved</th>
                <th className="px-4 py-3 text-center">Resolution Rate</th>
                <th className="px-4 py-3 text-right">Avg CSAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {(reportsData?.agentPerformance || []).map((ag) => {
                const rate = ag.assignedCount > 0 ? Math.round((ag.resolvedCount / ag.assignedCount) * 100) : 100;
                return (
                  <tr key={ag.agentId} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-semibold text-white">{ag.name}</td>
                    <td className="px-4 py-3.5 text-slate-400">{ag.specialization || 'IT Support'}</td>
                    <td className="px-4 py-3.5 text-center font-mono">{ag.assignedCount}</td>
                    <td className="px-4 py-3.5 text-center font-mono text-emerald-400">{ag.resolvedCount}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 font-mono text-indigo-400 font-semibold">
                        {rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-400">
                      {ag.avgRating !== 'N/A' ? `${ag.avgRating} ★` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Audit Trail */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-400" /> System Audit Trail & Compliance Log
            </h3>
            <p className="text-xs text-slate-400">Tamper-evident log of status updates, escalations, and reassignments</p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'TICKET_CREATED', 'STATUS_UPDATED', 'ASSIGNED_AGENT', 'ESCALATED', 'CLOSED'].map((act) => (
              <button
                key={act}
                onClick={() => handleActionFilterChange(act)}
                className={`rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors ${
                  actionFilter === act
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-5 py-3">Details / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-sans font-medium text-white whitespace-nowrap">
                    {log.performedBy?.name || 'System'} ({log.performedBy?.role})
                  </td>
                  <td className="px-4 py-3 text-indigo-400 whitespace-nowrap font-bold">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {log.ticket?.ticketNumber || '—'}
                  </td>
                  <td className="px-5 py-3 font-sans text-slate-300 max-w-sm truncate">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
