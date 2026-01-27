import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { TicketStatus, User } from '../types';
import { APP_CONFIG } from '../config';

/* =====================================================
   CONTEXT TYPE
===================================================== */

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

/* =====================================================
   NORMALIZERS (PERMANENT FIX)
===================================================== */

function normalizeTechnicianFromSheet(row: any) {
  if (!row) return null;

  const technician_id = String(row.technician_id || '').trim();
  const technician_name = String(row.technician_name || '').trim();

  if (!technician_id || !technician_name) return null;

  if (
    String(row.status || '').toLowerCase() === 'deleted' ||
    row.deleted_at
  ) {
    return null;
  }

  return {
    technician_id,
    technician_name,
    pin: row.pin ? String(row.pin) : '',
    phone: row.phone ? String(row.phone) : '',
    role: row.role || 'Technician',
    vehicleNumber: row.vehicleNumber || '',
    status: String(row.status || 'active').toLowerCase(),
  };
}

function normalizeTicketFromSheet(row: any) {
  if (!row) return null;

  const ticket_id = String(row.ticket_id || '').trim();
  const customer_name = String(row.customer_name || '').trim();
  const complaint = String(row.complaint || '').trim();

  if (!ticket_id || !customer_name || !complaint) return null;

  const rawStatus = String(row.status || '').toLowerCase();
  let status = TicketStatus.New;
  if (rawStatus.includes('progress')) status = TicketStatus.InProgress;
  if (rawStatus.includes('complete')) status = TicketStatus.Completed;

  const safeDate = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return {
    id: ticket_id,
    customerName: customer_name,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    serviceCategory: String(row.service_category || ''),
    complaint,
    technicianId: String(row.assigned_technician || ''),
    status,
    createdAt: safeDate(row.created_at),
    serviceBookingDate: safeDate(row.service_booking_date),
    preferredTime: String(row.preferred_time || ''),
    productMake: String(row.product_make || ''),
    productCategory: String(row.product_category || ''),
    updatedAt: safeDate(row.updated_at),
  };
}

/* =====================================================
   PROVIDER
===================================================== */

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);

  /* ---------- READ TECHNICIANS ---------- */
  const loadTechnicians = async () => {
    const res = await fetch('/api/n8n-proxy?action=read-technician');
    const data = await res.json();

    if (!Array.isArray(data)) return;

    const clean = data
      .map(normalizeTechnicianFromSheet)
      .filter(Boolean);

    setTechnicians(clean);
  };

  /* ---------- READ TICKETS ---------- */
  const loadTickets = async () => {
    const res = await fetch('/api/n8n-proxy?action=read-complaint');
    const data = await res.json();

    if (!Array.isArray(data)) return;

    const clean = data
      .map(normalizeTicketFromSheet)
      .filter(Boolean);

    setTickets(clean);
  };

  /* ---------- INIT ---------- */
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) setUser(JSON.parse(savedUser));

      await loadTechnicians();
      await loadTickets();

      setIsAppLoading(false);
    };

    init();
  }, []);

  /* ---------- AUTH ---------- */
  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  /* ---------- ADD TICKET ---------- */
  const addTicket = async (ticket: any) => {
    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'NEW_TICKET',
        ticket,
      }),
    });

    setTimeout(loadTickets, 1200);
  };

  /* ---------- ADD TECHNICIAN ---------- */
  const addTechnician = async (technician: any) => {
    await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'ADD_TECHNICIAN',
        technician,
      }),
    });

    setTimeout(loadTechnicians, 1200);
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

/* =====================================================
   HOOK
===================================================== */

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext missing');
  return ctx;
};
