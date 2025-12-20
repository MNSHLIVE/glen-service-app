
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
  
  const syncTickets = async (isBackground: boolean = false) => {
    if (!user) return;
    if (!isBackground) setIsSyncing(true);
    
    const payload = { 
        action: 'SYNC_ALL_DATA',
        role: user.role, 
        technicianId: user.id,
        syncOrigin: 'GLOBAL_HANDSHAKE'
    };
    
    try {
      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 1. OVERWRITE TICKETS (No merging, just latest from server)
        if (data.tickets && Array.isArray(data.tickets)) {
            const parsed = data.tickets.map((t: any) => ({
                ...t,
                createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
                serviceBookingDate: t.serviceBookingDate ? new Date(t.serviceBookingDate) : undefined,
                completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            })).sort((a, b) => {
                // SORT: Newest at the top
                const dateA = a.createdAt?.getTime() || 0;
                const dateB = b.createdAt?.getTime() || 0;
                return dateB - dateA;
            });

            setTickets(parsed);
            localStorage.setItem('tickets', JSON.stringify(parsed));
        }

        // 2. OVERWRITE STAFF (Ensure deletions reflect on all devices)
        if (data.technicians && Array.isArray(data.technicians)) {
             const serverTechs = data.technicians.map((st: any) => ({
                 ...st,
                 // Preserve local "points" if server doesn't provide them, but usually server is boss
                 points: st.points !== undefined ? st.points : 0
             }));
             setTechnicians(serverTechs);
             localStorage.setItem('technicians', JSON.stringify(serverTechs));
        }

        setLastSyncTime(new Date());
        setWebhookStatus(WebhookStatus.Connected);
      }
    } catch (e) {
        console.error('Handshake Failed:', e);
        setWebhookStatus(WebhookStatus.Error);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  // Sync every 30 seconds to keep all devices on the same page
  useEffect(() => {
    if (user) {
        const interval = setInterval(() => {
            syncTickets(true);
        }, 30000); 
        return () => clearInterval(interval);
    }
  }, [user]);

  const sendHeartbeat = useCallback(() => {
      if (!user) return;
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

            // Start with local cache for speed
            const savedTechs = localStorage.getItem('technicians');
            if (savedTechs) setTechnicians(JSON.parse(savedTechs));
            else setTechnicians(TECHNICIANS);

            const savedTickets = localStorage.getItem('tickets');
            if (savedTickets) {
                setTickets(JSON.parse(savedTickets, (key, value) => {
                    if (['createdAt', 'serviceBookingDate', 'completedAt'].includes(key)) return value ? new Date(value) : undefined;
                    return value;
                }));
            } else {
                setTickets(INITIAL_TICKETS);
            }

            // Immediately force a cloud update if logged in
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
              addToast('Staff details updated', 'success');
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
              addToast(`Removed from server`, 'success');
              await syncTickets(false); // Force full re-sync to remove from UI
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
            addToast(`${tech.name} added to cloud!`, 'success');
            await syncTickets(false);
            return true;
        } else {
            addToast("Server failed to save.", 'error');
            return false;
        }
    } catch (err) {
        addToast("Network Error.", 'error');
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
      const payload = { action: 'NEW_TICKET', ticket: newTicket };
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => {
          addToast('Ticket sent to cloud', 'success');
          syncTickets(true); 
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
          addToast('Updated successfully', 'success');
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
          addToast('Escalation saved', 'success');
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
       addToast("Cloud reset required via n8n.", 'error');
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
