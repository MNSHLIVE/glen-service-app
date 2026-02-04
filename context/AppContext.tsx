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
import { supabase } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  tickets: any[];
  technicians: any[];
  feedback: any[];
  isAppLoading: boolean;
  isSyncing: boolean;
  login: (u: User) => void;
  logout: () => void;
  addTicket: (t: any) => Promise<void>;
  updateTicket: (t: any) => Promise<void>;
  addFeedback: (f: any) => Promise<void>;
  addTechnician: (t: any) => Promise<void>;
  deleteTechnician: (technicianId: string) => Promise<void>;
  markAttendance: (status: 'Clock In' | 'Clock Out') => Promise<void>;
  sendHeartbeat: () => Promise<void>;
  syncTickets: () => Promise<void>;
  resetAllTechnicianPoints: () => Promise<void>;
  sendReceipt: (ticketId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const normalizeTicket = (t: any) => ({
    ...t,
    customerName: t.customer_name,
    customerEmail: t.customer_email,
    createdAt: t.created_at,
    serviceBookingDate: t.service_booking_date || t.created_at,
    technicianId: t.technician_id,
    technicianName: t.technician_name,
    preferredTime: t.preferred_time,
    serviceCategory: t.category,
    amountCollected: Number(t.amount_collected) || 0,
    paymentStatus: t.payment_method,
    workDone: t.work_done,
    partsReplaced: t.parts_replaced,
    serviceChecklist: t.service_checklist,
    adminNotes: t.admin_notes,
    isEscalated: t.is_escalated,
    completedAt: t.completed_at
  });

  const normalizeTechnician = (tech: any) => ({
    ...tech,
    lastSeen: tech.last_seen,
    pin: tech.pin || tech.password
  });

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) throw error;
      const normalized = (data || []).map(normalizeTechnician);
      setTechnicians(normalized);
      localStorage.setItem('technicians', JSON.stringify(normalized));
    } catch (err) {
      console.error("❌ Supabase: Failed to load technicians:", err);
    }
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map(normalizeTicket);
      setTickets(normalized);
      localStorage.setItem('tickets', JSON.stringify(normalized));
    } catch (err) {
      console.error("❌ Supabase: Failed to load tickets:", err);
    }
  };

  const syncTickets = async () => {
    setIsSyncing(true);
    await Promise.all([loadTechnicians(), loadTickets(), loadFeedback()]);
    setIsSyncing(false);
  };

  const loadFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error("❌ Supabase: Failed to load feedback:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) setUser(JSON.parse(savedUser));

      await syncTickets();
      setIsAppLoading(false);
    };
    init();

    // Subscribe to real-time changes
    const techSub = supabase
      .channel('tech-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, () => loadTechnicians())
      .subscribe();

    const ticketSub = supabase
      .channel('ticket-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => loadTickets())
      .subscribe();

    const feedbackSub = supabase
      .channel('feedback-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => loadFeedback())
      .subscribe();

    return () => {
      supabase.removeChannel(techSub);
      supabase.removeChannel(ticketSub);
      supabase.removeChannel(feedbackSub);
    };
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

  const addTicket = async (ticketData: any) => {
    const newId = `TKT-${Date.now()}`;
    const { error } = await supabase
      .from('tickets')
      .insert([{
        id: newId,
        customer_name: ticketData.customerName,
        customer_email: ticketData.customerEmail,
        phone: ticketData.phone,
        address: ticketData.address,
        complaint: ticketData.complaint,
        status: 'New',
        category: ticketData.serviceCategory || ticketData.category,
        preferred_time: ticketData.preferredTime,
        technician_id: ticketData.technicianId,
        technician_name: ticketData.technicianName,
        service_booking_date: ticketData.serviceBookingDate || new Date().toISOString(),
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("❌ Supabase Error:", error);
      alert("Failed to save ticket: " + error.message);
      return;
    }

    // Optional: Trigger n8n for WhatsApp (Async)
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'NEW_TICKET', ticket: { ...ticketData, ticket_id: newId } })
    }).catch(e => console.warn("n8n WhatsApp trigger failed, but ticket is saved in DB."));

    await loadTickets();
  };

  const updateTicket = async (ticket: any) => {
    console.log("🔄 Supabase: Updating Ticket:", ticket);
    const { error } = await supabase
      .from('tickets')
      .update({
        status: ticket.status,
        completed_at: ticket.status === 'Completed' ? new Date().toISOString() : ticket.completed_at,
        work_done: ticket.workDone,
        amount_collected: ticket.amountCollected,
        payment_method: ticket.paymentStatus || ticket.paymentMethod,
        parts_replaced: ticket.partsReplaced,
        service_checklist: ticket.serviceChecklist,
        admin_notes: ticket.adminNotes,
        technician_id: ticket.technicianId,
        technician_name: ticket.technicianName
      })
      .eq('id', ticket.id);

    if (error) {
      console.error("❌ Supabase Update Error:", error);
      throw error;
    }

    if (ticket.status === 'Completed' && !ticket.completedAt) {
      // Award 50 points to technician on first-time completion
      const currentTech = technicians.find(tech => tech.id === ticket.technicianId);
      const newPoints = (currentTech?.points || 0) + 50;

      await supabase
        .from('technicians')
        .update({ points: newPoints })
        .eq('id', ticket.technicianId);

      await loadTechnicians();

      // Trigger n8n for Invoice (Async)
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'JOB_COMPLETED',
          ticket_id: ticket.id,
          completed_at: new Date().toISOString(),
          technicianId: ticket.technicianId,
          work_done_summary: ticket.workDone,
          amount_collected: ticket.amountCollected,
          payment_status: ticket.paymentStatus || ticket.paymentMethod,
          points_awarded: 50, // Example points
          partsUsed: JSON.stringify(ticket.partsReplaced),
          amc_discussion: ticket.serviceChecklist?.amcDiscussion ? 'Yes' : 'No',
          free_service: ticket.free_service ? 'Yes' : 'No'
        })
      }).catch(() => { });
    }

    await loadTickets();
  };

  const addTechnician = async (tech: any) => {
    const newId = `TECH-${Date.now()}`;
    const { error } = await supabase
      .from('technicians')
      .insert([{
        id: newId,
        name: tech.name,
        pin: tech.pin,
        phone: tech.phone,
        role: tech.role || 'Technician',
        status: 'ACTIVE'
      }]);

    if (error) {
      console.error("❌ Supabase Error:", error);
      alert("Failed to add technician: " + error.message);
      return;
    }

    // Sync to n8n/Google Sheets
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'ADD_TECHNICIAN',
        technician_id: newId,
        technician_name: tech.name,
        pin: tech.pin,
        phone: tech.phone,
        role: tech.role || 'Technician',
        status: 'ACTIVE'
      })
    }).catch(() => { });

    await loadTechnicians();
  };

  const deleteTechnician = async (technicianId: string) => {
    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', technicianId);

    if (error) throw error;

    // Sync to n8n/Google Sheets
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'DELETE_TECHNICIAN',
        technician_id: technicianId,
        status: 'INACTIVE',
        deleted_at: new Date().toISOString()
      })
    }).catch(() => { });

    await loadTechnicians();
  };

  const markAttendance = async (status: 'Clock In' | 'Clock Out') => {
    if (!user) return;
    const { error } = await supabase
      .from('attendance')
      .insert([{
        technician_id: user.id,
        technician_name: user.name,
        status,
        timestamp: new Date().toISOString()
      }]);

    if (error) throw error;

    // Sync to n8n/Google Sheets
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'ATTENDANCE',
        type: status === 'Clock In' ? 'IN' : 'OUT',
        technician_id: user.id,
        technician_name: user.name,
        time: new Date().toISOString()
      })
    }).catch(() => { });
  };

  const sendHeartbeat = async () => {
    if (!user || user.role !== 'Technician') return;
    await supabase
      .from('technicians')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);
  };
  const resetAllTechnicianPoints = async () => {
    try {
      const { error } = await supabase
        .from('technicians')
        .update({ points: 0 });

      if (error) throw error;
      await loadTechnicians();
    } catch (err) {
      console.error("❌ Supabase: Failed to reset points:", err);
      alert("Failed to reset points");
    }
  };

  const addFeedback = async (f: any) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .insert([{
          id: f.id,
          ticket_id: f.ticketId,
          rating: f.rating,
          comment: f.comment,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      await loadFeedback();
    } catch (err) {
      console.error("❌ Supabase: Failed to add feedback:", err);
    }
  };

  const sendReceipt = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const message = `*PAYMENT RECEIPT*\n\n` +
      `Ticket: ${ticketId}\n` +
      `Customer: ${ticket.customerName}\n` +
      `Work: ${ticket.workDone}\n` +
      `Amount Paid: ₹${ticket.amountCollected}\n` +
      `Payment: ${ticket.paymentStatus}\n\n` +
      `Thank you for choosing ${APP_CONFIG.BRANDING.companyName}!`;

    const whatsappUrl = `https://wa.me/91${ticket.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
        updateTicket,
        addTechnician,
        deleteTechnician,
        markAttendance,
        sendHeartbeat,
        syncTickets,
        resetAllTechnicianPoints,
        feedback,
        addFeedback,
        sendReceipt,
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
