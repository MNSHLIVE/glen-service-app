import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { TicketStatus, User } from '../types';
import { APP_CONFIG } from '../config';

interface AppContextType {
  user: User | null;
  tickets: any[];
  technicians: any[];
  isAppLoading: boolean;
  login: (u: User) => void;
  logout: () => void;
  addTicket: (t: any) => Promise<void>;
  addTechnician: (t: any) => Promise<void>;
  deleteTechnician: (technicianId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ================= NORMALIZERS ================= */

function normalizeTechnicianFromSheet(row: any) {
  if (!row) return null;

  return {
    id: String(row.technician_id || '').trim(),
    name: String(row.technician_name || '').trim(),
    pin: String(row.pin || '').trim(),
    status: row.status || 'ACTIVE',
    phone: row.phone || '',
    role: row.role || 'Technician',
    vehicleNumber: row.vehicleNumber || '',
  };
}

function normalizeTicketFromSheet(row: any) {
  if (!row) return null;

  let status = TicketStatus.New;
  const raw = String(row.status || '').toLowerCase();
  if (raw.includes('progress')) status = TicketStatus.InProgress;
  if (raw.includes('complete')) status = TicketStatus.Completed;

  return {
    id: String(row.ticket_id || '').trim(),
    customerName: row.customer_name || '',
    phone: row.phone || '',
    address: row.address || '',
    preferredTime: row.preferred_time || '',
    complaint: row.complaint || '',
    serviceBookingDate: row.service_booking_date || '',
    technicianId: row.technician_id || '',
    technicianName: row.technician_name || '', // 🔑 IMPORTANT
    status,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(0),
    completedAt: row.completed_at || '',
    workDone: row.work_done || '',
    paymentStatus: row.payment_status || '',
    amountCollected: row.amount_collected || 0,
    partsReplaced: row.parts_replaced || [],
  };
}

/* ================= PROVIDER ================= */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const loadTechnicians = async () => {
    try {
      console.log("🔄 Loading technicians from API...");
      const res = await fetch('/api/n8n-proxy?action=read-technician');
      const data = await res.json();

      console.log("📡 Response status:", res.status);
      console.log("📊 Raw technician data:", data);

      // ✅ FORCE ARRAY EXTRACTION (handles n8n, sheets, set nodes, everything)
      let rawList: any[] = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (Array.isArray(data?.data)) {
        rawList = data.data;
      } else if (Array.isArray(data?.items)) {
        rawList = data.items;
      } else if (data && typeof data === "object") {
        rawList = Object.values(data).filter(v => typeof v === "object");
      }

      console.log("✅ Normalized technicians:", rawList);

      setTechnicians(
        rawList.map((t) => ({
          id: String(t.technician_id || t.id || '').trim(),
          name: String(t.technician_name || t.name || '').trim(),
          phone: t.phone || "",
          pin: String(t.pin || '').trim(),
          status: t.status || "ACTIVE",
          role: t.role || 'Technician',
          vehicleNumber: t.vehicleNumber || '',
          created_at: t.created_at || "",
        })).filter(t => t.id || t.name)
      );
    } catch (err) {
      console.error("❌ Failed to load technicians:", err);
      setTechnicians([]);
    }
  };

  const loadTickets = async () => {
    const res = await fetch('/api/n8n-proxy?action=read-complaint');
    const data = await res.json();
    if (!Array.isArray(data)) return;

    setTickets(
      data
        .map(normalizeTicketFromSheet)
        .filter(Boolean)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    );
  };

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('currentUser');
      if (saved) setUser(JSON.parse(saved));
      await loadTechnicians();
      await loadTickets();
      setIsAppLoading(false);
    };
    init();
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addTicket = async (ticket: any) => {
    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'NEW_TICKET', ticket }),
    });
    setTimeout(loadTickets, 1500);
  };

  const addTechnician = async (tech: any) => {
    console.log('📤 Adding technician with data:', tech);

    const payload = {
      function: 'ADD_TECHNICIAN',
      technician_id: `TECH-${Date.now()}`,
      technician_name: String(tech.name || ''),
      pin: String(tech.pin || ''),  // 🔑 FIX: Convert to string to prevent removal
      phone: String(tech.phone || ''),
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    console.log('📤 Payload being sent:', payload);

    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setTimeout(loadTechnicians, 1500);
  };


  const deleteTechnician = async (technicianId: string) => {
    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'DELETE_TECHNICIAN',
        technicianId,
      }),
    });
    setTimeout(loadTechnicians, 1500);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tickets,
        technicians,
        isAppLoading,
        login,
        logout,
        addTicket,
        addTechnician,
        deleteTechnician,
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
