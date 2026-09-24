const Ticket = require('../models/Ticket');

const generateTicketNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `INC-${year}${month}${day}`;

  // Find latest ticket created today
  const latestTicket = await Ticket.findOne({
    ticketNumber: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let seq = 1;
  if (latestTicket && latestTicket.ticketNumber) {
    const parts = latestTicket.ticketNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }
  }

  const paddedSeq = String(seq).padStart(4, '0');
  return `${prefix}-${paddedSeq}`;
};

module.exports = generateTicketNumber;
