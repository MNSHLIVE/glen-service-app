import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, WebhookStatus, UrgentAlertType } from '../types';
import { TECHNICIANS, INITIAL_TICKETS } from '../constants';
import { useToast } from './ToastContext';
import { APP_CONFIG, APP_VERSION } from '../config';

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  technicians: Technician[];
  feedback: Feedback[];
  isSyncing: boolean;
  isAppLoading: boolean;
  webhookStatus: WebhookStatus;
  lastSyncTime: Date | null;
  login: (user: User) => void;
  logout: () => void;
  addTicket: (ticket: any) => void;
  updateTicket: (updatedTicket: Ticket) => void;
  reopenTicket: (ticketId: string, newTechId: string, notes: string) => void;
  markAttendance: (status: 'Clock In' | 'Clock Out') => void;
  sendUrgentAlert: (type: UrgentAlertType, comments: string) => void;
  syncTickets: (isBackground?: boolean) => Promise<void>;
  checkWebhookHealth: () => Promise<void>;
  refreshData: () => void;
  sendHeartbeat: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(WebhookStatus.Unknown);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const { addToast } = useToast();
  const lastSyncRef = useRef({ time: 0 });

  /* -------------------- ADD TICKET (FINAL & CORRECT) -------------------- */
  const addTicket = (ticketData: any) => {
    const ticketId = `PG-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAtISO = new Date().toISOString();

    // 1️⃣ SEND TO CLOUD (n8n → Google Sheet)
    const payload = {
      action: 'NEW_TICKET',
      "Ticket ID": ticketId,
      "Created At": createdAtISO,
      "Service Booking Date": createdAtISO,
      "Preferred Time": ticketData.preferredTime,
      "Customer Name": ticketData.customerName,
      "Phone": ticketData.phone,
      "Address": ticketData.address,
      "Service Category": ticketData.serviceCategory,
      "Complaint": ticketData.complaint,
      "Assigned Technician": ticketData.technicianId,
      "Status": "New Ticket"
    };

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      addToast('Ticket sent to cloud', 'success');
    });

    // 2️⃣ ADD TO LOCAL UI (THIS MAKES IT VISIBLE)
    const localTicket: Ticket = {
      id: ticketId,
      customerName: ticketData.customerName,
      phone: ticketData.phone,
      address: ticketData.address,
      serviceCategory: ticketData.serviceCategory,
      complaint: ticketData.complaint,
      technicianId: ticketData.technicianId,
      preferredTime: ticketData.preferredTime,
      status: TicketStatus.New,
      createdAt: new Date(createdAtISO),
      serviceBookingDate: new Date(createdAtISO),
    };

    setTickets(prev => [localTicket, ...prev]);
  };

  /* -------------------- UPDATE / COMPLETE JOB -------------------- */
  const updateTicket = (updatedTicket: Ticket) => {
  if (updatedTicket.status !== TicketStatus.Completed) return;

  const payload = {
    action: 'JOB_COMPLETED',

    // ✅ MUST MATCH SHEET HEADERS EXACTLY
    "Ticket ID": updatedTicket.id,
    "Completed At": updatedTicket.completedAt || new Date().toISOString(),
    "Technician Name": updatedTicket.technicianName || updatedTicket.technicianId,

    "Work Done Summary": updatedTicket.workDone || "",
    "Amount Collected": updatedTicket.amountCollected || 0,
    "Payment Status": updatedTicket.paymentStatus || "",

    "Points Awarded": updatedTicket.pointsAwarded || 0,

    "Parts Replaced": (updatedTicket.partsReplaced || [])
      .map(p => p.name)
      .join(', '),

    "AMC Discussion": updatedTicket.serviceChecklist?.amcDiscussion
      ? "Discussed AMC plan"
      : "Not Discussed",

    "Free Service": updatedTicket.freeService ? "Yes" : "No"
  };

  fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(() => {
    addToast('Job completed & sheet updated', 'success');
  });
};

  const reopenTicket = (ticketId: string, newTechId: string, notes: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const updatedTicket: Ticket = {
      ...ticket,
      status: TicketStatus.New,
      technicianId: newTechId,
      adminNotes: notes,
      completedAt: undefined
    };

    updateTicket(updatedTicket);
  };

  /* -------------------- SYNC & HEALTH -------------------- */
  const syncTickets = async () => {};
  const checkWebhookHealth = async () => {
    try {
      await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'HEALTH_CHECK' })
      });
      setWebhookStatus(WebhookStatus.Connected);
    } catch {
      setWebhookStatus(WebhookStatus.Error);
    }
  };

  const sendHeartbeat = () => {
    if (!user) return;
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'HEARTBEAT',
        technicianId: user.id,
        technicianName: user.name,
        version: APP_VERSION,
        timestamp: new Date().toISOString()
      })
    });
  };

  const markAttendance = (status: 'Clock In' | 'Clock Out') => {
    if (!user) return;
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ATTENDANCE',
        technicianId: user.id,
        technicianName: user.name,
        status,
        timestamp: new Date().toISOString()
      })
    });
  };

  const sendUrgentAlert = (type: UrgentAlertType, comments: string) => {
    if (!user) return;
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'URGENT_ALERT',
        technicianId: user.id,
        technicianName: user.name,
        alertType: type,
        comments,
        timestamp: new Date().toISOString()
      })
    });
  };

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const refreshData = () => window.location.reload();

  useEffect(() => {
    setTechnicians(TECHNICIANS);
    setTickets(INITIAL_TICKETS);
    setIsAppLoading(false);
    checkWebhookHealth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        tickets,
        technicians,
        feedback,
        isSyncing,
        isAppLoading,
        webhookStatus,
        lastSyncTime,
        login,
        logout,
        addTicket,
        updateTicket,
        reopenTicket,
        markAttendance,
        sendUrgentAlert,
        syncTickets,
        checkWebhookHealth,
        refreshData,
        sendHeartbeat
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext missing');
  return context;
};
