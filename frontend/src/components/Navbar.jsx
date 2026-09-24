import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { notificationAPI, getSocket } from '../services/api';
import { normalizeRole, getRoleDisplayName, getRoleBadgeStyle } from '../utils/roleUtils';
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
  Search,
  Activity,
  CheckCheck,
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

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
      const handleNewNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      };

      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
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
    if (norm === 'Admin') return <Shield className="h-3.5 w-3.5 text-indigo-400" />;
    if (norm === 'Agent') return <Headphones className="h-3.5 w-3.5 text-emerald-400" />;
    return <Briefcase className="h-3.5 w-3.5 text-sky-400" />;
  };

  const userRole = normalizeRole(user?.role);

  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl shadow-lg shadow-black/20">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white lg:hidden transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <span className="font-mono font-bold text-sm tracking-wider">IT</span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                ServiceDesk<span className="text-indigo-400">Pro</span>
              </span>
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Incident & SLA Management</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Verified Role Badge, Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Verified User Role Badge (Non-editable, strict role visibility) */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-900/90 px-3.5 py-1.5 border border-slate-800 shadow-inner">
          <span className="text-[11px] font-medium text-slate-400">Role:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${getRoleBadgeStyle(userRole)}`}>
            {getRoleIcon(userRole)}
            <span>{getRoleDisplayName(userRole)}</span>
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
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl p-4 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
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
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-bold text-white leading-tight">{user?.name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 leading-tight mt-0.5">
                {getRoleIcon(userRole)}
                <span className="font-medium">{getRoleDisplayName(userRole)}</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider font-mono">
                    {user?.departmentName || 'General Dept'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <UserIcon className="h-4 w-4 text-slate-400" /> Profile & System Settings
              </button>

              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
