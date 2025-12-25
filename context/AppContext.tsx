import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';

import {
  User,
  Ticket,
  Technician,
  TicketStatus,
  WebhookStatus,
  UrgentAlertType
} from '../types';

import { APP_CONFIG, APP_VERSION } from '../config';
import { useToast } from './ToastContext';

/* ================= CONTEXT TYPE ================= */

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  technicians: Technician[];
  webhookStatus: WebhookStatus;
  isAppLoading: boolean;

  login: (user: User) => void;
  logout: () => void;

  addTicket: (data: any) => Promise<void>;
  updateTicket: (ticket: Ticket) => Promise<void>;
  reopenTicket: (ticketId: string, newTechId: string, notes: string) => void;

  addTechnician: (tech: any) => Promise<boolean>;
  deleteTechnician: (techId: string) => Promise<boolean>;

  markAttendance: (status: 'Clock In' | 'Clock Out') => Promise<void>;
  sendUrgentAlert: (type: UrgentAlertType, comments: string) => Promise<void>;
  sendHeartbeat: () => Promise<void>;
}

/* ================= CONTEXT ================= */

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [webhookStatus] = useState<WebhookStatus>(WebhookStatus.Unknown);
  const [isAppLoading, setIsAppLoading] = useState(true);

  /* ================= AUTH ================= */

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  /* ================= LOAD TECHNICIANS (STABLE) ================= */

  useEffect(() => {
    const saved = localStorage.getItem('technicians');
    if (saved) {
      setTechnicians(JSON.parse(saved));
    }
    setIsAppLoading(false);
  }, []);

  /* ================= SAVE TECHNICIANS ================= */

  useEffect(() => {
    localStorage.setItem('technicians', JSON.stringify(technicians));
  }, [technicians]);

  /* ================= TECHNICIANS ================= */

  const addTechnician = async (tech: any): Promise<boolean> => {
    try {
      const newTech: Technician = {
        id: `TECH-${Date.now()}`,
        name: tech.name,
        phone: tech.phone || '',
        points: 0
      };

      // UI update immediately
      setTechnicians(prev => [...prev, newTech]);

      addToast(
        `Technician added. PIN: ${newTech.id.slice(-4)}`,
        'success'
      );

      // Optional backend sync (won’t break UI if fails)
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_TECHNICIAN',
          technician: newTech
        })
      }).catch(() => {});

      return true;
    } catch {
      addToast('Failed to add technician', 'error');
      return false;
    }
  };

  const deleteTechnician = async (techId: string): Promise<boolean> => {
    try {
      setTechnicians(prev => prev.filter(t => t.id !== techId));
      addToast('Technician removed', 'success');

      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_TECHNICIAN',
          technicianId: techId
        })
      }).catch(() => {});

      return true;
    } catch {
      addToast('Failed to delete technician', 'error');
      return false;
    }
  };

  /* ================= TICKETS ================= */

  const addTicket = async (data: any) => {
    const ticketId = `PG-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    setTickets(prev => [
      {
        id: ticketId,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        serviceCategory: data.serviceCategory,
        complaint: data.complaint,
        technicianId: data.technicianId,
        preferredTime: data.preferredTime,
        status: TicketStatus.New,
        createdAt: new Date(now),
        serviceBookingDate: new Date(now)
      },
      ...prev
    ]);

    addToast('Ticket created', 'success');

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'NEW_TICKET',
        'Ticket ID': ticketId,
        'Created At': now,
        'Service Booking Date': now,
        'Preferred Time': data.preferredTime,
        'Customer Name': data.customerName,
        Phone: data.phone,
        Address: data.address,
        'Service Category': data.serviceCategory,
        Complaint: data.complaint,
        'Assigned Technician': data.technicianId,
        Status: 'New Ticket'
      })
    }).catch(() => {});
  };

  const updateTicket = async (ticket: Ticket) => {
    if (ticket.status !== TicketStatus.Completed) return;

    setTickets(prev =>
      prev.map(t => (t.id === ticket.id ? ticket : t))
    );

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'JOB_COMPLETED',
        'Ticket ID': ticket.id,
        'Completed At': ticket.completedAt || new Date().toISOString(),
        'Technician Name': ticket.technicianId
      })
    }).catch(() => {});
  };

  const reopenTicket = (ticketId: string, newTechId: string, notes: string) => {
    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: TicketStatus.New,
              technicianId: newTechId,
              adminNotes: notes,
              completedAt: undefined
            }
          : t
      )
    );
  };

  /* ================= FIELD ACTIONS ================= */

  const markAttendance = async (status: 'Clock In' | 'Clock Out') => {
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
    }).catch(() => {});
  };

  const sendUrgentAlert = async (type: UrgentAlertType, comments: string) => {
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
    }).catch(() => {});
  };

  const sendHeartbeat = async () => {
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
    }).catch(() => {});
  };

  /* ================= PROVIDER ================= */

  return (
    <AppContext.Provider
      value={{
        user,
        tickets,
        technicians,
        webhookStatus,
        isAppLoading,
        login,
        logout,
        addTicket,
        updateTicket,
        reopenTicket,
        addTechnician,
        deleteTechnician,
        markAttendance,
        sendUrgentAlert,
        sendHeartbeat
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};
