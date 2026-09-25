import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI, adminAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import { normalizeRole } from '../utils/roleUtils';
import PriorityBadge from '../components/PriorityBadge';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Send,
  HelpCircle,
  Paperclip,
  Check,
  Flame,
} from 'lucide-react';

const FALLBACK_CATEGORIES = [
  {
    name: 'Hardware',
    subcategories: ['Laptop / Workstation', 'Monitor / Display', 'Keyboard / Mouse', 'Docking Station', 'RAM / Storage Upgrade'],
    defaultPriority: 'MEDIUM',
  },
  {
    name: 'Software',
    subcategories: ['OS Crash / Blue Screen', 'Office 365 / Email Client', 'Development Tools', 'Browser Issue', 'License Activation'],
    defaultPriority: 'MEDIUM',
  },
  {
    name: 'Network',
    subcategories: ['Office Wi-Fi Down', 'Ethernet Cable / Port', 'Slow Connection', 'DNS Resolution Error', 'Switch / Router Outage'],
    defaultPriority: 'HIGH',
  },
  {
    name: 'Email',
    subcategories: ['Cannot Send / Receive', 'Spam / Phishing Suspicion', 'Shared Mailbox Access', 'Distribution List Update', 'Outlook Sync'],
    defaultPriority: 'MEDIUM',
  },
  {
    name: 'Account & Access',
    subcategories: ['Password Reset', 'MFA / Authenticator Lockout', 'Permission Request', 'New Hire Onboarding Setup', 'Role Elevation'],
    defaultPriority: 'MEDIUM',
  },
  {
    name: 'Security',
    subcategories: ['Malware / Virus Detection', 'Compromised Account', 'Suspicious Login Alert', 'Lost / Stolen Laptop', 'Phishing Report'],
    defaultPriority: 'CRITICAL',
  },
  {
    name: 'Database',
    subcategories: ['Database Connection Timeout', 'Query Performance Degradation', 'Access Privilege Grant', 'Data Backup / Restore', 'Replication Delay'],
    defaultPriority: 'HIGH',
  },
  {
    name: 'VPN',
    subcategories: ['VPN Tunnel Disconnects', 'Client Installation', 'Certificate Expired', 'Speed / Throughput Issue', 'Gateway Unreachable'],
    defaultPriority: 'HIGH',
  },
  {
    name: 'Printer',
    subcategories: ['Paper Jam', 'Toner Replacement', 'Network Printer Offline', 'Print Spooler Error', 'Badge Scanner Failure'],
    defaultPriority: 'LOW',
  },
  {
    name: 'Other',
    subcategories: ['General Inquiry', 'Procurement Request', 'Conference Room Audio/Video', 'Relocation Request'],
    defaultPriority: 'LOW',
  },
];

const SLA_INFO = {
  CRITICAL: { response: '15-30m response', resolution: '4 hours max resolution' },
  HIGH:     { response: '1 hour response',  resolution: '8 hours max resolution' },
  MEDIUM:   { response: '2 hours response', resolution: '24 hours max resolution' },
  LOW:      { response: '4 hours response', resolution: '48 hours max resolution' },
};

const CreateTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [subcategory, setSubcategory] = useState('Laptop / Workstation');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [departmentName, setDepartmentName] = useState(user?.departmentName || 'Information Technology');
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = normalizeRole(user?.role);

  useEffect(() => {
    if (user && role !== 'Employee') {
      if (role === 'Admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'Agent') {
        navigate('/agent', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, role, navigate]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await adminAPI.getCategories();
        if (data && data.length > 0) {
          setCategories(data);
          setCategory(data[0].name);
          if (data[0].subcategories?.length > 0) {
            setSubcategory(data[0].subcategories[0]);
          }
          if (data[0].defaultPriority) {
            setPriority(data[0].defaultPriority);
          }
        }
      } catch (err) {
        // Fallback preloaded
      }
    };
    loadCategories();
  }, []);

  const handleCategoryChange = (catName) => {
    setCategory(catName);
    const found = categories.find((c) => c.name === catName);
    if (found && found.subcategories?.length > 0) {
      setSubcategory(found.subcategories[0]);
    } else {
      setSubcategory('');
    }
    if (found?.defaultPriority) {
      setPriority(found.defaultPriority);
    }
  };

  const currentCat = categories.find((c) => c.name === category);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 5) {
        setError('Maximum 5 attachments permitted per ticket.');
        return;
      }
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim() || !description.trim()) {
      setError('Please provide an incident summary title and detailed explanation.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('subcategory', subcategory || '');
      formData.append('priority', priority);
      formData.append('departmentName', departmentName || user?.departmentName || 'Information Technology');
      if (tags) formData.append('tags', tags);

      // Attachments are optional: only append if user selected any files
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const { data } = await ticketAPI.createTicket(formData);

      setSuccessMsg(`Incident Ticket #${data.ticketNumber} submitted successfully! Redirecting to My Tickets...`);
      setTimeout(() => {
        navigate('/my-tickets', {
          state: {
            newTicketId: data._id,
            successMessage: `Incident Ticket #${data.ticketNumber} ("${data.title}") was submitted and logged in MongoDB successfully!`,
          },
        });
      }, 1200);
    } catch (err) {
      console.error('Ticket submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit incident ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user && role !== 'Employee') {
    return (
      <div className="mx-auto max-w-xl py-20 text-center animate-in fade-in">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 shadow-2xl">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Only verified employees are authorized to lodge incident complaint tickets. Your current position is <strong>{role}</strong>.
          </p>
          <button
            onClick={() => navigate(role === 'Admin' ? '/admin' : '/agent')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Return to {role} Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Back button & Tag */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400 font-mono border border-sky-500/25">
          EMPLOYEE COMPLAINT LODGEMENT
        </span>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800/80 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            File an IT Incident Complaint
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Submit equipment malfunctions, system access errors, or technical grievances for IT triage.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 shadow-md animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-md animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Incident Summary / Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wi-Fi dropping connection on 3rd floor conference room"
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Classification Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Specific Subcategory
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {currentCat?.subcategories?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                )) || <option value="">General Issue</option>}
              </select>
            </div>
          </div>

          {/* Priority Matrix Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Urgency & SLA Response Tier <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).map((p) => {
                const isSelected = priority === p;
                return (
                  <div
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <PriorityBadge priority={p} size="xs" />
                      {isSelected && <Check className="h-4 w-4 text-indigo-400 stroke-[3]" />}
                    </div>
                    <p className="mt-3 text-xs font-bold text-white font-mono">
                      {SLA_INFO[p].response}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {SLA_INFO[p].resolution}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Detailed Description & Symptoms <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what happened, any error messages displayed, hardware model, and steps you already tried..."
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner leading-relaxed"
            />
          </div>

          {/* File Attachments Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>Diagnostic Attachments & Screenshots</span>
              <span className="text-slate-500 font-normal lowercase tracking-normal text-[11px]">(optional)</span>
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/60 p-8 text-center hover:border-indigo-500/60 hover:bg-slate-900/80 transition-all cursor-pointer group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-200">
                Click to browse files or drag and drop here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                PNG, JPG, PDF, TXT, LOG up to 10MB each (max 5 attachments)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Uploaded File Previews */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-slate-800/90 px-3.5 py-2 text-xs text-slate-300 border border-slate-700 shadow-sm"
                  >
                    <FileText className="h-4 w-4 text-indigo-400" />
                    <span className="truncate max-w-[180px] font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-1 text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-slate-700 bg-slate-850 px-6 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-7 py-3 text-xs font-bold text-white shadow-xl shadow-sky-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Submit Complaint</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
