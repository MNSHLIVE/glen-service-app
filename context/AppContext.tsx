import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { TicketStatus, User } from '../types';
import { APP_CONFIG, APP_VERSION } from '../config';

interface AppContextType {
  user: User | null;
  tickets: any[];
  technicians: any[];
  isAppLoading: boolean;
  login: (u: User) => void;
  logout: () => void;
  addTicket: (t: any) => Promise<void>;
  addTechnician: (t: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ---------------- NORMALIZERS ---------------- */

function normalizeTechnicianFromSheet(row: any) {
  if (!row) return null;

  const id = String(row.technician_id || '').trim();
  const name = String(row.technician_name || '').trim();
  const pin = row.pin;

  if (!id || !name) return null;

  return {
    id,
    name,
    pin,
    status: row.status || 'ACTIVE',
    phone: row.phone || '',
    role: row.role || 'Technician',
    vehicleNumber: row.vehicleNumber || '',
  };
}

function normalizeTicketFromSheet(row: any) {
  if (!row) return null;

  const id = String(row.ticket_id || '').trim();
  const customerName = String(row.customer_name || '').trim();
  const complaint = String(row.complaint || '').trim();

  if (!id || !customerName || !complaint) return null;

  let status = TicketStatus.New;
  const raw = String(row.status || '').toLowerCase();
  if (raw.includes('progress')) status = TicketStatus.InProgress;
  if (raw.includes('complete')) status = TicketStatus.Completed;

  return {
    id,
    customerName,
    complaint,
    phone: row.phone || '',
    status,
    technicianId: row.technician_id || '',
    createdAt: new Date(row.created_at || Date.now()),
  };
}

/* ---------------- PROVIDER ---------------- */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);

  /* -------- READ TECHNICIANS -------- */
  const loadTechnicians = async () => {
  const res = await fetch('/api/n8n-proxy?action=read-technician');
  const data = await res.json();

  if (!Array.isArray(data)) return;

  const clean = data
    .map(normalizeTechnicianFromSheet)
    .filter(Boolean);

  setTechnicians(clean);
};


  /* -------- READ TICKETS -------- */
  const loadTickets = async () => {
    const res = await fetch('/api/n8n-proxy?action=read-complaint');
    const data = await res.json();

    if (!Array.isArray(data)) return;

    const clean = data
      .map(normalizeTicketFromSheet)
      .filter(Boolean);

    setTickets(clean);
  };

  /* -------- INIT -------- */
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

  /* -------- ACTIONS -------- */

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
  const technicianId = `TECH-${Date.now()}`;

  const payload = {
    function: 'ADD_TECHNICIAN',

    // 🔑 PRIMARY KEYS (ABSOLUTE MUST)
    technician_id: technicianId,
    technician_name: tech.technician_name || tech.name,

    // OPTIONAL BUT STRUCTURED
    pin: tech.pin || '',
    phone: tech.phone || '',
    role: tech.role || 'Technician',
    vehicleNumber: tech.vehicleNumber || '',
    points: 0,
    status: 'ACTIVE',

    created_at: new Date().toISOString(),
    deleted_at: '',
    app_version: 'v4.6.3',
    last_seen: '',
  };

  await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  alert('✅ Technician added successfully');

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
