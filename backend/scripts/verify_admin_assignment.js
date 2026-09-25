const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function verifyAdminAssignmentWorkflow() {
  console.log('--- 1. Testing Login for Admin, Employee, and Agent ---');

  // Login Admin
  const adminRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@servicedesk.com',
      password: 'Admin@123',
    },
  });
  const adminToken = adminRes.token;
  console.log('✓ Admin login successful. Role:', adminRes.role);

  // Login Employee
  const empRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'employee@servicedesk.com',
      password: 'Employee@123',
    },
  });
  const empToken = empRes.token;
  console.log('✓ Employee login successful. User:', empRes.name);

  // Login Agent
  const agentRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'agent@servicedesk.com',
      password: 'Agent@123',
    },
  });
  const agentToken = agentRes.token;
  console.log('✓ Agent login successful. Agent:', agentRes.name, 'ID:', agentRes._id || agentRes.id);

  console.log('\n--- 2. Employee Submits a New Complaint/Incident ---');
  const createdTicket = await request('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      title: 'VPN Connection Drop during Video Conference',
      description: 'The Cisco AnyConnect VPN drops every 10 minutes when connected to corporate WiFi.',
      category: 'Network',
      subcategory: 'VPN',
      priority: 'HIGH',
      departmentName: 'Engineering',
    },
  });
  console.log('✓ Ticket created in MongoDB!');
  console.log('  Ticket Number:', createdTicket.ticketNumber);
  console.log('  Status:', createdTicket.status);
  console.log('  Assigned To:', createdTicket.assignedTo);
  console.log('  Created By:', createdTicket.createdBy?.name, `(${createdTicket.createdBy?.email})`);

  console.log('\n--- 3. Admin Fetches All Tickets from MongoDB ---');
  const adminTicketsRes = await request('/tickets?limit=100', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allTickets = adminTicketsRes.tickets;
  console.log(`✓ Admin retrieved ${allTickets.length} tickets from MongoDB.`);

  const foundTicket = allTickets.find((t) => t._id === createdTicket._id);
  if (!foundTicket) {
    throw new Error('Created ticket not found in Admin tickets list!');
  }
  console.log('✓ Verified created ticket is visible to Admin with all fields:');
  console.log('  - Ticket Number:', foundTicket.ticketNumber);
  console.log('  - Employee Details:');
  console.log('      Name:', foundTicket.createdBy?.name);
  console.log('      Email:', foundTicket.createdBy?.email);
  console.log('      Department:', foundTicket.createdBy?.departmentName);
  console.log('  - Title:', foundTicket.title);
  console.log('  - Description:', foundTicket.description);
  console.log('  - Category:', foundTicket.category);
  console.log('  - Priority:', foundTicket.priority);
  console.log('  - Status:', foundTicket.status);
  console.log('  - Created Date:', foundTicket.createdAt);

  console.log('\n--- 4. Admin Fetches Available Agents ---');
  const agents = await request('/users/agents', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ Admin fetched ${agents.length} available support agents.`);
  const targetAgent = agents.find((a) => a.email === 'agent@servicedesk.com') || agents[0];
  console.log(`  Selected Agent for assignment: ${targetAgent.name} (${targetAgent.email}, ID: ${targetAgent._id})`);

  console.log('\n--- 5. Admin Assigns Ticket to Agent ---');
  const assignedTicket = await request(`/tickets/${foundTicket._id}/assign`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { agentId: targetAgent._id },
  });
  console.log('✓ Ticket assignment API response received:');
  console.log('  - Assigned To ID in MongoDB:', assignedTicket.assignedTo?._id);
  console.log('  - Assigned Agent Name:', assignedTicket.assignedTo?.name);
  console.log('  - Status:', assignedTicket.status);

  if (assignedTicket.status !== 'ASSIGNED') {
    throw new Error(`Expected status ASSIGNED but got ${assignedTicket.status}`);
  }
  if (assignedTicket.assignedTo?._id?.toString() !== targetAgent._id.toString()) {
    throw new Error('assignedTo does not match selected agent ID!');
  }

  console.log("\n--- 6. Verify Ticket Appears in Selected Agent's Dashboard ---");
  const agentTicketsRes = await request('/tickets?limit=100', {
    headers: { Authorization: `Bearer ${agentToken}` },
  });
  const agentTickets = agentTicketsRes.tickets;
  const agentAssignedTicket = agentTickets.find((t) => t._id === foundTicket._id);

  if (!agentAssignedTicket) {
    throw new Error("Assigned ticket was NOT found in Agent's tickets response!");
  }
  console.log("✓ Ticket successfully found in Agent's queue!");
  console.log('  - Ticket #:', agentAssignedTicket.ticketNumber);
  console.log('  - Status:', agentAssignedTicket.status);
  console.log('  - Assigned To:', agentAssignedTicket.assignedTo?.name);

  console.log('\n========================================');
  console.log('🎉 ALL ADMIN ASSIGNMENT & QUEUE CHECKS PASSED 100%!');
  console.log('========================================');
}

verifyAdminAssignmentWorkflow().catch((err) => {
  console.error('❌ Verification failed:', err.data || err.message);
  process.exit(1);
});
