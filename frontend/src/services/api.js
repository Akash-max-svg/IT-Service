import axios from 'axios';
import { io } from 'socket.io-client';

const PRODUCTION_RENDER_BACKEND = 'https://it-service-1-5ehd.onrender.com';

export const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local development (Vite dev server)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '/api';
    }
    // Deployed on Vercel
    if (hostname.includes('vercel.app')) {
      return `${PRODUCTION_RENDER_BACKEND}/api`;
    }
    // Deployed on Render full-stack
    if (hostname.includes('onrender.com')) {
      return '/api';
    }
  }
  return '/api';
};

export const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5000`;
    }
    if (hostname.includes('vercel.app')) {
      return PRODUCTION_RENDER_BACKEND;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app')) {
      return `${PRODUCTION_RENDER_BACKEND}${cleanPath}`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:5000${cleanPath}`;
    }
  }
  return cleanPath;
};

export const SOCKET_URL = resolveSocketUrl();

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname;
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/verify-email');

      // Only redirect if outside authentication screens and not failing a direct login attempt
      if (path !== '/login' && path !== '/register' && !isAuthEndpoint) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Initialize Socket.io connection helper
let socket = null;
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
};

// API Service Functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendCode: (data) => api.post('/auth/resend-code', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const ticketAPI = {
  getTickets: (params) => api.get('/tickets', { params }),
  getTicketById: (id) => api.get(`/tickets/${id}`),
  createTicket: (formData) => api.post('/tickets', formData),
  updateStatus: (id, data) => api.put(`/tickets/${id}/status`, data),
  assignTicket: (id, agentId) => api.put(`/tickets/${id}/assign`, { agentId }),
  escalateTicket: (id, data) => api.put(`/tickets/${id}/escalate`, data),
  submitFeedback: (id, feedback) => api.post(`/tickets/${id}/feedback`, feedback),
};

export const commentAPI = {
  getComments: (ticketId) => api.get(`/comments/${ticketId}`),
  addComment: (formData) => api.post('/comments', formData),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const adminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getReports: () => api.get('/admin/reports'),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  getSLARules: () => api.get('/admin/sla-rules'),
  updateSLARule: (data) => api.put('/admin/sla-rules', data),
};

export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getAgents: () => api.get('/users/agents'),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;
