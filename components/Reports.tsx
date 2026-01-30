import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TicketStatus, UserRole } from '../types';

/* ================= PROPS ================= */
interface ReportsProps {
  ticketId: string;
  onBack: () => void;
}

/* ================= HELPERS ================= */
const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);

/* ================= MAIN ================= */
const Reports: React.FC<ReportsProps> = ({ ticketId, onBack }) => {
  const { tickets, technicians, user } = useAppContext();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // ✅ SINGLE SOURCE OF TRUTH: context tickets
  const ticket = tickets.find((t: any) => t.id === ticketId);

  const assignedTechnician = technicians.find(
    (t: any) => t.id === ticket?.technicianId
  );

  if (!ticket) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-red-500 font-bold">Ticket not found</p>
        <button
          onClick={onBack}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{ticket.customerName}</h2>
          <p className="text-sm text-gray-500">{ticket.id}</p>
        </div>
        <button onClick={onBack} className="text-blue-600 text-sm font-bold">
          ← Back
        </button>
      </div>

      {/* CUSTOMER INFO */}
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <DetailSection title="Customer & Job Info">
          <DetailItem label="Customer" value={ticket.customerName} />
          <DetailItem label="Phone" value={ticket.phone} />
          <DetailItem label="Address" value={ticket.address} />
          <DetailItem
            label="Booking Date"
            value={ticket.serviceBookingDate
              ? new Date(ticket.serviceBookingDate).toLocaleString()
              : 'N/A'}
          />
          <DetailItem label="Preferred Time" value={ticket.preferredTime} />
          <DetailItem label="Complaint" value={ticket.complaint} />
          <DetailItem
            label="Assigned To"
            value={assignedTechnician?.name || 'Unassigned'}
          />
        </DetailSection>

        {/* COMPLETION SUMMARY */}
        {ticket.status === TicketStatus.Completed && (
          <DetailSection title="Completion Summary">
            <DetailItem
              label="Completed At"
              value={ticket.completedAt
                ? new Date(ticket.completedAt).toLocaleString()
                : 'N/A'}
            />
            <DetailItem label="Work Done" value={ticket.workDone} />
            <DetailItem label="Payment Mode" value={ticket.paymentStatus} />
            <DetailItem
              label="Amount Paid"
              value={`₹${ticket.amountCollected || 0}`}
            />
          </DetailSection>
        )}
      </div>

      {/* PARTS REPLACED */}
      {ticket.partsReplaced && ticket.partsReplaced.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
            Parts Replaced
          </h3>
          <div className="space-y-2">
            {ticket.partsReplaced.map((part: any, index: number) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <p className="font-semibold">{part.name}</p>
                <p className="text-xs text-gray-600">
                  Price: ₹{part.price} | Warranty: {part.warrantyDuration}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECEIPT */}
      {ticket.status === TicketStatus.Completed &&
        user?.role !== UserRole.Technician && (
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
          >
            Generate Receipt
          </button>
        )}
    </div>
  );
};

export default Reports;
