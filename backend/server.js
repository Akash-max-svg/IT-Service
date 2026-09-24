const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const connectDB = require('./config/db');
const seedData = require('./utils/seeder');
const { setSocketIO } = require('./services/notificationService');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, origin || true),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

setSocketIO(io);

// Socket.io room management
io.on('connection', (socket) => {
  // Join user-specific notification channel
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join ticket collaboration room
  socket.on('join_ticket', (ticketId) => {
    if (ticketId) {
      socket.join(`ticket_${ticketId}`);
    }
  });

  socket.on('leave_ticket', (ticketId) => {
    if (ticketId) {
      socket.leave(`ticket_${ticketId}`);
    }
  });

  // Join support staff room (Agents and Admins)
  socket.on('join_support', () => {
    socket.join('support_team');
  });

  socket.on('disconnect', () => {
    // Socket disconnected
  });
});

// Comprehensive CORS configuration for both local dev and production (Vercel & Render)
const allowedOrigins = [
  'https://it-service-desk-xi.vercel.app',
  'https://it-service-1-5ehd.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

const corsOptions = {
  origin: (origin, callback) => {
    // If no origin (e.g. server-to-server, curl, Postman), allow
    if (!origin) return callback(null, true);
    
    // Check exact matches or trusted patterns
    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, origin); // Echo origin back to satisfy credentials mode
    }
    // Permissive fallback so legitimate client requests never get blocked
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file hosting for attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'IT Service Desk & Incident Management API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedData();

  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 IT Service Desk Server running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
};

startServer();

module.exports = { app, server };
