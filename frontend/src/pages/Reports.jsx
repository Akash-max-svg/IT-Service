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
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Complete Incident & Complaint Problem Reports
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Executive audit of all organization-wide complaints, resolution velocity, agent productivity, and SLA compliance.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold px-4 py-2.5 text-xs transition-colors shadow-sm"
        >
          <Download className="h-4 w-4 text-amber-600" /> Export CSV Report
        </button>
      </div>

      {/* Monthly Incident Volume Trend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Monthly Incident Trend & Resolution Velocity</h3>
            <p className="text-xs text-slate-500">Incoming incident volume vs. successfully resolved tickets</p>
          </div>
          <span className="text-xs text-amber-800 font-mono font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">Last 6 Months</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.length > 0 ? trendData : [{ period: 'Current', Created: 5, Resolved: 2 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
              <Line type="monotone" dataKey="Created" stroke="#f59e0b" strokeWidth={2.5} />
              <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Support Agent Performance Leaderboard */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Support Specialist Productivity & CSAT</h3>
            <p className="text-xs text-slate-500">Total assigned, completed incidents, and average satisfaction score</p>
          </div>
          <Award className="h-5 w-5 text-amber-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-50/70 uppercase tracking-wider text-slate-700 border-b border-amber-200/80 font-mono text-[11px]">
              <tr>
                <th className="px-5 py-4 font-bold text-slate-800">Specialist</th>
                <th className="px-4 py-4 font-bold text-slate-800">Specialization</th>
                <th className="px-4 py-4 text-center font-bold text-slate-800">Assigned</th>
                <th className="px-4 py-4 text-center font-bold text-slate-800">Resolved</th>
                <th className="px-4 py-4 text-center font-bold text-slate-800">Resolution Rate</th>
                <th className="px-4 py-4 text-right font-bold text-slate-800">Avg CSAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(reportsData?.agentPerformance || []).map((ag) => {
                const rate = ag.assignedCount > 0 ? Math.round((ag.resolvedCount / ag.assignedCount) * 100) : 100;
                return (
                  <tr key={ag.agentId} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3.5 font-black text-slate-950">{ag.name}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{ag.specialization || 'IT Support'}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">{ag.assignedCount}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600">{ag.resolvedCount}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-amber-900 font-bold">
                        {rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-600">
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <History className="h-4 w-4 text-amber-600" /> System Audit Trail & Compliance Log
            </h3>
            <p className="text-xs text-slate-500">Tamper-evident log of status updates, escalations, and reassignments</p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'TICKET_CREATED', 'STATUS_UPDATED', 'ASSIGNED_AGENT', 'ESCALATED', 'CLOSED'].map((act) => (
              <button
                key={act}
                onClick={() => handleActionFilterChange(act)}
                className={`rounded-xl px-2.5 py-1 whitespace-nowrap transition-colors ${
                  actionFilter === act
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-50/70 uppercase tracking-wider text-slate-700 border-b border-amber-200/80 font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-800">Timestamp</th>
                <th className="px-4 py-3 font-bold text-slate-800">User</th>
                <th className="px-4 py-3 font-bold text-slate-800">Action</th>
                <th className="px-4 py-3 font-bold text-slate-800">Ticket</th>
                <th className="px-5 py-3 font-bold text-slate-800">Details / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-sans font-black text-slate-950 whitespace-nowrap">
                    {log.performedBy?.name || 'System'} ({log.performedBy?.role})
                  </td>
                  <td className="px-4 py-3 text-amber-800 whitespace-nowrap font-bold">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {log.ticket?.ticketNumber || '—'}
                  </td>
                  <td className="px-5 py-3 font-sans text-slate-700 max-w-sm truncate font-medium">
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
