import React, { createContext, useContext, useState, useCallback } from "react";
import { User, Technician, Ticket, TicketStatus, WebhookStatus } from "../types";
import { TECHNICIANS, INITIAL_TICKETS } from "../constants";
import { APP_CONFIG } from "../../config";

interface AppContextType {
  // User management
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Data
  technicians: Technician[];
  tickets: Ticket[];
  isSyncing: boolean;

  // Webhook status
  webhookStatus: WebhookStatus;
  checkWebhookHealth: () => Promise<void>;

  // Sync functions
  fetchLatestData: () => Promise<void>;

  // Ticket management
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => Promise<void>;
  updateTicket: (ticket: Ticket) => Promise<void>;
  reopenTicket: (ticketId: string, technicianId: string, notes: string) => Promise<void>;

  // Technician management
  addTechnician: (technician: Omit<Technician, 'id'>) => Promise<void>;
  deleteTechnician: (technicianId: string) => Promise<void>;
  updateTechnician: (technician: Technician) => Promise<void>;

  // Reports
  sendReceipt: (ticket: Ticket) => Promise<void>;
  resetAllTechnicianPoints: () => Promise<void>;

  // Additional functions
  lastSyncTime: Date | null;
  markAttendance: (action: string) => Promise<void>;

  // Feedback (placeholder)
  feedback: any[];
  addFeedback: (feedback: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>(TECHNICIANS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(WebhookStatus.Unknown);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const checkWebhookHealth = useCallback(async () => {
    try {
      setWebhookStatus(WebhookStatus.Checking);
      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'HEALTH_CHECK' })
      });

      if (response.ok) {
        setWebhookStatus(WebhookStatus.Connected);
      } else {
        setWebhookStatus(WebhookStatus.Error);
      }
    } catch (error) {
      setWebhookStatus(WebhookStatus.Error);
    }
  }, []);

  const fetchLatestData = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FETCH_LATEST_DATA',
          role: user?.role || 'Admin',
          technicianId: user?.id || 'admin01'
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Normalize response - handle both array and object responses
        const normalizedData = Array.isArray(data) ? data[0] || {} : data;

        // Parse tickets from response
        if (normalizedData.tickets && Array.isArray(normalizedData.tickets)) {
          const parsedTickets = normalizedData.tickets.map((t: any) => ({
            ...t,
            createdAt: t['Created At'] ? new Date(t['Created At']) : t.createdAt ? new Date(t.createdAt) : undefined,
            serviceBookingDate: t['Service Booking Date'] ? new Date(t['Service Booking Date']) : t.serviceBookingDate ? new Date(t.serviceBookingDate) : undefined,
            completedAt: t['Completed At'] ? new Date(t['Completed At']) : t.completedAt ? new Date(t.completedAt) : undefined,
          }));
          setTickets(parsedTickets);
        }

        // Parse technicians from response
        if (normalizedData.technicians && Array.isArray(normalizedData.technicians)) {
          const parsedTechnicians = normalizedData.technicians.map((t: any) => ({
            id: t['TechnicianId'] || t.id,
            name: t['Technician Name'] || t.name,
            password: t['Pin'] || t.password,
            points: parseInt(t['Points'] || t.points || 0),
            lastSeen: t['Last Seen'] ? new Date(t['Last Seen']) : t.lastSeen ? new Date(t.lastSeen) : undefined,
            status: t['Status'] || t.status || 'Active',
            createdAt: t['Created At'] ? new Date(t['Created At']) : t.createdAt ? new Date(t.createdAt) : undefined,
            deletedAt: t['Deleted At'] ? new Date(t['Deleted At']) : t.deletedAt ? new Date(t.deletedAt) : undefined,
          })).filter(t => t.status !== 'Deleted' || !t.deletedAt); // Filter out hard deleted technicians
          setTechnicians(parsedTechnicians);
        }

        setLastSyncTime(new Date());
        setWebhookStatus(WebhookStatus.Connected);
      } else {
        console.warn('Fetch latest data failed, keeping local data');
        setWebhookStatus(WebhookStatus.Error);
      }
    } catch (error) {
      console.warn('Fetch latest data error, keeping local data:', error);
      setWebhookStatus(WebhookStatus.Error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, user]);

  const addTicket = useCallback(async (ticketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    const newTicket = {
      ...ticketData,
      id: `PG-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date()
    };

    // Optimistic update
    setTickets(prev => [...prev, newTicket]);

    try {
      // Build payload matching Complaint Sheet headers exactly
      const payload = {
        action: 'NEW_TICKET',
        'Ticket ID': newTicket.id,
        'Created At': newTicket.createdAt?.toISOString(),
        'Service Booking Date': newTicket.serviceBookingDate?.toISOString(),
        'Preferred Time': newTicket.preferredTime || '',
        'Customer Name': newTicket.customerName || '',
        'Phone': newTicket.phone || '',
        'Address': newTicket.address || '',
        'Service Category': newTicket.serviceCategory || '',
        'Complaint': newTicket.complaint || '',
        'Assigned Technician': newTicket.technicianId || '',
        'Status': newTicket.status || TicketStatus.New
      };

      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Fetch latest data after successful ticket creation
        await fetchLatestData();
        // WhatsApp: Send assignment notification to customer
        console.log(`📱 WhatsApp to ${newTicket.phone}: "Dear Customer, Your service request with Pandit Glen Service has been scheduled. Our certified technician will visit you at the requested time. Thank you for choosing us!"`);
      } else {
        // Revert on failure
        setTickets(prev => prev.filter(t => t.id !== newTicket.id));
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      // Revert on error
      setTickets(prev => prev.filter(t => t.id !== newTicket.id));
      throw error;
    }
  }, []);

  const updateTicket = useCallback(async (updatedTicket: Ticket) => {
    const wasCompleted = updatedTicket.status === TicketStatus.Completed;

    // Optimistic update
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

    try {
      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: updatedTicket.status === TicketStatus.Completed ? 'JOB_COMPLETED' : 'UPDATE_TICKET',
          ticket: updatedTicket
        })
      });

      if (response.ok && wasCompleted) {
        // Fetch latest data after successful job completion
        await fetchLatestData();
        // WhatsApp: Send completion thank you message
        console.log(`📱 WhatsApp to ${updatedTicket.phone}: "Thank you for choosing Pandit Glen Service. We hope our service met your expectations. Please don't hesitate to contact us for any future needs."`);
      } else if (!response.ok) {
        // Revert on failure - would need to refetch or store previous state
        console.warn('Failed to update ticket on server');
      }
    } catch (error) {
      console.warn('Error updating ticket:', error);
    }
  }, []);

  const reopenTicket = useCallback(async (ticketId: string, technicianId: string, notes: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const escalatedTicket = {
      ...ticket,
      technicianId,
      status: TicketStatus.New,
      adminNotes: notes,
      isEscalated: true
    };

    await updateTicket(escalatedTicket);
  }, [tickets, updateTicket]);

  const addTechnician = useCallback(async (technicianData: Omit<Technician, 'id'>) => {
    const newTechnician = {
      ...technicianData,
      id: `tech-${Date.now()}`
    };

    setTechnicians(prev => [...prev, newTechnician]);

    try {
      await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_TECHNICIAN',
          technician: newTechnician
        })
      });
      // Fetch latest data after adding to ensure all clients get updated data
      await fetchLatestData();
    } catch (error) {
      console.warn('Failed to add technician on server');
    }
  }, [fetchLatestData]);

  const deleteTechnician = useCallback(async (technicianId: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== technicianId));

    try {
      await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_TECHNICIAN',
          technicianId
        })
      });
      // Fetch latest data after deleting to ensure all clients get updated data
      await fetchLatestData();
    } catch (error) {
      console.warn('Failed to delete technician on server');
    }
  }, [fetchLatestData]);

  const updateTechnician = useCallback(async (technician: Technician) => {
    setTechnicians(prev => prev.map(t => t.id === technician.id ? technician : t));
    // Fetch latest data after updating to ensure all clients get updated data
    await fetchLatestData();
  }, [fetchLatestData]);

  const sendReceipt = useCallback(async (ticket: Ticket) => {
    // Placeholder - would send receipt via WhatsApp or email
    console.log('Sending receipt for ticket:', ticket.id);
  }, []);

  const resetAllTechnicianPoints = useCallback(async () => {
    setTechnicians(prev => prev.map(t => ({ ...t, points: 0 })));
    // Could add server sync if needed
  }, []);

  const markAttendance = useCallback(async (action: string) => {
    // Send attendance to server
    try {
      await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ATTENDANCE',
          technicianId: user?.id,
          technicianName: user?.name,
          status: action,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to mark attendance:', error);
    }
  }, [user]);

  const addFeedback = useCallback((feedbackData: any) => {
    setFeedback(prev => [...prev, feedbackData]);
  }, []);

  const contextValue: AppContextType = {
    user,
    setUser,
    logout,
    technicians,
    tickets,
    isSyncing,
    webhookStatus,
    checkWebhookHealth,
    fetchLatestData,
    addTicket,
    updateTicket,
    reopenTicket,
    addTechnician,
    deleteTechnician,
    updateTechnician,
    sendReceipt,
    resetAllTechnicianPoints,
    lastSyncTime,
    markAttendance,
    feedback,
    addFeedback
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return ctx;
};
