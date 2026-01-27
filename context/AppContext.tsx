import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { TicketStatus, User, UserRole } from '../types';
import { APP_CONFIG } from '../config';

interface AppContextType {
  user: User | null;
  tickets: any[];
  technicians: any[];
  isAppLoading: boolean;
  login: (u: User) => void;
  logout: () => void;
  addTicket: (t: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* -----------------------------------------
   🔒 PERMANENT NORMALIZER (CORE FIX)
------------------------------------------ */

function normalizeTicketFromSheet(row: any) {
  if (!row) return null;

  const ticketId = String(row.ticket_id || '').trim();
  const customerName = String(row.customer_name || '').trim();
  const complaint = String(row.complaint || '').trim();

  // HARD FILTER — ignore garbage rows
  if (!ticketId || !customerName || !complaint) return null;

  // Normalize status
  const rawStatus = String(row.status || '').toLowerCase();
  let status = TicketStatus.New;
  if (rawStatus.includes('progress')) status = TicketStatus.InProgress;
  if (rawStatus.includes('complete')) status = TicketStatus.Completed;

  // Safe date handling
  const safeDate = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return {
    id: ticketId,
    customerName,
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

/* -----------------------------------------
   PROVIDER
------------------------------------------ */

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);

  /* -------- READ TECHNICIANS -------- */
  const loadTechnicians = async () => {
    const res = await fetch('/api/n8n-proxy?action=read-technician');
    const data = await res.json();
    if (Array.isArray(data)) setTechnicians(data);
  };

  /* -------- READ TICKETS (FIXED) -------- */
  const loadTickets = async () => {
    const res = await fetch('/api/n8n-proxy?action=read-complaint');
    const data = await res.json();

    if (!Array.isArray(data)) return;

    const cleanTickets = data
      .map(normalizeTicketFromSheet)
      .filter(Boolean);

    setTickets(cleanTickets);
  };

  /* -------- INIT -------- */
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

    // Re-read clean data
    setTimeout(loadTickets, 1500);
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
