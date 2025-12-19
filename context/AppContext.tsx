
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
  addTechnician: (tech: Omit<Technician, 'id' | 'points'>) => boolean;
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
  
  const pendingActions = useRef<{ added: Set<string>, deleted: Set<string>, updated: Set<string> }>({ 
      added: new Set(), 
      deleted: new Set(),
      updated: new Set()
  });

  const { addToast } = useToast();
  
  const syncTickets = async (isBackground: boolean = false) => {
    if (!user) return;
    if (!isBackground) setIsSyncing(true);
    
    const payload = { action: 'FETCH_NEW_JOBS', role: user.role, technicianId: user.id };
    if (!isBackground) console.log('Sending Webhook:', payload.action, payload);

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
             setTechnicians(prev => {
                 let serverTechs = data.technicians;
                 serverTechs = serverTechs.filter((st: any) => !pendingActions.current.deleted.has(String(st.id)));
                 const pendingAdds = prev.filter(p => pendingActions.current.added.has(String(p.id)));
                 
                 const combined = [...serverTechs];
                 pendingAdds.forEach(pa => {
                     if (!combined.find(m => String(m.id) === String(pa.id))) {
                         combined.push(pa);
                     }
                 });

                 const updated = combined.map((st: any) => {
                     const idStr = String(st.id);
                     const existing = prev.find(p => String(p.id) === idStr);
                     if (pendingActions.current.updated.has(idStr) && existing) {
                         return { ...existing, lastSeen: existing.lastSeen };
                     }
                     return { ...st, lastSeen: existing ? existing.lastSeen : undefined };
                 });
                 
                 data.technicians.forEach((t: any) => pendingActions.current.added.delete(String(t.id)));
                 localStorage.setItem('technicians', JSON.stringify(updated));
                 return updated;
             });
        }

        setLastSyncTime(new Date());
        setWebhookStatus(WebhookStatus.Connected);
      }
    } catch (e) {
        setWebhookStatus(WebhookStatus.Error);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

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
        console.log('Sending Webhook:', payload.action, payload);
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
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) setUser(JSON.parse(savedUser));

      let initialTechs = [...TECHNICIANS];
      const savedTechs = localStorage.getItem('technicians');
      if (savedTechs) {
        const parsedTechs = JSON.parse(savedTechs);
        if (Array.isArray(parsedTechs)) {
             initialTechs = parsedTechs.map((t: any) => ({
                 ...t,
                 lastSeen: t.lastSeen ? new Date(t.lastSeen) : undefined
             }));
        }
      } else {
          localStorage.setItem('technicians', JSON.stringify(initialTechs));
      }
      setTechnicians(initialTechs);

      const savedTickets = localStorage.getItem('tickets');
      if (savedTickets) {
        const parsedTickets = JSON.parse(savedTickets, (key, value) => {
          if (['createdAt', 'serviceBookingDate', 'completedAt', 'purchaseDate'].includes(key)) return value ? new Date(value) : undefined;
          return value;
        });
        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
            setTickets(parsedTickets);
        } else {
            setTickets(INITIAL_TICKETS);
        }
      } else {
          setTickets(INITIAL_TICKETS);
      }
    } catch (error) {
        console.error('App init fail:', error);
    } finally {
        setIsAppLoading(false);
        checkWebhookHealth();
    }
  }, [checkWebhookHealth]);

  const addTicket = (ticketData: any) => {
      const newTicket: Ticket = {
          ...ticketData,
          id: `PG-${Math.floor(1000 + Math.random() * 9000)}`,
          status: TicketStatus.New,
          createdAt: new Date(),
          serviceBookingDate: new Date(),
      };
      setTickets(prev => {
          const updated = [newTicket, ...prev];
          localStorage.setItem('tickets', JSON.stringify(updated));
          return updated;
      });
      addToast('New service ticket generated!', 'success');
      const payload = { action: 'NEW_TICKET', ticket: newTicket };
      console.log('Sending Webhook:', payload.action, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => syncTickets(true));
  };

  const updateTicket = (updatedTicket: Ticket) => {
      setTickets(prev => {
          const updated = prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
          localStorage.setItem('tickets', JSON.stringify(updated));
          return updated;
      });
      addToast('Job updated successfully.', 'success');
      const actionName = updatedTicket.status === TicketStatus.Completed ? 'JOB_COMPLETED' : 'UPDATE_TICKET';
      const payload = { action: actionName, ticket: updatedTicket };
      console.log('Sending Webhook:', payload.action, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => syncTickets(true));
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

      setTickets(prev => {
          const updated = prev.map(t => t.id === ticketId ? updatedTicket : t);
          localStorage.setItem('tickets', JSON.stringify(updated));
          return updated;
      });

      addToast('Job re-opened and escalated!', 'success');
      const payload = { action: 'REOPEN_TICKET', ticket: updatedTicket };
      console.log('Sending Webhook:', payload.action, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => syncTickets(true));
  };

  const login = (u: User) => { setUser(u); localStorage.setItem('currentUser', JSON.stringify(u)); sendHeartbeat(); };
  const logout = () => { setUser(null); localStorage.removeItem('currentUser'); };
  
  const updateTechnician = (tech: Technician) => {
      const idStr = String(tech.id);
      pendingActions.current.updated.add(idStr);
      setTimeout(() => pendingActions.current.updated.delete(idStr), 120000);
      setTechnicians(prev => {
          const updated = prev.map(t => String(t.id) === idStr ? tech : t);
          localStorage.setItem('technicians', JSON.stringify(updated));
          return updated;
      });
      const payload = { action: 'UPDATE_TECHNICIAN', technician: tech };
      console.log('Sending Webhook:', payload.action, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(() => syncTickets(true))
      .catch(err => console.error("Update tech failed", err));
      addToast('Staff details updated successfully', 'success');
  };

  const deleteTechnician = (id: string) => {
      const idStr = String(id);
      console.log('Delete Action Triggered for ID:', idStr);
      pendingActions.current.deleted.add(idStr);
      setTimeout(() => pendingActions.current.deleted.delete(idStr), 120000);
      setTechnicians(prev => {
          const updated = prev.filter(t => String(t.id) !== idStr);
          localStorage.setItem('technicians', JSON.stringify(updated));
          return updated;
      });
      const payload = { action: 'DELETE_TECHNICIAN', technicianId: idStr, id: idStr };
      console.log('Sending Webhook:', payload.action, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      })
      .then(res => {
          if(!res.ok) throw new Error('Server returned ' + res.status);
          addToast(`Technician removed from server.`, 'success');
          syncTickets(true);
      })
      .catch(err => {
          console.error("Failed to delete tech from server", err);
          addToast("Network issue: Server deletion might have failed.", 'error');
      });
      if (user && String(user.id) === idStr) logout();
  };

  const addTechnician = (tech: any): boolean => {
    if (technicians.some(t => t.password === tech.password)) {
        addToast(`Error: PIN ${tech.password} is already used.`, 'error');
        return false;
    }
    const newId = `tech${Date.now()}`; 
    const newTech = { ...tech, id: newId, points: 0 };
    pendingActions.current.added.add(newId);
    setTimeout(() => pendingActions.current.added.delete(newId), 120000);
    setTechnicians(prev => {
        const updated = [...prev, newTech];
        localStorage.setItem('technicians', JSON.stringify(updated));
        return updated;
    });
    const payload = { action: 'ADD_TECHNICIAN', technician: newTech };
    console.log('Sending Webhook:', payload.action, payload);
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then(() => {
        addToast(`${tech.name} Saved to Server!`, 'success');
        syncTickets(true);
    }).catch(err => console.error("Failed to sync new tech to server", err));
    return true;
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
      console.log('Sending Webhook:', payload.action, payload);
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
      console.log('Sending Webhook:', payload.action, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  };

  const resetAllTechnicianPoints = () => {
       setTechnicians(prev => prev.map(t => ({ ...t, points: 0 })));
       addToast("Points reset locally. Please implement server-side logic.", 'success');
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
