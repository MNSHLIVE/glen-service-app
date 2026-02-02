import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { TicketStatus, User } from '../types';
import { APP_CONFIG } from '../config';

interface AppContextType {
  user: User | null;
  tickets: any[];
  technicians: any[];
  isAppLoading: boolean;
  isSyncing: boolean;
  login: (u: User) => void;
  logout: () => void;
  addTicket: (t: any) => Promise<void>;
  addTechnician: (t: any) => Promise<void>;
  deleteTechnician: (technicianId: string) => Promise<void>;
  syncTickets: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingActions = useRef<{ added: Set<string>; deleted: Set<string> }>({
    added: new Set(),
    deleted: new Set(),
  });

  const loadTechnicians = async () => {
    try {
      console.log("🔄 Loading technicians...");
      const res = await fetch('/api/n8n-proxy?action=read-technician');
      const data = await res.json();

      let rawList: any[] = Array.isArray(data) ? data : (data?.data || data?.items || []);

      const normalized = rawList.map((t) => ({
        id: String(t.technician_id || t.id || '').trim(),
        name: String(t.technician_name || t.name || '').trim(),
        phone: t.phone || "",
        pin: String(t.pin || t.password || '').trim(),
        status: t.status || "ACTIVE",
        role: t.role || 'Technician',
        points: Number(t.points || 0),
        lastSeen: t.lastSeen || t.created_at || "",
      })).filter(t => (t.id || t.name) && !pendingActions.current.deleted.has(t.id));

      setTechnicians(normalized);
      localStorage.setItem('technicians', JSON.stringify(normalized));
    } catch (err) {
      console.error("❌ Failed to load technicians:", err);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/n8n-proxy?action=read-complaint');
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const normalized = data.map(row => {
        let status = TicketStatus.New;
        const raw = String(row.status || '').toLowerCase();
        if (raw.includes('progress')) status = TicketStatus.InProgress;
        if (raw.includes('complete')) status = TicketStatus.Completed;

        return {
          id: String(row.ticket_id || row.id || '').trim(),
          customerName: row.customer_name || row.customerName || '',
          phone: row.phone || '',
          address: row.address || '',
          complaint: row.complaint || '',
          technicianId: row.technician_id || row.technicianId || '',
          technicianName: row.technician_name || row.technicianName || '',
          status,
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        };
      });

      setTickets(normalized);
      localStorage.setItem('tickets', JSON.stringify(normalized));
    } catch (err) {
      console.error("❌ Failed to load tickets:", err);
    }
  };

  const syncTickets = async () => {
    setIsSyncing(true);
    await Promise.all([loadTechnicians(), loadTickets()]);
    setIsSyncing(false);
  };

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) setUser(JSON.parse(savedUser));

      const savedTechs = localStorage.getItem('technicians');
      if (savedTechs) setTechnicians(JSON.parse(savedTechs));

      const savedTickets = localStorage.getItem('tickets');
      if (savedTickets) setTickets(JSON.parse(savedTickets));

      await syncTickets();
      setIsAppLoading(false);
    };
    init();
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
    syncTickets();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addTicket = async (ticket: any) => {
    console.log('📤 Sending New Ticket:', ticket);
    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'NEW_TICKET', // Restored 'action' for old n8n compatibility
        function: 'NEW_TICKET', // Keeping 'function' for safety
        ticket
      }),
    });
    setTimeout(syncTickets, 2000);
  };

  const addTechnician = async (tech: any) => {
    const newId = `TECH-${Date.now()}`;
    pendingActions.current.added.add(newId);

    const payload = {
      action: "ADD_TECHNICIAN",
      function: "ADD_TECHNICIAN",
      technician: {
        ...tech,
        id: newId,
        technician_id: newId,
        technician_name: tech.name,
        pin: tech.pin || tech.password || "1234",
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      }
    };

    console.log('📤 Sending Add Technician:', payload);
    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setTimeout(() => {
      pendingActions.current.added.delete(newId);
      syncTickets();
    }, 2000);
  };

  const deleteTechnician = async (technicianId: string) => {
    pendingActions.current.deleted.add(technicianId);
    setTechnicians(prev => prev.filter(t => t.id !== technicianId));

    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_TECHNICIAN',
        function: 'DELETE_TECHNICIAN',
        technicianId,
        id: technicianId
      }),
    });

    setTimeout(() => {
      pendingActions.current.deleted.delete(technicianId);
      syncTickets();
    }, 2000);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tickets,
        technicians,
        isAppLoading,
        isSyncing,
        login,
        logout,
        addTicket,
        addTechnician,
        deleteTechnician,
        syncTickets,
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

