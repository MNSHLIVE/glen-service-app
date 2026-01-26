import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  User,
  Ticket,
  Feedback,
  Technician,
  TicketStatus,
  UserRole,
  WebhookStatus,
  UrgentAlertType,
} from '../types';

import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { APP_CONFIG, APP_VERSION } from '../config';
import { triggerDataSync, updateLastSyncTime } from '../utils/dataSync';

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
  updateTicket: (ticket: Ticket) => void;
  reopenTicket: (id: string, techId: string, notes: string) => void;

  addTechnician: (tech: any) => boolean;
  updateTechnician: (tech: Technician) => void;
  deleteTechnician: (id: string) => void;

  markAttendance: (status: 'Clock In' | 'Clock Out') => void;
  sendUrgentAlert: (type: UrgentAlertType, comments: string) => void;

  syncTickets: (isBackground?: boolean) => Promise<void>;
  checkWebhookHealth: () => Promise<void>;
  sendHeartbeat: () => void;

  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(
    WebhookStatus.Unknown
  );
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // -------------------------
  // READ TICKETS (ONLY PLACE)
  // -------------------------
  const loadTicketsFromServer = async () => {
    try {
      const res = await fetch('/api/n8n-proxy?action=read-complaint');
      const data = await res.json();

      if (!Array.isArray(data)) return;

      const normalized = data.map((t: any) => ({
        ...t,
        status:
          t.status === 'Completed'
            ? TicketStatus.Completed
            : t.status === 'InProgress'
            ? TicketStatus.InProgress
            : TicketStatus.New,
        createdAt: new Date(t.createdAt || Date.now()),
        serviceBookingDate: new Date(t.serviceBookingDate || Date.now()),
      }));

      setTickets(normalized);
      updateLastSyncTime(new Date());
    } catch (e) {
      console.error('read-complaint failed', e);
    }
  };

  // -------------------------
  // READ TECHNICIANS (IMPORTANT FIX)
  // -------------------------
  const loadTechniciansFromServer = async () => {
    try {
      const res = await fetch('/api/n8n-proxy?action=read-technician');
const raw = await res.json();

// ✅ normalize response
const techniciansArray =
  Array.isArray(raw) ? raw :
  Array.isArray(raw?.data) ? raw.data :
  Array.isArray(raw?.technicians) ? raw.technicians :
  [];

setTechnicians(techniciansArray);
localStorage.setItem('technicians', JSON.stringify(techniciansArray));

      localStorage.setItem('technicians', JSON.stringify(data));
    } catch (e) {
      console.error('read-technician failed', e);
    }
  };

  // -------------------------
  // TECHNICIAN SYNC ONLY
  // -------------------------
  const syncTickets = async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setIsSyncing(true);

    try {
      const res = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'FETCH_NEW_JOBS',
          role: user.role,
          technicianId: user.id,
        }),
      });

      if (!res.ok) throw new Error('sync failed');

      setWebhookStatus(WebhookStatus.Connected);
      setLastSyncTime(new Date());
    } catch {
      setWebhookStatus(WebhookStatus.Error);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  // -------------------------
  // APP STARTUP
  // -------------------------
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) setUser(JSON.parse(savedUser));

      const savedTechs = localStorage.getItem('technicians');
      setTechnicians(savedTechs ? JSON.parse(savedTechs) : TECHNICIANS);

      await loadTechniciansFromServer();
      await loadTicketsFromServer();
      await checkWebhookHealth();

      setIsAppLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (user) loadTicketsFromServer();
  }, [user]);

  // -------------------------
  // AUTH
  // -------------------------
  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
    sendHeartbeat();
    syncTickets(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  // -------------------------
  // TICKETS
  // -------------------------
  const addTicket = (ticketData: any) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: `PG-${Math.floor(1000 + Math.random() * 9000)}`,
      status: TicketStatus.New,
      createdAt: new Date(),
      serviceBookingDate: new Date(),
    };

    addToast('New ticket created', 'success');

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'NEW_TICKET', ticket: newTicket }),
    }).then(() =>
      setTimeout(async () => {
        await loadTicketsFromServer();
        triggerDataSync('tickets_updated');
      }, 2000)
    );
  };

  const updateTicket = (ticket: Ticket) => {
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function:
          ticket.status === TicketStatus.Completed
            ? 'JOB_COMPLETED'
            : 'UPDATE_TICKET',
        ticket,
      }),
    }).then(() => loadTicketsFromServer());
  };

  const reopenTicket = (id: string, techId: string, notes: string) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;

    updateTicket({
      ...ticket,
      status: TicketStatus.New,
      technicianId: techId,
      adminNotes: `REOPENED: ${notes}`,
    });
  };

  // -------------------------
  // TECHNICIANS (FIXED)
  // -------------------------
  const addTechnician = (tech: any) => {
    const newTech = { ...tech, id: `tech-${Date.now()}`, points: 0 };
    addToast('Technician added', 'success');

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'ADD_TECHNICIAN', technician: newTech }),
    }).then(loadTechniciansFromServer);

    return true;
  };

  const updateTechnician = (tech: Technician) => {
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'UPDATE_TECHNICIAN', technician: tech }),
    }).then(loadTechniciansFromServer);
  };

  const deleteTechnician = (id: string) => {
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'DELETE_TECHNICIAN', technicianId: id }),
    }).then(loadTechniciansFromServer);
  };

  // -------------------------
  // MISC
  // -------------------------
  const markAttendance = (status: 'Clock In' | 'Clock Out') => {
    if (!user) return;

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'ATTENDANCE',
        technicianId: user.id,
        technicianName: user.name,
        status,
      }),
    });
  };

  const sendUrgentAlert = (type: UrgentAlertType, comments: string) => {
    if (!user) return;

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'URGENT_ALERT',
        technicianId: user.id,
        alertType: type,
        comments,
      }),
    });
  };

  const sendHeartbeat = useCallback(() => {
    if (!user || user.role !== UserRole.Technician) return;

    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'HEARTBEAT',
        technicianId: user.id,
        version: APP_VERSION,
      }),
    });
  }, [user]);

  const checkWebhookHealth = async () => {
    try {
      const res = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: 'HEALTH_CHECK' }),
      });
      setWebhookStatus(
        res.ok ? WebhookStatus.Connected : WebhookStatus.Error
      );
    } catch {
      setWebhookStatus(WebhookStatus.Error);
    }
  };

  const refreshData = () => window.location.reload();

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
        addTechnician,
        updateTechnician,
        deleteTechnician,
        markAttendance,
        sendUrgentAlert,
        syncTickets,
        checkWebhookHealth,
        sendHeartbeat,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext missing');
  return ctx;
};
