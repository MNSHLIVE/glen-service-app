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
      console.log("🔄 SYNC: Loading technicians...");
      const res = await fetch('/api/n8n-proxy?action=read-technician');
      const data = await res.json();

      console.log("📊 SYNC: Raw Tech Data from Server:", data);

      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && typeof data === 'object') {
        rawList = data.data || data.items || data.records || [];
      }

      const normalized = rawList.map((t, idx) => {
        // RESILIENT FIELD MAPPING (Handles almost any Google Sheet column name)
        const id = String(t.technician_id || t.id || t.StaffID || t.staff_id || t.ID || '').trim();
        const name = String(t.technician_name || t.name || t.Name || t.FullName || t.StaffName || '').trim();
        const pin = String(t.pin || t.password || t.PIN || t.Password || t.Pass || '').trim();
        const phone = String(t.phone || t.Phone || t.mobile || t.Mobile || '').trim();
        const status = String(t.status || t.Status || t.Active || 'ACTIVE').toUpperCase();

        if (!id && !name) {
          console.warn(`⚠️ SYNC: Row ${idx} is missing both ID and Name:`, t);
        }

        return {
          id: id || `TECH-ERR-${idx}`,
          name: name || "Unnamed Technician",
          phone,
          pin: pin || "1234",
          status,
          role: t.role || t.Role || 'Technician',
          points: Number(t.points || t.Points || 0),
          lastSeen: t.lastSeen || t.last_seen || t.last_active || t.created_at || "",
        };
      }).filter(t => !pendingActions.current.deleted.has(t.id));

      console.log("✅ SYNC: Normalized Technicians:", normalized);
      setTechnicians(normalized);
      localStorage.setItem('technicians', JSON.stringify(normalized));
    } catch (err) {
      console.error("❌ SYNC: Failed to load technicians:", err);
    }
  };

  const loadTickets = async () => {
    try {
      console.log("🔄 SYNC: Loading tickets/complaints...");
      const res = await fetch('/api/n8n-proxy?action=read-complaint');
      const data = await res.json();

      console.log("📊 SYNC: Raw Ticket Data from Server:", data);

      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data && typeof data === 'object') {
        rawList = data.data || data.items || data.records || [];
      }

      const normalized = rawList.map(row => {
        let status = TicketStatus.New;
        const rawStatus = String(row.status || row.Status || '').toLowerCase();
        if (rawStatus.includes('progress') || rawStatus.includes('working')) status = TicketStatus.InProgress;
        if (rawStatus.includes('complete') || rawStatus.includes('done')) status = TicketStatus.Completed;
        if (rawStatus.includes('cancel')) status = TicketStatus.Cancelled;

        return {
          id: String(row.ticket_id || row.id || row.TicketID || row.ID || '').trim(),
          customerName: row.customer_name || row.customerName || row.CustomerName || row.Name || '',
          phone: row.phone || row.Phone || row.Mobile || '',
          address: row.address || row.Address || '',
          complaint: row.complaint || row.Complaint || row.Issue || '',
          technicianId: row.technician_id || row.technicianId || row.StaffID || row.TechID || '',
          technicianName: row.technician_name || row.technicianName || row.StaffName || row.TechName || '',
          status,
          createdAt: row.created_at || row.CreatedAt || row.Date ? new Date(row.created_at || row.CreatedAt || row.Date) : new Date(),
          serviceCategory: row.service_category || row.Category || row.serviceCategory || '',
        };
      });

      console.log("✅ SYNC: Normalized Tickets:", normalized);
      setTickets(normalized);
      localStorage.setItem('tickets', JSON.stringify(normalized));
    } catch (err) {
      console.error("❌ SYNC: Failed to load tickets:", err);
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
    const payload = {
      action: 'NEW_TICKET',
      function: 'NEW_TICKET',
      ...ticket // FLAT payload for maximum compatibility
    };

    console.log('📤 WEBHOOK: Sending New Ticket (FLAT):', payload);

    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setTimeout(syncTickets, 3000);
  };

  const addTechnician = async (tech: any) => {
    const newId = `TECH-${Date.now()}`;
    pendingActions.current.added.add(newId);

    // EXTREMELY ROBUST FLAT PAYLOAD
    // We send every possible field name so n8n can easily map to any Google Sheet column
    const payload = {
      action: "ADD_TECHNICIAN",
      function: "ADD_TECHNICIAN",

      id: newId,
      technician_id: newId,
      staff_id: newId,
      ID: newId,

      name: tech.name,
      technician_name: tech.name,
      staff_name: tech.name,
      FullName: tech.name,
      Name: tech.name,

      pin: tech.pin || tech.password || "1234",
      password: tech.pin || tech.password || "1234",
      PIN: tech.pin || tech.password || "1234",
      Password: tech.pin || tech.password || "1234",

      phone: tech.phone || "",
      Phone: tech.phone || "",
      Mobile: tech.phone || "",

      status: "ACTIVE",
      Status: "ACTIVE",
      role: tech.role || "Technician",
      Role: tech.role || "Technician",
      created_at: new Date().toISOString(),
      CreatedAt: new Date().toISOString(),
      Date: new Date().toISOString(),
    };

    console.log('📤 WEBHOOK: Sending Add Technician (FLAT):', payload);

    try {
      const res = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('✅ WEBHOOK: Response Status:', res.status);
    } catch (err) {
      console.error('❌ WEBHOOK: Failed to send Add Technician:', err);
    }

    setTimeout(() => {
      pendingActions.current.added.delete(newId);
      syncTickets();
    }, 3000);
  };

  const deleteTechnician = async (technicianId: string) => {
    pendingActions.current.deleted.add(technicianId);
    setTechnicians(prev => prev.filter(t => t.id !== technicianId));

    const payload = {
      action: 'DELETE_TECHNICIAN',
      function: 'DELETE_TECHNICIAN',
      technicianId,
      id: technicianId,
      staff_id: technicianId,
      technician_id: technicianId
    };

    console.log('📤 WEBHOOK: Sending Delete Technician:', payload);

    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setTimeout(() => {
      pendingActions.current.deleted.delete(technicianId);
      syncTickets();
    }, 3000);
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
