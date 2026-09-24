import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined'
    ? (window.location.port === '3000'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin)
    : 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token from localStorage to every request
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
      // Token expired or invalid
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
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
  createTicket: (formData) =>
    api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateStatus: (id, data) => api.put(`/tickets/${id}/status`, data),
  assignTicket: (id, agentId) => api.put(`/tickets/${id}/assign`, { agentId }),
  escalateTicket: (id, data) => api.put(`/tickets/${id}/escalate`, data),
  submitFeedback: (id, feedback) => api.post(`/tickets/${id}/feedback`, feedback),
};

export const commentAPI = {
  getComments: (ticketId) => api.get(`/comments/${ticketId}`),
  addComment: (formData) =>
    api.post('/comments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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
