# IT-Service: IT Service Desk & Incident Management System

A production-ready enterprise IT Service Desk and Incident Management platform featuring real-time socket communication, SLA policy tracking, customer satisfaction feedback, audit logging, and role-based incident workflows.

---

## 🚀 Key Highlights & Features

### 1. Three Dedicated User Roles
- **Employee:** Submit incidents, monitor progress, upload diagnostic screenshots/logs, add thread comments, reopen unresolved issues, and provide 1-5 star CSAT feedback upon resolution.
- **Support Agent:** View triage queues (assigned, unassigned pool, escalated), 1-click self-claim, update lifecycle status, add public replies or internal staff notes (hidden from employees), and monitor SLA response/resolution deadlines.
- **Administrator:** Executive analytics charts (monthly trends, incident breakdown by category & priority), agent productivity leaderboards, organization department controls, category & subcategory management, and SLA target configuration.

### 2. Incident Lifecycle State Machine
```
[ OPEN ] ──→ [ ASSIGNED ] ──→ [ IN PROGRESS ] ──→ [ RESOLVED ] ──→ [ CLOSED ]
                                    │   ▲              │
                                    │   │              └── [ REOPENED ] ──→ [ IN PROGRESS ]
                                    ├───┼──→ [ WAITING FOR USER ]
                                    │
                                    └───┼──→ [ ESCALATED ]
```

### 3. Priority & SLA Matrix
| Priority | First Response SLA | Resolution SLA | Example Incidents |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | 15 - 30 minutes | 4 hours | Company-wide network outage, production DB timeout |
| **HIGH** | 1 hour | 8 hours | Executive laptop issue, VPN gateway failure |
| **MEDIUM** | 2 hours | 24 hours | Office printer issue, monitor display flickering |
| **LOW** | 4 hours | 48 hours | Non-critical license request, peripheral replacement |

---

## 📁 Project Structure

```
d:/fsdproject/
│
├── frontend/                        # React (Vite) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/              # Navbar, Sidebar, TicketTable, TicketCard, Badges, SLAIndicator
│   │   ├── pages/                   # Login, Register, Dashboard, CreateTicket, MyTickets, TicketDetails, AgentDashboard, AdminDashboard, Users, Reports, Settings
│   │   ├── context/                 # AuthContext (JWT & Socket.IO user rooms)
│   │   ├── hooks/                   # useAuth
│   │   ├── routes/                  # ProtectedRoute (Role Guard)
│   │   ├── services/                # api.js (Axios + Socket.IO)
│   │   ├── App.jsx                  # Main router setup
│   │   └── main.jsx
│   └── package.json
│
├── backend/                         # Node.js + Express Backend API
│   ├── config/                      # db.js (Mongoose + in-memory fallback)
│   ├── controllers/                 # auth, ticket, user, comment, notification, admin
│   ├── models/                      # User, Ticket, Comment, Notification, Category, Department, SLA, Feedback, AuditLog
│   ├── routes/                      # authRoutes, ticketRoutes, userRoutes, commentRoutes, notificationRoutes, adminRoutes
│   ├── middleware/                  # authMiddleware, roleMiddleware, errorMiddleware, uploadMiddleware
│   ├── services/                    # slaService, notificationService, emailService
│   ├── utils/                       # generateTicketNumber, generateToken, seeder
│   ├── uploads/                     # Incident file attachments
│   ├── server.js                    # Express + Socket.IO server
│   └── package.json
│
└── package.json
```

---

## 🔑 Pre-Seeded Demo Accounts

You can log in immediately using the 1-click demo buttons on the login page or using these credentials:

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@servicedesk.com` | `Admin@123` | `/admin`, `/reports`, `/users`, `/settings` |
| **Support Agent** | `agent@servicedesk.com` | `Agent@123` | `/agent`, incident triage queues, claim tickets |
| **Support Agent 2** | `sarah.agent@servicedesk.com` | `Agent@123` | Hardware specialist agent |
| **Employee** | `employee@servicedesk.com` | `Employee@123` | `/dashboard`, `/my-tickets`, `/create-ticket` |
| **Employee 2** | `dev.mark@servicedesk.com` | `Employee@123` | Engineering employee |

---

## 🛠️ Quick Start

### 1. Run the Backend
```bash
cd backend
npm install
npm start
```
> **Note:** The backend automatically starts with an embedded in-memory MongoDB instance and pre-seeds sample categories, departments, SLA rules, demo accounts, and sample tickets if no external `MONGODB_URI` is provided in `.env`.

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.
