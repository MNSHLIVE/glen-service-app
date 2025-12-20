
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole, WebhookStatus, UrgentAlertType } from '../types';
import { TECHNICIANS, INITIAL_TICKETS } from '../constants';
import { useToast } from './ToastContext';
import { APP_CONFIG, APP_VERSION } from '../config';

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
  reopenTicket: (ticketId: string, newTechId: string, notes: string) => void;
  uploadDamagedPart: (ticketId: string, imageData: string) => void;
  addFeedback: (feedbackItem: Feedback) => void;
  addTechnician: (tech: Omit<Technician, 'id' | 'points'>) => Promise<boolean>;
  updateTechnician: (updatedTech: Technician) => void;
  deleteTechnician: (techId: string) => void;
  resetTechniciansToDefaults: () => void;
  sendReceipt: (ticketId: string) => void;
  markAttendance: (status: 'Clock In' | 'Clock Out') => void;
  sendUrgentAlert: (type: UrgentAlertType, comments: string) => void;
  resetAllTechnicianPoints: () => void;
  syncTickets: (isBackground?: boolean) => Promise<void>;
  checkWebhookHealth: (urlOverride?: string) => Promise<void>;
  sendCustomWebhookPayload: (action: string, payload: Record<string, any>, urlOverride?: string) => void;
  refreshData: () => void;
  sendHeartbeat: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  
  // PRIMARY SYNC ENGINE - Matches the "SYNC" node in n8n
  const syncTickets = async (isBackground: boolean = false) => {
    if (!user) return;
    if (!isBackground) setIsSyncing(true);
    
    const payload = { 
        action: 'SYNC_ALL_DATA', // Match user's new n8n node name
        role: user.role, 
        technicianId: user.id,
        syncOrigin: 'PANDIT_GLEN_APP_SYNC'
    };
    
    try {
      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.tickets && Array.isArray(data.tickets)) {
            const parsed = data.tickets.map((t: any) => ({
                ...t,
                createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
                serviceBookingDate: t.serviceBookingDate ? new Date(t.serviceBookingDate) : undefined,
                completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            }));
            setTickets(parsed);
            localStorage.setItem('tickets', JSON.stringify(parsed));
        }

        if (data.technicians && Array.isArray(data.technicians)) {
             const serverTechs = data.technicians.map((st: any) => {
                 const idStr = String(st.id);
                 const existing = technicians.find(p => String(p.id) === idStr);
                 return { ...st, lastSeen: existing ? existing.lastSeen : undefined };
             });
             setTechnicians(serverTechs);
             localStorage.setItem('technicians', JSON.stringify(serverTechs));
        }

        setLastSyncTime(new Date());
        setWebhookStatus(WebhookStatus.Connected);
      }
    } catch (e) {
        console.error('Cloud Sync Failed:', e);
        setWebhookStatus(WebhookStatus.Error);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
        const interval = setInterval(() => {
            syncTickets(true);
        }, 30000); 
        return () => clearInterval(interval);
    }
  }, [user]);

  const sendHeartbeat = useCallback(() => {
      if (!user || user.role !== UserRole.Technician) return;
      const payload = {
          action: 'HEARTBEAT',
          technicianId: user.id,
          technicianName: user.name,
          version: APP_VERSION,
          timestamp: new Date().toISOString()
      };
      
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
      }).then(r => {
          if(r.ok) setWebhookStatus(WebhookStatus.Connected);
          else setWebhookStatus(WebhookStatus.Error);
      }).catch(() => setWebhookStatus(WebhookStatus.Error)); 
  }, [user]);

  const checkWebhookHealth = useCallback(async () => {
    setWebhookStatus(WebhookStatus.Checking);
    try {
        const payload = { action: 'HEALTH_CHECK' };
        const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) setWebhookStatus(WebhookStatus.Connected);
        else setWebhookStatus(WebhookStatus.Error);
    } catch {
        setWebhookStatus(WebhookStatus.Error);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            let currentUser = null;
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                setUser(currentUser);
            }

            const savedTechs = localStorage.getItem('technicians');
            if (savedTechs) {
                setTechnicians(JSON.parse(savedTechs).map((t: any) => ({
                    ...t, lastSeen: t.lastSeen ? new Date(t.lastSeen) : undefined
                })));
            } else {
                setTechnicians(TECHNICIANS);
            }

            const savedTickets = localStorage.getItem('tickets');
            if (savedTickets) {
                setTickets(JSON.parse(savedTickets, (key, value) => {
                    if (['createdAt', 'serviceBookingDate', 'completedAt', 'purchaseDate'].includes(key)) return value ? new Date(value) : undefined;
                    return value;
                }));
            } else {
                setTickets(INITIAL_TICKETS);
            }

            if (currentUser) {
                await syncTickets(false);
            }
        } catch (error) {
            console.error('App init fail:', error);
        } finally {
            setIsAppLoading(false);
            checkWebhookHealth();
        }
    };

    initApp();
  }, [checkWebhookHealth]);

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
  
  const updateTechnician = (tech: Technician) => {
      const payload = { action: 'UPDATE_TECHNICIAN', technician: tech };
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(res => {
          if(res.ok) {
              addToast('Staff details updated on server', 'success');
              syncTickets(true);
          }
      });
  };

  const deleteTechnician = async (id: string) => {
      const idStr = String(id);
      const payload = { action: 'DELETE_TECHNICIAN', technicianId: idStr };

      try {
          const res = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              addToast(`Technician removed successfully`, 'success');
              await syncTickets(false);
          }
      } catch (err) {
          addToast("Server connection error.", 'error');
      }
  };

  const addTechnician = async (tech: any): Promise<boolean> => {
    if (technicians.some(t => t.password === tech.password)) {
        addToast(`Error: PIN ${tech.password} is already used.`, 'error');
        return false;
    }
    
    const newTech = { ...tech, id: `tech${Date.now()}`, points: 0 };
    const payload = { action: 'ADD_TECHNICIAN', technician: newTech };

    try {
        const res = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            addToast(`${tech.name} added to server!`, 'success');
            await syncTickets(false);
            return true;
        } else {
            addToast("Server failed to save new technician.", 'error');
            return false;
        }
    } catch (err) {
        addToast("Network Error: Could not reach server.", 'error');
        return false;
    }
  };

  const addTicket = (ticketData: any) => {
      const newTicket: Ticket = {
          ...ticketData,
          id: `PG-${Math.floor(1000 + Math.random() * 9000)}`,
          status: TicketStatus.New,
          createdAt: new Date(),
          serviceBookingDate: new Date(),
      };
      // LOGIC CHECK: This sends the NEW_TICKET action clearly
      const payload = { action: 'NEW_TICKET', ticket: newTicket };
      console.log('--- SUBMITTING NEW TICKET ---');
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => {
          addToast('Ticket created on server', 'success');
          syncTickets(true); // Background refresh
      });
  };

  const updateTicket = (updatedTicket: Ticket) => {
      const actionName = updatedTicket.status === TicketStatus.Completed ? 'JOB_COMPLETED' : 'UPDATE_TICKET';
      const payload = { action: actionName, ticket: updatedTicket };
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => {
          addToast('Job status updated', 'success');
          syncTickets(true);
      });
  };

  const reopenTicket = (ticketId: string, newTechId: string, notes: string) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const updatedTicket: Ticket = {
          ...ticket,
          status: TicketStatus.New,
          technicianId: newTechId,
          adminNotes: `RE-OPENED: ${notes}${ticket.adminNotes ? ' | ' + ticket.adminNotes : ''}`,
          isEscalated: true,
          completedAt: undefined,
          workDone: undefined,
          amountCollected: undefined
      };

      const payload = { action: 'REOPEN_TICKET', ticket: updatedTicket };
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => {
          addToast('Escalation sent to server', 'success');
          syncTickets(true);
      });
  };

  const markAttendance = (status: 'Clock In' | 'Clock Out') => {
      if (!user) return;
      const payload = { 
          action: 'ATTENDANCE', 
          technicianId: user.id,
          technicianName: user.name,
          status,
          timestamp: new Date().toISOString()
      };
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => syncTickets(true));
  };

  const sendUrgentAlert = (type: UrgentAlertType, comments: string) => {
      if (!user) return;
      const payload = { 
          action: 'URGENT_ALERT',
          technicianId: user.id, 
          technicianName: user.name,
          alertType: type,
          comments,
          timestamp: new Date().toISOString()
      };
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  };

  const resetAllTechnicianPoints = () => {
       addToast("Points reset feature must be configured in n8n.", 'error');
  }

  const sendReceipt = (ticketId: string) => {
     console.log(`Sending receipt for ${ticketId}`);
  };

  const refreshData = () => window.location.reload();

  return (
    <AppContext.Provider value={{ 
        user, tickets, technicians, feedback, isSyncing, login, logout, addTicket, updateTicket, reopenTicket, uploadDamagedPart: () => {}, addFeedback: () => {}, addTechnician, updateTechnician, deleteTechnician, resetTechniciansToDefaults: () => {}, sendReceipt, markAttendance, sendUrgentAlert, resetAllTechnicianPoints, syncTickets, webhookStatus, checkWebhookHealth, sendCustomWebhookPayload: (action, payload) => {}, lastSyncTime, isAppLoading, refreshData, sendHeartbeat 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext missing');
  return context;
};
