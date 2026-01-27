import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';

import {
  User,
  Ticket,
  Technician,
  TicketStatus,
  UserRole,
  WebhookStatus,
} from '../types';

import { useToast } from './ToastContext';
import { APP_CONFIG, APP_VERSION } from '../config';

/* -------------------- CONTEXT TYPE -------------------- */

interface AppContextType {
  user: User | null;
  technicians: Technician[];
  tickets: Ticket[];
  isAppLoading: boolean;
  webhookStatus: WebhookStatus;

  login: (u: User) => void;
  logout: () => void;

  addTechnician: (tech: Omit<Technician, 'id' | 'points'>) => boolean;
  addTicket: (ticket: any) => void;

  syncTechnicians: () => Promise<void>;
  syncTickets: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* -------------------- NORMALIZERS -------------------- */

/**
 * THIS IS THE CRITICAL FIX
 * Converts Google Sheet rows → UI-safe Technician objects
 */
const normalizeTechnicians = (rows: any[]): Technician[] => {
  return rows
    .filter(r => r.technician_id && r.technician_name)
    .filter(r => !r.deleted_at || r.deleted_at === '-')
    .filter(r => String(r.status).toLowerCase() !== 'deleted')
    .map(r => ({
      id: String(r.technician_id).trim(),
      name: String(r.technician_name).trim(),
      password: r.pin ? String(r.pin) : '',
      points: Number(r.points) || 0,
      status: r.status || 'ACTIVE',
      phone: r.phone || '',
      role: r.role || 'Technician',
      vehicleNumber: r.vehicleNumber || '',
      lastSeen: r.last_seen ? new Date(r.last_seen) : undefined,
    }));
};

const normalizeTickets = (rows: any[]): Ticket[] => {
  return rows.map(r => ({
    ...r,
    id: String(r.id),
    status:
      r.status === 'Completed'
        ? TicketStatus.Completed
        : r.status === 'InProgress'
        ? TicketStatus.InProgress
        : TicketStatus.New,
    createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    serviceBookingDate: r.serviceBookingDate
      ? new Date(r.serviceBookingDate)
      : new Date(),
  }));
};

/* -------------------- PROVIDER -------------------- */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(
    WebhookStatus.Unknown
  );

  /* -------------------- FETCH TECHNICIANS -------------------- */

  const syncTechnicians = useCallback(async () => {
    try {
      const res = await fetch('/api/n8n-proxy?action=read-technician');
      const raw = await res.json();

      if (!Array.isArray(raw)) {
        console.warn('read-technician returned non-array', raw);
        setTechnicians([]);
        return;
      }

      const normalized = normalizeTechnicians(raw);
      setTechnicians(normalized);
      localStorage.setItem('technicians', JSON.stringify(normalized));
    } catch (e) {
      console.error('Failed to load technicians', e);
      setTechnicians([]);
    }
  }, []);

  /* -------------------- FETCH TICKETS -------------------- */

  const syncTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/n8n-proxy?action=read-complaint');
      const raw = await res.json();

      if (!Array.isArray(raw)) {
        console.warn('read-complaint returned non-array', raw);
        setTickets([]);
        return;
      }

      setTickets(normalizeTickets(raw));
    } catch (e) {
      console.error('Failed to load tickets', e);
      setTickets([]);
    }
  }, []);

  /* -------------------- LOGIN / LOGOUT -------------------- */

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
    syncTechnicians();
    syncTickets();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  /* -------------------- ADD TECHNICIAN -------------------- */

  const addTechnician = (tech: Omit<Technician, 'id' | 'points'>): boolean => {
    const newTech = {
      ...tech,
      id: `tech${Date.now()}`,
      points: 0,
    };

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'ADD_TECHNICIAN',
        technician: newTech,
      }),
    })
      .then(res => {
        if (res.ok) {
          addToast('Technician added', 'success');
          setTimeout(syncTechnicians, 1000);
        } else {
          addToast('Failed to add technician', 'error');
        }
      })
      .catch(() => addToast('Network error', 'error'));

    return true;
  };

  /* -------------------- ADD TICKET -------------------- */

  const addTicket = (ticketData: any) => {
    const ticket: Ticket = {
      ...ticketData,
      id: `PG-${Math.floor(1000 + Math.random() * 9000)}`,
      status: TicketStatus.New,
      createdAt: new Date(),
      serviceBookingDate: new Date(),
    };

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'NEW_TICKET',
        ticket,
      }),
    })
      .then(res => {
        if (res.ok) {
          addToast('Ticket created', 'success');
          setTimeout(syncTickets, 1500);
        } else {
          addToast('Ticket creation failed', 'error');
        }
      })
      .catch(() => addToast('Network error', 'error'));
  };

  /* -------------------- INITIAL LOAD -------------------- */

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setUser(JSON.parse(saved));

    syncTechnicians();
    syncTickets();

    setTimeout(() => setIsAppLoading(false), 1000);
  }, [syncTechnicians, syncTickets]);

  /* -------------------- CONTEXT VALUE -------------------- */

  return (
    <AppContext.Provider
      value={{
        user,
        technicians,
        tickets,
        isAppLoading,
        webhookStatus,
        login,
        logout,
        addTechnician,
        addTicket,
        syncTechnicians,
        syncTickets,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* -------------------- HOOK -------------------- */

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
};
