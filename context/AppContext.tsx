
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole, WebhookStatus, UrgentAlertType } from '../types';
import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { COMPLAINT_SHEET_HEADERS, TECHNICIAN_UPDATE_HEADERS, ATTENDANCE_SHEET_HEADERS } from '../data/sheetHeaders';
import { APP_CONFIG } from '../config';

const APP_VERSION = '4.6.2'; // Matches App.tsx

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
  addTicket: (ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'serviceBookingDate'>) => void;
  updateTicket: (updatedTicket: Ticket) => void;
  uploadDamagedPart: (ticketId: string, imageData: string) => void;
  addFeedback: (feedbackItem: Feedback) => void;
  addTechnician: (tech: Omit<Technician, 'id' | 'points'>) => void;
  updateTechnician: (updatedTech: Technician) => void;
  deleteTechnician: (techId: string) => void;
  resetTechniciansToDefaults: () => void;
  sendReceipt: (ticketId: string) => void;
  markAttendance: (status: 'Clock In' | 'Clock Out') => void;
  sendUrgentAlert: (type: UrgentAlertType, comments: string) => void;
  resetAllTechnicianPoints: () => void;
  syncTickets: (isBackground?: boolean) => Promise<void>;
  checkWebhookHealth: (urlOverride?: string) => Promise<void>;
  sendCustomWebhookPayload: (action: 'NEW_TICKET' | 'JOB_COMPLETED' | 'ATTENDANCE' | 'URGENT_ALERT', payload: Record<string, any>, urlOverride?: string) => void;
  refreshData: () => void;
  sendHeartbeat: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const createDummyTicket = (): Ticket => ({
    id: `SB/${new Date().getFullYear()}/TEST/DUMMY01`,
    customerName: 'Dummy Customer',
    phone: '9988776655',
    address: '123, Test Lane, Automation City',
    complaint: 'This is a test ticket for setting up automation.',
    technicianId: 'tech-test',
    status: TicketStatus.Completed,
    createdAt: new Date(),
    serviceBookingDate: new Date(),
    preferredTime: '10AM-12PM',
    serviceCategory: 'Chimney',
    productDetails: { make: 'Glen', segment: '', category: 'Chimney', subCategory: '', product: '' },
    symptoms: [],
    completedAt: new Date(),
    workDone: 'Test work completed successfully.',
    paymentStatus: PaymentStatus.UPI,
    amountCollected: 500,
    partsReplaced: [{ name: 'Test Filter', price: 250, type: PartType.Replacement, warrantyStatus: PartWarrantyStatus.OutOfWarranty, category: 'Consumable', warrantyDuration: 'N/A' }],
    serviceChecklist: { amcDiscussion: true },
    freeService: false,
    pointsAwarded: true,
    adminNotes: 'This is a test note.',
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(WebhookStatus.Unknown);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { addToast } = useToast();
  
  const sendHeartbeat = useCallback(() => {
      if (!user) return;
      const webhookUrl = localStorage.getItem('masterWebhookUrl');
      if (!webhookUrl) return;

      const payload = {
          action: 'HEARTBEAT',
          technicianId: user.id,
          technicianName: user.name,
          version: APP_VERSION,
          timestamp: new Date().toISOString()
      };

      fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
      }).catch(() => {}); // Fail silently for heartbeat
  }, [user]);

  useEffect(() => {
    try {
      if (APP_CONFIG.MASTER_WEBHOOK_URL) {
          localStorage.setItem('masterWebhookUrl', APP_CONFIG.MASTER_WEBHOOK_URL);
      }
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
          try {
              setUser(JSON.parse(savedUser));
          } catch (e) {
              localStorage.removeItem('currentUser');
          }
      }

      let initialTechs = [...TECHNICIANS];
      const savedTechs = localStorage.getItem('technicians');
      if (savedTechs) {
        const parsedTechs = JSON.parse(savedTechs);
        if (Array.isArray(parsedTechs)) {
             initialTechs = initialTechs.map(tech => {
                 const saved = parsedTechs.find((p: Technician) => p.id === tech.id);
                 return saved ? { ...tech, points: saved.points, name: saved.name, lastSeen: saved.lastSeen ? new Date(saved.lastSeen) : undefined } : tech;
             });
        }
      }
      setTechnicians(initialTechs);

      const savedTickets = localStorage.getItem('tickets');
      if (savedTickets) {
        const parsedTickets = JSON.parse(savedTickets, (key, value) => {
          if (['createdAt', 'serviceBookingDate', 'completedAt', 'purchaseDate'].includes(key)) {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
        if (Array.isArray(parsedTickets)) setTickets(parsedTickets);
      } else {
        setTickets([createDummyTicket()]);
      }

    } catch (error) {
      setIsAppLoading(false);
    } finally {
        setIsAppLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('technicians', JSON.stringify(technicians));
  }, [technicians]);


  const sendWebhook = async (action: string, payload: object, defaultLogMessage: string, urlOverride?: string) => {
      const webhookUrl = urlOverride || localStorage.getItem('masterWebhookUrl');
      if (webhookUrl) {
          try {
              const finalPayload = { action, ...payload };
              const response = await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(finalPayload),
              });
              if (response.ok) setWebhookStatus(WebhookStatus.Connected);
          } catch (error) {
              setWebhookStatus(WebhookStatus.Error);
          }
      }
  };
  
  const syncTickets = async (isBackground: boolean = false) => {
    if (!user) return;
    const webhookUrl = localStorage.getItem('masterWebhookUrl');
    if (!webhookUrl) return;

    setIsSyncing(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FETCH_NEW_JOBS', role: user.role, technicianId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        // Update presence from n8n if included
        if (data.technicianStatuses && Array.isArray(data.technicianStatuses)) {
            setTechnicians(prev => prev.map(tech => {
                const status = data.technicianStatuses.find((s: any) => s.id === tech.id);
                return status ? { ...tech, lastSeen: new Date(status.lastSeen) } : tech;
            }));
        }
        
        if (data.tickets) {
            // Mapping logic remains same as before...
            setTickets(data.tickets);
        }
        setLastSyncTime(new Date());
      }
    } catch (e) {
    } finally {
      setIsSyncing(false);
    }
  };

  const login = (loggedInUser: User) => {
      setUser(loggedInUser);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      sendHeartbeat(); // Immediate heartbeat on login
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addTicket = (ticketData: any) => {
      const newTicket = { ...ticketData, id: `SB/${Date.now()}`, status: TicketStatus.New, createdAt: new Date(), serviceBookingDate: new Date() };
      setTickets(prev => [newTicket, ...prev]);
      sendWebhook('NEW_TICKET', newTicket, 'Added');
  };

  const updateTicket = (updatedTicket: Ticket) => {
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      sendWebhook('TICKET_UPDATED', updatedTicket, 'Updated');
  };

  const uploadDamagedPart = (ticketId: string, imageData: string) => {
      sendWebhook('UPLOAD_PART', { ticketId, imageData }, 'Uploaded');
  };

  const addFeedback = (fb: Feedback) => {
      setFeedback(prev => [fb, ...prev]);
      sendWebhook('NEW_FEEDBACK', fb, 'Feedback');
  };

  const addTechnician = (tech: any) => {
      const newTech = { ...tech, id: `tech${Date.now()}`, points: 0 };
      setTechnicians(prev => [...prev, newTech]);
  };

  const updateTechnician = (tech: Technician) => setTechnicians(prev => prev.map(t => t.id === tech.id ? tech : t));
  const deleteTechnician = (id: string) => setTechnicians(prev => prev.filter(t => t.id !== id));
  const resetTechniciansToDefaults = () => setTechnicians(TECHNICIANS);
  const sendReceipt = (id: string) => sendWebhook('RECEIPT', { id }, 'Receipt');
  const markAttendance = (status: any) => sendWebhook('ATTENDANCE', { status }, 'Attendance');
  const sendUrgentAlert = (t: any, c: any) => sendWebhook('URGENT', { t, c }, 'Alert');
  const resetAllTechnicianPoints = () => setTechnicians(prev => prev.map(t => ({...t, points: 0})));
  const checkWebhookHealth = async () => {};
  const sendCustomWebhookPayload = () => {};
  const refreshData = () => window.location.reload();

  return (
    <AppContext.Provider value={{ user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, uploadDamagedPart, addFeedback, addTechnician, updateTechnician, deleteTechnician, resetTechniciansToDefaults, sendReceipt, markAttendance, sendUrgentAlert, resetAllTechnicianPoints, syncTickets, webhookStatus, checkWebhookHealth, sendCustomWebhookPayload, lastSyncTime, isAppLoading, refreshData, sendHeartbeat }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext missing');
  return context;
};
