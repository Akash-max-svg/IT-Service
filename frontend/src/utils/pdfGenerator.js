import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, professional PDF report for a single incident ticket.
 * Accessible to Admin, Agent, and Employee.
 */
export const downloadTicketPDF = (ticket) => {
  if (!ticket) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('IT SERVICEDESK INCIDENT REPORT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Official IT Incident Record • Generated: ${new Date().toLocaleString()}`, 14, 20);

  y = 38;

  // Incident Number & Status Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Ticket ID: ${ticket.ticketNumber || 'INCIDENT'}`, 18, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Priority: ${ticket.priority || 'MEDIUM'}`, 18, y + 16);
  doc.text(`Status: ${ticket.status || 'OPEN'}`, 80, y + 16);
  doc.text(`Category: ${ticket.category || 'General'}`, 140, y + 16);

  y += 32;

  // Problem Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Incident Summary', 14, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(ticket.title || 'Untitled Problem', pageWidth - 28);
  doc.text(titleLines, 14, y);
  y += titleLines.length * 5 + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(ticket.description || 'No detailed description provided.', pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4.5 + 8;

  // Stakeholder Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Personnel & Unit Details', 14, y);
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  const employee = ticket.createdBy || {};
  const agent = ticket.assignedTo || {};

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Reported By (Employee):', 18, y + 7);
  doc.text('Assigned Specialist (Agent):', 105, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${employee.name || 'Anonymous User'}`, 18, y + 13);
  doc.text(`Email: ${employee.email || 'N/A'}`, 18, y + 19);
  doc.text(`Dept: ${employee.departmentName || ticket.departmentName || 'General'}`, 18, y + 25);

  doc.text(`Name: ${agent.name || 'Not yet assigned'}`, 105, y + 13);
  doc.text(`Email: ${agent.email || 'N/A'}`, 105, y + 19);
  doc.text(`Role: ${agent.role || 'Support Agent'}${agent.specialization ? ` (${agent.specialization})` : ''}`, 105, y + 25);

  y += 36;

  // SLA Resolution Targets
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('3. SLA Lifecycle & 2-Day Resolution Window', 14, y);
  y += 6;

  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 53, 15); // amber-900
  doc.text('Resolution Target: 2 Days (48 Hours)', 18, y + 6);

  const createdAt = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A';
  const targetDate = ticket.resolutionDueAt
    ? new Date(ticket.resolutionDueAt).toLocaleString()
    : new Date(new Date(ticket.createdAt).getTime() + 48 * 3600000).toLocaleString();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Logged: ${createdAt}`, 18, y + 12);
  doc.text(`Target Deadline: ${targetDate}`, 105, y + 12);

  y += 26;

  // Resolution Notes (if available)
  if (ticket.resolutionNotes || ['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('4. Resolution Summary & Completed Fix', 14, y);
    y += 6;

    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(134, 239, 172); // emerald-300
    doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text(`Status: Completed & Solved (${ticket.status})`, 18, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const notes = ticket.resolutionNotes || 'Problem diagnosed and verified as operational by assigned IT specialist.';
    const resLines = doc.splitTextToSize(`Solution: ${notes}`, pageWidth - 36);
    doc.text(resLines, 18, y + 13);

    y += 32;
  }

  // Footer Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'This document is an official IT ServiceDesk technical record. Generated automatically by ServiceDesk Pro.',
    14,
    285
  );

  const cleanNumber = (ticket.ticketNumber || 'INCIDENT').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Incident_Report_${cleanNumber}.pdf`);
};

/**
 * Generates and downloads a multi-ticket tabular summary PDF report.
 * Used by Admin, Agent, and Employee across all dashboards.
 */
export const downloadTicketsListPDF = (tickets = [], title = 'Incident Problems Report') => {
  if (!tickets || tickets.length === 0) {
    alert('No tickets available to export to PDF.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`IT SERVICEDESK • ${title.toUpperCase()}`, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Total Incidents: ${tickets.length} • Resolution Target: 2 Days (48h) • Exported: ${new Date().toLocaleString()}`,
    14,
    18
  );

  // Table Headers
  let y = 32;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y, pageWidth - 28, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text('Ticket #', 16, y + 5.5);
  doc.text('Problem Title', 42, y + 5.5);
  doc.text('Employee', 125, y + 5.5);
  doc.text('Category', 165, y + 5.5);
  doc.text('Priority', 198, y + 5.5);
  doc.text('Status', 222, y + 5.5);
  doc.text('Assigned Agent', 246, y + 5.5);

  y += 10;

  tickets.forEach((t, index) => {
    // Check if new page needed
    if (y > pageHeight - 16) {
      doc.addPage();
      y = 18;

      // Table Header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      doc.text('Ticket #', 16, y + 5.5);
      doc.text('Problem Title', 42, y + 5.5);
      doc.text('Employee', 125, y + 5.5);
      doc.text('Category', 165, y + 5.5);
      doc.text('Priority', 198, y + 5.5);
      doc.text('Status', 222, y + 5.5);
      doc.text('Assigned Agent', 246, y + 5.5);
      y += 10;
    }

    // Zebra row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const ticketNum = t.ticketNumber || 'INC-000';
    const problemTitle = (t.title || '').substring(0, 42);
    const employeeName = (t.createdBy?.name || 'User').substring(0, 20);
    const category = (t.category || 'General').substring(0, 16);
    const priority = t.priority || 'MEDIUM';
    const status = t.status || 'OPEN';
    const agentName = (t.assignedTo?.name || 'Unassigned').substring(0, 18);

    doc.setFont('helvetica', 'bold');
    doc.text(ticketNum, 16, y);

    doc.setFont('helvetica', 'normal');
    doc.text(problemTitle, 42, y);
    doc.text(employeeName, 125, y);
    doc.text(category, 165, y);
    doc.text(priority, 198, y);
    doc.text(status, 222, y);
    doc.text(agentName, 246, y);

    y += 7;
  });

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Exported from IT ServiceDesk Pro. All records strictly governed under the standard 2-Day Resolution SLA policy.`,
    14,
    pageHeight - 6
  );

  doc.save(`Incident_Queue_${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};
