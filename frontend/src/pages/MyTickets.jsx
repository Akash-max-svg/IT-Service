import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';
import TicketTable from '../components/TicketTable';
import TicketCard from '../components/TicketCard';
import {
  Search,
  Filter,
  PlusCircle,
  LayoutGrid,
  List,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Download,
} from 'lucide-react';
import { downloadTicketsListPDF } from '../utils/pdfGenerator';

const MyTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [successBanner, setSuccessBanner] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [breachedOnly, setBreachedOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessBanner(location.state.successMessage);
      // Clean location state so it doesn't persist across manual page reloads
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search: search || undefined,
        status: status !== 'ALL' ? status : undefined,
        priority: priority !== 'ALL' ? priority : undefined,
        category: category !== 'ALL' ? category : undefined,
        breached: breachedOnly ? 'true' : undefined,
      };

      const { data } = await ticketAPI.getTickets(params);
      setTickets(data.tickets || []);
      setTotalPages(data.pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, status, priority, category, breachedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPriority('ALL');
    setCategory('ALL');
    setBreachedOnly(false);
    setPage(1);
  };

  const statusOptions = [
    'ALL',
    'OPEN',
    'ASSIGNED',
    'IN PROGRESS',
    'WAITING FOR USER',
    'ESCALATED',
    'RESOLVED',
    'CLOSED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'Employee' ? 'My Support Tickets' : 'Incident Management Queue'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {totalCount} total incidents recorded in the system
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => downloadTicketsListPDF(tickets, 'My Incident History Report')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold px-3.5 py-2.5 text-xs transition-colors shadow-sm"
            title="Download problem history in PDF format"
          >
            <Download className="h-4 w-4 text-amber-600" />
            <span>Download PDF</span>
          </button>

          {normalizeRole(user?.role) === 'Employee' && (
            <button
              onClick={() => navigate('/create-ticket')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>File a Complaint</span>
            </button>
          )}
        </div>
      </div>

      {/* Top success alert banner */}
      {successBanner && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="font-semibold text-sm">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-600 hover:text-emerald-800 transition-colors p-1 rounded-lg hover:bg-emerald-100"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket # (INC-...), title, keyword..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </form>

          {/* Breached Checkbox & Reset */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={breachedOnly}
                onChange={(e) => {
                  setBreachedOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> SLA Breached Only
              </span>
            </label>

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold uppercase pr-1 shrink-0">
            Status:
          </span>
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition-colors ${
                status === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {viewMode === 'table' ? (
          <TicketTable tickets={tickets} loading={loading} />
        ) : (
          <div className="p-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">No tickets found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tickets.map((t) => (
                  <TicketCard key={t._id} ticket={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
            <div>
              Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50 text-slate-700"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50 text-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
