const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const SLA = require('../models/SLA');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const generateTicketNumber = require('./generateTicketNumber');
const { calculateDeadlines } = require('../services/slaService');

const seedData = async () => {
  try {
    console.log('🌱 Starting Database Seeding...');

    // 1. Departments
    const departmentsData = [
      { name: 'Information Technology', code: 'IT', description: 'Core IT infrastructure and user support' },
      { name: 'Engineering', code: 'ENG', description: 'Product development and cloud architecture' },
      { name: 'Human Resources', code: 'HR', description: 'People operations and talent acquisition' },
      { name: 'Finance & Accounting', code: 'FIN', description: 'Billing, payroll, and financial operations' },
      { name: 'Operations', code: 'OPS', description: 'Facilities and internal operations' },
    ];

    const existingDepts = await Department.countDocuments();
    let departments = [];
    if (existingDepts === 0) {
      departments = await Department.insertMany(departmentsData);
      console.log(`✅ Created ${departments.length} departments`);
    } else {
      departments = await Department.find();
    }

    const itDept = departments.find((d) => d.code === 'IT') || departments[0];
    const hrDept = departments.find((d) => d.code === 'HR') || departments[1];
    const engDept = departments.find((d) => d.code === 'ENG') || departments[2];

    // 2. Categories & Subcategories
    const categoriesData = [
      {
        name: 'Hardware',
        subcategories: ['Laptop / Workstation', 'Monitor / Display', 'Keyboard / Mouse', 'Docking Station', 'RAM / Storage Upgrade'],
        defaultPriority: 'MEDIUM',
        description: 'Physical equipment issues and requests',
      },
      {
        name: 'Software',
        subcategories: ['OS Crash / Blue Screen', 'Office 365 / Email Client', 'Development Tools', 'Browser Issue', 'License Activation'],
        defaultPriority: 'MEDIUM',
        description: 'Installed application glitches and installation requests',
      },
      {
        name: 'Network',
        subcategories: ['Office Wi-Fi Down', 'Ethernet Cable / Port', 'Slow Connection', 'DNS Resolution Error', 'Switch / Router Outage'],
        defaultPriority: 'HIGH',
        description: 'Connectivity, LAN, and Wi-Fi infrastructure',
      },
      {
        name: 'Email',
        subcategories: ['Cannot Send / Receive', 'Spam / Phishing Suspicion', 'Shared Mailbox Access', 'Distribution List Update', 'Outlook Sync'],
        defaultPriority: 'MEDIUM',
        description: 'Corporate messaging and email accounts',
      },
      {
        name: 'Account & Access',
        subcategories: ['Password Reset', 'MFA / Authenticator Lockout', 'Permission Request', 'New Hire Onboarding Setup', 'Role Elevation'],
        defaultPriority: 'MEDIUM',
        description: 'Identity management and directory access',
      },
      {
        name: 'Security',
        subcategories: ['Malware / Virus Detection', 'Compromised Account', 'Suspicious Login Alert', 'Lost / Stolen Laptop', 'Phishing Report'],
        defaultPriority: 'CRITICAL',
        description: 'Information security threats and breaches',
      },
      {
        name: 'Database',
        subcategories: ['Database Connection Timeout', 'Query Performance Degradation', 'Access Privilege Grant', 'Data Backup / Restore', 'Replication Delay'],
        defaultPriority: 'HIGH',
        description: 'Production and staging database services',
      },
      {
        name: 'VPN',
        subcategories: ['VPN Tunnel Disconnects', 'Client Installation', 'Certificate Expired', 'Speed / Throughput Issue', 'Gateway Unreachable'],
        defaultPriority: 'HIGH',
        description: 'Remote access VPN connectivity',
      },
      {
        name: 'Printer',
        subcategories: ['Paper Jam', 'Toner Replacement', 'Network Printer Offline', 'Print Spooler Error', 'Badge Scanner Failure'],
        defaultPriority: 'LOW',
        description: 'Office printing, scanning, and copying hardware',
      },
      {
        name: 'Other',
        subcategories: ['General Inquiry', 'Procurement Request', 'Conference Room Audio/Video', 'Relocation Request'],
        defaultPriority: 'LOW',
        description: 'Miscellaneous requests and general IT help',
      },
    ];

    const existingCats = await Category.countDocuments();
    if (existingCats === 0) {
      await Category.insertMany(categoriesData);
      console.log(`✅ Created ${categoriesData.length} incident categories`);
    }

    // 3. SLA Rules
    const slaData = [
      {
        priority: 'CRITICAL',
        responseTimeMinutes: 15,
        resolutionTimeMinutes: 240, // 4 hours
        description: 'P1 - Outage affecting multiple users or business-critical service',
      },
      {
        priority: 'HIGH',
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 480, // 8 hours
        description: 'P2 - Severe degradation or employee unable to perform core duties',
      },
      {
        priority: 'MEDIUM',
        responseTimeMinutes: 120,
        resolutionTimeMinutes: 1440, // 24 hours
        description: 'P3 - Standard service request or non-blocking technical fault',
      },
      {
        priority: 'LOW',
        responseTimeMinutes: 240,
        resolutionTimeMinutes: 2880, // 48 hours
        description: 'P4 - Minor cosmetic issue, advice, or future equipment request',
      },
    ];

    const existingSLA = await SLA.countDocuments();
    if (existingSLA === 0) {
      await SLA.insertMany(slaData);
      console.log(`✅ Configured SLA Rules for all 4 priority levels`);
    }

    // 4. Default Users
    // Make sure existing demo accounts are verified
    await User.updateMany(
      { email: { $in: ['admin@servicedesk.com', 'agent@servicedesk.com', 'sarah.agent@servicedesk.com', 'employee@servicedesk.com', 'dev.mark@servicedesk.com'] } },
      { $set: { isVerified: true } }
    );

    let admin = await User.findOne({ email: 'admin@servicedesk.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin Supervisor',
        email: 'admin@servicedesk.com',
        password: 'Admin@123',
        role: 'Admin',
        department: itDept._id,
        departmentName: 'Information Technology',
        specialization: 'System Administration & ITIL',
        phone: '+1 (555) 019-2831',
        isVerified: true,
      });
      console.log('✅ Created Admin user (admin@servicedesk.com / Admin@123)');
    }

    let agent1 = await User.findOne({ email: 'agent@servicedesk.com' });
    if (!agent1) {
      agent1 = await User.create({
        name: 'Alex Rivera',
        email: 'agent@servicedesk.com',
        password: 'Agent@123',
        role: 'Agent',
        department: itDept._id,
        departmentName: 'Information Technology',
        specialization: 'Network & Security',
        phone: '+1 (555) 019-5432',
        isVerified: true,
      });
      console.log('✅ Created Support Agent 1 (agent@servicedesk.com / Agent@123)');
    }

    let agent2 = await User.findOne({ email: 'sarah.agent@servicedesk.com' });
    if (!agent2) {
      agent2 = await User.create({
        name: 'Sarah Chen',
        email: 'sarah.agent@servicedesk.com',
        password: 'Agent@123',
        role: 'Agent',
        department: itDept._id,
        departmentName: 'Information Technology',
        specialization: 'Hardware & Workstation Systems',
        phone: '+1 (555) 019-9876',
        isVerified: true,
      });
      console.log('✅ Created Support Agent 2 (sarah.agent@servicedesk.com / Agent@123)');
    }

    let employee = await User.findOne({ email: 'employee@servicedesk.com' });
    if (!employee) {
      employee = await User.create({
        name: 'Jordan Hayes',
        email: 'employee@servicedesk.com',
        password: 'Employee@123',
        role: 'Employee',
        department: hrDept._id,
        departmentName: 'Human Resources',
        phone: '+1 (555) 019-1122',
        isVerified: true,
      });
      console.log('✅ Created Employee user (employee@servicedesk.com / Employee@123)');
    }

    let devEmployee = await User.findOne({ email: 'dev.mark@servicedesk.com' });
    if (!devEmployee) {
      devEmployee = await User.create({
        name: 'Mark Taylor',
        email: 'dev.mark@servicedesk.com',
        password: 'Employee@123',
        role: 'Employee',
        department: engDept._id,
        departmentName: 'Engineering',
        phone: '+1 (555) 019-3344',
        isVerified: true,
      });
      console.log('✅ Created Employee user 2 (dev.mark@servicedesk.com / Employee@123)');
    }

    // 5. Seed Initial Tickets if collection is empty
    const existingTickets = await Ticket.countDocuments();
    if (existingTickets === 0) {
      const ticketsToCreate = [
        {
          title: 'Floor 3 Wi-Fi Gateway Unresponsive',
          description: 'The wireless access point in the east wing of the 3rd floor dropped connection and will not authenticate new laptops.',
          category: 'Network',
          subcategory: 'Office Wi-Fi Down',
          priority: 'HIGH',
          status: 'IN PROGRESS',
          createdBy: employee._id,
          assignedTo: agent1._id,
          departmentName: 'Human Resources',
          respondedAt: new Date(Date.now() - 3600000), // 1 hr ago
        },
        {
          title: 'Company-Wide Production Database Connection Timeout',
          description: 'Customer checkout service is reporting connection pool exhaustion and timing out against primary cluster.',
          category: 'Database',
          subcategory: 'Database Connection Timeout',
          priority: 'CRITICAL',
          status: 'ESCALATED',
          createdBy: devEmployee._id,
          assignedTo: agent1._id,
          departmentName: 'Engineering',
          escalationReason: 'Requires Database Reliability Engineer and Cloud Architect intervention immediately.',
          respondedAt: new Date(Date.now() - 1800000),
        },
        {
          title: 'Printer 2B Jammed and Out of Cyan Toner',
          description: 'Color laser printer outside conference room B is displaying paper tray jam code error E-04.',
          category: 'Printer',
          subcategory: 'Paper Jam',
          priority: 'LOW',
          status: 'OPEN',
          createdBy: employee._id,
          assignedTo: null,
          departmentName: 'Human Resources',
        },
        {
          title: 'Remote VPN Client Error 800 - Gateway Unreachable',
          description: 'Cannot establish secure tunnel while working remotely from home broadband. Logs show handshake timeout.',
          category: 'VPN',
          subcategory: 'VPN Tunnel Disconnects',
          priority: 'HIGH',
          status: 'ASSIGNED',
          createdBy: devEmployee._id,
          assignedTo: agent2._id,
          departmentName: 'Engineering',
        },
        {
          title: 'External Monitor Flickering via HDMI Cable',
          description: 'Dell 27-inch monitor turns black for 2 seconds every few minutes. Tried swapping HDMI cable with no success.',
          category: 'Hardware',
          subcategory: 'Monitor / Display',
          priority: 'MEDIUM',
          status: 'RESOLVED',
          createdBy: employee._id,
          assignedTo: agent2._id,
          departmentName: 'Human Resources',
          resolutionNotes: 'Replaced faulty Thunderbolt 4 USB-C docking station. Display is now stable at 4K 60Hz.',
          resolvedAt: new Date(Date.now() - 7200000),
          respondedAt: new Date(Date.now() - 14400000),
        },
      ];

      for (const t of ticketsToCreate) {
        const ticketNumber = await generateTicketNumber();
        const { responseDueAt, resolutionDueAt } = await calculateDeadlines(t.priority);

        const created = await Ticket.create({
          ...t,
          ticketNumber,
          responseDueAt,
          resolutionDueAt,
        });

        // Add initial audit log
        await AuditLog.create({
          ticket: created._id,
          performedBy: t.createdBy,
          action: 'TICKET_CREATED',
          notes: `Seed incident created: ${t.title}`,
        });

        // Add initial comment if assigned or in progress
        if (t.assignedTo) {
          await Comment.create({
            ticket: created._id,
            user: t.assignedTo,
            message: `Hello! I have picked up this incident and am currently diagnosing the issue. I will update you shortly.`,
            isInternalNote: false,
          });
        }
      }

      console.log(`✅ Seeded ${ticketsToCreate.length} sample tickets with comments & audit trails`);
    }

    console.log('🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeder error:', error);
  }
};

module.exports = seedData;

if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB().then(() => {
    seedData().then(() => {
      process.exit(0);
    });
  });
}
