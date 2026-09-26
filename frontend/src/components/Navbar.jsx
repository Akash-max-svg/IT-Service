import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI, getSocket } from '../services/api';
import { normalizeRole, getRoleDisplayName } from '../utils/roleUtils';
import {
  Bell,
  Check,
  LogOut,
  User as UserIcon,
  Shield,
  Headphones,
  Briefcase,
  ChevronDown,
  Sparkles,
  Lock,
  CheckCheck,
  X,
  AlertCircle,
} from 'lucide-react';

const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Autoplay audio policy fallback
  }
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { currentTheme, themeConfig } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const [{ data: notifs }, { data: countData }] = await Promise.all([
        notificationAPI.getNotifications(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(notifs || []);
      setUnreadCount(countData?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const socket = getSocket();
      socket.emit('join_user', user._id);
      const role = normalizeRole(user.role);
      if (['Agent', 'Admin'].includes(role)) {
        socket.emit('join_support');
      }

      const handleNewNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
        playNotificationChime();
        setActiveToast(notif);
        setTimeout(() => {
          setActiveToast((curr) => (curr?._id === notif?._id ? null : curr));
        }, 7000);
      };

      const handleTicketAssigned = (data) => {
        const myId = user._id?.toString();
        if (data?.assignedTo?._id === myId || data?.agentId === myId) {
          playNotificationChime();
          setActiveToast({
            _id: `assigned-${Date.now()}`,
            title: `🎯 New Ticket Assigned: ${data.ticketNumber}`,
            message: `Administrator assigned incident "${data.title}" (${data.priority}) to you for immediate resolution.`,
            ticket: { _id: data.ticketId, ticketNumber: data.ticketNumber },
          });
          setTimeout(() => {
            setActiveToast(null);
          }, 7000);
        }
      };

      socket.on('notification', handleNewNotification);
      socket.on('ticket_assigned', handleTicketAssigned);

      return () => {
        socket.off('notification', handleNewNotification);
        socket.off('ticket_assigned', handleTicketAssigned);
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAsRead('all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getRoleIcon = (role) => {
    const norm = normalizeRole(role);
    if (norm === 'Admin') return <Shield className="h-3.5 w-3.5 text-purple-400" />;
    if (norm === 'Agent') return <Headphones className="h-3.5 w-3.5 text-emerald-400" />;
    return <Briefcase className="h-3.5 w-3.5 text-sky-400" />;
  };

  const userRole = normalizeRole(user?.role);

  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <header className="portal-navbar relative z-30 flex h-16 min-h-[4rem] max-h-[4rem] shrink-0 flex-shrink-0 w-full items-center justify-between px-4 sm:px-6 backdrop-blur-xl shadow-sm transition-colors duration-200">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="rounded-xl p-2 text-slate-600 hover:bg-amber-50 hover:text-slate-900 lg:hidden transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 transition-transform duration-200 group-hover:scale-105">
            <span className="font-mono font-extrabold text-sm tracking-wider">IT</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 transition-colors">
                ServiceDesk<span className="text-amber-600">Pro</span>
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900">
                {currentTheme === 'admin' ? 'Admin Portal' : currentTheme === 'agent' ? 'Agent Console' : 'Employee Desk'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>{themeConfig.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Locked Position Badge, Notifications & User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Strictly Locked Login Position Indicator */}
        <div
          className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-sm"
          title="Login position strictly locked to your authenticated role. Shifting between positions is disabled."
        >
          <Shield className="h-3.5 w-3.5 text-amber-600" />
          <span>{getRoleDisplayName(userRole)}</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded">
            <Lock className="h-2.5 w-2.5" />
            <span>Locked</span>
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative rounded-xl p-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-all border border-transparent hover:border-slate-700/60"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-[10px] font-extrabold text-white shadow-md shadow-rose-600/50">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl p-4 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                      filterUnreadOnly
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Unread Only
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 mt-2 pr-1">
                {filteredNotifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    No {filterUnreadOnly ? 'unread ' : ''}notifications at this time.
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (n.ticket?._id) {
                          navigate(`/tickets/${n.ticket._id}`);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 rounded-xl text-xs cursor-pointer transition-all my-1 ${
                        !n.isRead
                          ? 'bg-indigo-950/40 border border-indigo-500/20 hover:bg-indigo-900/40 text-slate-200'
                          : 'hover:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${!n.isRead ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400 line-clamp-2 leading-relaxed text-[11px]">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-amber-100/60 transition-all border border-transparent hover:border-amber-300"
          >
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black text-slate-950 shadow-md bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 shadow-amber-500/20"
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-black text-slate-950 leading-tight">{user?.name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 leading-tight mt-0.5">
                {getRoleIcon(userRole)}
                <span className="font-bold text-amber-800">{getRoleDisplayName(userRole)}</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-600" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl p-2 shadow-2xl z-50 bg-white border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="text-xs font-black text-slate-950">{user?.name}</p>
                <p className="text-[11px] text-slate-600 truncate font-medium">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-wider font-mono">
                    {user?.departmentName || 'General Dept'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">● Online</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              >
                <UserIcon className="h-4 w-4 text-amber-600" /> Profile & System Settings
              </button>

              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Floating Notification Banner */}
      {activeToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full rounded-3xl border-2 border-amber-400 bg-white/95 p-4 shadow-[0_15px_35px_rgba(245,158,11,0.25)] backdrop-blur-md animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 shrink-0 shadow-sm">
                <Bell className="h-5 w-5 animate-bounce text-amber-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                    {activeToast.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                  {activeToast.message}
                </p>
                {activeToast.ticket && (
                  <button
                    type="button"
                    onClick={() => {
                      const tId = activeToast.ticket._id || activeToast.ticket;
                      navigate(`/tickets/${tId}`);
                      setActiveToast(null);
                    }}
                    className="inline-flex items-center gap-1 pt-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                  >
                    <span>Open Incident #{activeToast.ticket.ticketNumber || ''} →</span>
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
