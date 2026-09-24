import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ticketAPI, commentAPI, userAPI, getSocket } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SLAIndicator from '../components/SLAIndicator';
import {
  ArrowLeft,
  Clock,
  User,
  Paperclip,
  Send,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Star,
  RotateCcw,
  ShieldAlert,
  ArrowUpRight,
  FileText,
  Calendar,
  Building,
  Check,
  Copy,
  Download,
  Flame,
  MessageSquare,
  History,
  Info,
} from 'lucide-react';

const LIFECYCLE_STEPS = ['OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [commentFiles, setCommentFiles] = useState([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modals & form toggles
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [resolutionQuality, setResolutionQuality] = useState('Excellent');

  const [activeTab, setActiveTab] = useState('discussion'); // 'discussion' or 'audit'

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const [{ data: ticketData }, { data: commentsData }] = await Promise.all([
        ticketAPI.getTicketById(id),
        commentAPI.getComments(id),
      ]);
      setTicket(ticketData.ticket);
      setAuditLogs(ticketData.auditLogs || []);
      setComments(commentsData || []);

      if (['Agent', 'Admin'].includes(user?.role)) {
        const { data: agentList } = await userAPI.getAgents();
        setAgents(agentList || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();

    const socket = getSocket();
    socket.emit('join_ticket', id);

    const handleUpdate = () => {
      fetchTicketData();
    };

    socket.on('notification', handleUpdate);

    return () => {
      socket.emit('leave_ticket', id);
      socket.off('notification', handleUpdate);
    };
  }, [id]);

  const copyTicketNumber = () => {
    if (ticket?.ticketNumber) {
      navigator.clipboard.writeText(ticket.ticketNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && commentFiles.length === 0) return;

    setSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append('ticketId', id);
      formData.append('message', commentText);
      formData.append('isInternalNote', isInternalNote);

      commentFiles.forEach((f) => {
        formData.append('attachments', f);
      });

      const { data: newComment } = await commentAPI.addComment(formData);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setCommentFiles([]);
      setIsInternalNote(false);
      fetchTicketData();
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus, customResolutionNotes = '') => {
    try {
      const { data: updated } = await ticketAPI.updateStatus(id, {
        status: newStatus,
        resolutionNotes: customResolutionNotes || resolutionNotes,
      });
      setTicket(updated);
      setShowResolveModal(false);
      fetchTicketData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssign = async (agentId) => {
    try {
      const { data: updated } = await ticketAPI.assignTicket(id, agentId);
      setTicket(updated);
      fetchTicketData();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleEscalate = async () => {
    try {
      const { data: updated } = await ticketAPI.escalateTicket(id, {
        reason: escalationReason,
        bumpPriority: true,
      });
      setTicket(updated);
      setShowEscalateModal(false);
      fetchTicketData();
    } catch (err) {
      alert(err.response?.data?.message || 'Escalation failed');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await ticketAPI.submitFeedback(id, {
        rating: feedbackRating,
        comments: feedbackComments,
        resolutionQuality,
      });
      setShowFeedbackModal(false);
      fetchTicketData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent shadow-lg shadow-indigo-500/20" />
          <span className="text-xs font-semibold text-slate-400">Loading incident details...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-300 max-w-xl mx-auto my-12">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
        <h3 className="text-lg font-bold">Incident Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">{error || 'Unable to retrieve ticket details.'}</p>
        <button
          onClick={() => navigate('/my-tickets')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Incident Queue
        </button>
      </div>
    );
  }

  const isEmployeeCreator = user?._id === ticket.createdBy?._id;
  const isSupportStaff = ['Agent', 'Admin'].includes(user?.role);
  const currentStepIdx = LIFECYCLE_STEPS.indexOf(
    ticket.status === 'REOPENED' ? 'IN PROGRESS' : ticket.status === 'WAITING FOR USER' ? 'IN PROGRESS' : ticket.status
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 rounded-xl p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={copyTicketNumber}
                className="group inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-bold text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/20 transition-colors"
                title="Click to copy ticket tracking code"
              >
                <span>{ticket.ticketNumber}</span>
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-indigo-400/60 group-hover:text-indigo-300" />
                )}
              </button>

              <PriorityBadge priority={ticket.priority} size="xs" />
              <StatusBadge status={ticket.status} size="xs" />
              <SLAIndicator ticket={ticket} />
            </div>

            <h1 className="mt-2 text-xl font-extrabold text-white sm:text-2xl tracking-tight">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Action Controls for Staff & Creator */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSupportStaff && (
            <>
              {ticket.assignedTo?._id !== user._id && (
                <button
                  onClick={() => handleAssign(user._id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-900/60 shadow-sm"
                >
                  <User className="h-3.5 w-3.5" /> Claim Ticket
                </button>
              )}

              {['OPEN', 'ASSIGNED'].includes(ticket.status) && (
                <button
                  onClick={() => handleStatusChange('IN PROGRESS')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:brightness-110 transition-all"
                >
                  <Clock className="h-3.5 w-3.5" /> Start Progress
                </button>
              )}

              {ticket.status === 'IN PROGRESS' && (
                <>
                  <button
                    onClick={() => handleStatusChange('WAITING FOR USER')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-900/60 transition-colors"
                  >
                    Need User Info
                  </button>
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-colors"
                  >
                    <Flame className="h-3.5 w-3.5 text-rose-400" /> Escalate
                  </button>
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolve Incident
                  </button>
                </>
              )}

              {ticket.status === 'WAITING FOR USER' && (
                <button
                  onClick={() => handleStatusChange('IN PROGRESS')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Resume Progress
                </button>
              )}
            </>
          )}

          {/* Employee Reopen or CSAT Rating */}
          {isEmployeeCreator && ticket.status === 'RESOLVED' && (
            <>
              <button
                onClick={() => handleStatusChange('REOPENED', 'Employee marked: Problem still exists')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/50 bg-orange-950/40 px-4 py-2 text-xs font-bold text-orange-300 hover:bg-orange-900/50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Issue Still Exists (Reopen)
              </button>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-110"
              >
                <Star className="h-3.5 w-3.5 fill-white" /> Rate & Accept Resolution
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visual Lifecycle Stepper */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Incident State Machine Progress
          </span>
          {ticket.status === 'ESCALATED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" /> Escalated to Tier-2
            </span>
          )}
          {ticket.status === 'REOPENED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-3 py-0.5 text-xs font-bold text-orange-300 border border-orange-500/30">
              <RotateCcw className="h-3.5 w-3.5" /> Reopened ({ticket.reopenedCount}x)
            </span>
          )}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-800 -z-0 rounded-full" />
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx > idx || ticket.status === 'CLOSED';
            const isCurrent = currentStepIdx === idx && ticket.status !== 'CLOSED';

            return (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-600/40'
                      : 'bg-slate-900 text-slate-500 border border-slate-700/80'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                </div>
                <span
                  className={`mt-2.5 text-[11px] font-bold whitespace-nowrap ${
                    isCurrent ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details + Discussion & Sidebar Metadata */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Description, Attachments, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Description Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Problem Description & Logs
            </h3>
            <div className="rounded-2xl bg-slate-900/60 p-4 border border-slate-800">
              <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Resolution Banner */}
            {ticket.resolutionNotes && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" /> Resolution Details
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {ticket.resolutionNotes}
                </p>
                {ticket.resolvedAt && (
                  <p className="text-[11px] text-emerald-400 font-mono pt-1">
                    Resolved: {new Date(ticket.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* File Attachments Gallery */}
            {ticket.attachments?.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Attachments ({ticket.attachments.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ticket.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={`http://localhost:5000${file.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="truncate font-medium group-hover:text-white">{file.fileName}</span>
                      </div>
                      <Download className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversation & Audit Tabs */}
          <div className="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
            <div className="flex border-b border-slate-800/80 px-6 pt-4 gap-6">
              <button
                onClick={() => setActiveTab('discussion')}
                className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === 'discussion'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Discussion Thread ({comments.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-3.5 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === 'audit'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Audit Timeline ({auditLogs.length})</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'discussion' ? (
                <div className="space-y-6">
                  {/* Messages Stream */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {comments.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        No communication logged on this incident yet. Post a message below.
                      </div>
                    ) : (
                      comments.map((c) => {
                        const isInternal = c.isInternalNote;
                        const isSender = c.user?._id === user?._id;

                        return (
                          <div
                            key={c._id}
                            className={`rounded-2xl p-4 transition-all duration-200 ${
                              isInternal
                                ? 'border border-amber-500/40 bg-amber-950/20 shadow-md shadow-amber-950/30'
                                : isSender
                                ? 'border border-indigo-500/30 bg-indigo-950/25 ml-4 sm:ml-8'
                                : 'border border-slate-800 bg-slate-900/60 mr-4 sm:mr-8'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white flex items-center justify-center shadow-sm">
                                  {c.user?.name?.charAt(0) || 'U'}
                                </div>
                                <span className="font-bold text-slate-200">{c.user?.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({c.user?.role})
                                </span>
                                {isInternal && (
                                  <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                                    <Lock className="h-2.5 w-2.5" /> Staff Internal Note
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(c.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <p className="mt-3 text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {c.message}
                            </p>

                            {/* Comment Attachments */}
                            {c.attachments?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                {c.attachments.map((f, i) => (
                                  <a
                                    key={i}
                                    href={`http://localhost:5000${f.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-indigo-400 hover:text-white"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    <span>{f.fileName}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Message Box */}
                  <form onSubmit={handleCommentSubmit} className="space-y-3 pt-4 border-t border-slate-800">
                    {isSupportStaff && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer select-none font-semibold">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400"
                          />
                          <Lock className="h-3.5 w-3.5" />
                          <span>Internal Staff Note (Hidden from employee)</span>
                        </label>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Add internal diagnostic comments, root cause analysis, or handover notes...'
                          : 'Write a response or question regarding this incident...'
                      }
                      className={`w-full rounded-2xl border p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                        isInternalNote
                          ? 'border-amber-500/40 bg-amber-950/20 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                          : 'border-slate-700/80 bg-slate-900/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer transition-colors">
                          <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Attach log/file</span>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                setCommentFiles(Array.from(e.target.files));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {commentFiles.length > 0 && (
                          <span className="ml-2 text-xs text-slate-400 font-mono">
                            {commentFiles.length} file(s) ready
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submittingComment}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                          isInternalNote
                            ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                        }`}
                      >
                        {submittingComment ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span>{isInternalNote ? 'Save Internal Note' : 'Send Message'}</span>
                            <Send className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Audit Timeline */
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="relative">
                      <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-bold text-white">
                            {log.performedBy?.name || 'System Worker'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-indigo-400 font-bold">
                          {log.action}
                        </p>
                        {log.notes && (
                          <p className="mt-1 text-slate-300 text-xs leading-relaxed">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata, SLA, Assignee, Requester */}
        <div className="space-y-6">
          {/* SLA Target Monitor */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>SLA Performance Targets</span>
              <PriorityBadge priority={ticket.priority} size="xs" />
            </h3>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">First Response SLA:</span>
                  <SLAIndicator ticket={ticket} type="response" />
                </div>
                {ticket.responseDueAt && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Deadline: {new Date(ticket.responseDueAt).toLocaleTimeString()}
                  </p>
                )}
                {ticket.respondedAt && (
                  <p className="text-[10px] text-emerald-400 font-mono">
                    ✓ First Responded: {new Date(ticket.respondedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Resolution SLA:</span>
                  <SLAIndicator ticket={ticket} type="resolution" />
                </div>
                {ticket.resolutionDueAt && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Target: {new Date(ticket.resolutionDueAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Incident Metadata
            </h3>

            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Category:</span>
              <span className="font-bold text-white">{ticket.category}</span>
            </div>

            {ticket.subcategory && (
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Subcategory:</span>
                <span className="text-slate-300">{ticket.subcategory}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Department:</span>
              <span className="text-slate-300">{ticket.departmentName}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Logged On:</span>
              <span className="text-slate-300 font-mono">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>

            {ticket.closedAt && (
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Closed On:</span>
                <span className="text-emerald-400 font-mono">
                  {new Date(ticket.closedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Assigned Specialist */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Specialist
            </h3>

            {ticket.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-extrabold text-white shadow-md shadow-emerald-500/20">
                  {ticket.assignedTo.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{ticket.assignedTo.name}</h4>
                  <p className="text-xs text-slate-400">{ticket.assignedTo.email}</p>
                  <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    {ticket.assignedTo.specialization || 'IT Support Specialist'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700/80 p-4 text-center text-xs text-slate-500">
                Unassigned ticket. In queue for triage.
              </div>
            )}

            {isSupportStaff && agents.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Reassign to Specialist:
                </label>
                <select
                  value={ticket.assignedTo?._id || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Agent...</option>
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name} ({ag.specialization || ag.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Requester Info */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Requester Profile
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-extrabold text-white shadow-md shadow-indigo-500/20">
                {ticket.createdBy?.name?.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{ticket.createdBy?.name}</h4>
                <p className="text-xs text-slate-400">{ticket.createdBy?.email}</p>
                <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                  {ticket.createdBy?.departmentName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Incident Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Resolve Incident</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Enter the resolution summary and steps taken so the user can verify the fix.
            </p>

            <textarea
              rows={4}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Swapped malfunctioning docking station, verified dual display outputs at 60Hz..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('RESOLVED')}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-emerald-600/30"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Incident Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Escalate Incident</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Specify reason for escalation to Tier-2 engineers or senior leadership. Priority will be automatically bumped to HIGH.
            </p>

            <textarea
              rows={3}
              required
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="e.g. Switch hardware port failure beyond Tier-1 scope..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-3.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-rose-600/30"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSAT Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Incident Satisfaction Feedback</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Please rate your IT resolution experience before closing this incident ticket.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {/* Star Rating Bar */}
              <div className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFeedbackRating(num)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        feedbackRating >= num
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Resolution Experience
                </label>
                <select
                  value={resolutionQuality}
                  onChange={(e) => setResolutionQuality(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none"
                >
                  <option value="Excellent">Excellent - Fast & thorough resolution</option>
                  <option value="Good">Good - Solved properly</option>
                  <option value="Fair">Fair - Took longer than anticipated</option>
                  <option value="Poor">Poor - Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Feedback Remarks
                </label>
                <textarea
                  rows={3}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="Share any comments for the IT service team..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-emerald-600/30"
                >
                  Submit & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
