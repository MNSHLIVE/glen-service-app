
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
  sendCustomWebhookPayload: (action: 'NEW_TICKET' | 'JOB_COMPLETED' | 'ATTENDANCE' | 'URGENT_ALERT', payload: Record<string, any>, urlOverride?: string) => void;
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
  
  // Track optimistic updates that haven't been confirmed by server yet to prevent sync flickering
  const pendingActions = useRef<{ added: Set<string>, deleted: Set<string> }>({ 
      added: new Set(), 
      deleted: new Set() 
  });

  const { addToast } = useToast();
  
  const sendHeartbeat = useCallback(() => {
      if (!user || user.role !== UserRole.Technician) return;
      const webhookUrl = APP_CONFIG.MASTER_WEBHOOK_URL;
      
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
      }).then(r => {
          if(r.ok) setWebhookStatus(WebhookStatus.Connected);
          else setWebhookStatus(WebhookStatus.Error);
      }).catch(() => setWebhookStatus(WebhookStatus.Error)); 
  }, [user]);

  const checkWebhookHealth = useCallback(async () => {
    setWebhookStatus(WebhookStatus.Checking);
    try {
        const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'HEALTH_CHECK' })
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
      
      // SEND TO WEBHOOK
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ action: 'NEW_TICKET', ticket: newTicket })
      });
  };

  const updateTicket = (updatedTicket: Ticket) => {
      setTickets(prev => {
          const updated = prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
          localStorage.setItem('tickets', JSON.stringify(updated));
          return updated;
      });
      addToast('Job updated successfully.', 'success');

      // SEND TO WEBHOOK
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ action: 'UPDATE_TICKET', ticket: updatedTicket })
      });
  };

  const syncTickets = async (isBackground: boolean = false) => {
    if (!user) return;
    if (!isBackground) setIsSyncing(true);
    try {
      const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FETCH_NEW_JOBS', role: user.role, technicianId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 1. Update Tickets
        if (data.tickets && data.tickets.length > 0) {
            setTickets(data.tickets);
            localStorage.setItem('tickets', JSON.stringify(data.tickets));
        }

        // 2. Update Technicians List (Cloud Sync with Race Condition Protection)
        if (data.technicians && Array.isArray(data.technicians)) {
             setTechnicians(prev => {
                 let serverTechs = data.technicians;

                 // A. Remove any techs that are marked for deletion locally
                 // CRITICAL: Convert IDs to string to avoid type mismatches (Sheet "123" vs App 123)
                 serverTechs = serverTechs.filter((st: any) => !pendingActions.current.deleted.has(String(st.id)));

                 // B. Add any techs that were added locally but are missing from server
                 const pendingAdds = prev.filter(p => pendingActions.current.added.has(String(p.id)));
                 
                 // Merge: Server techs + Pending local techs
                 const combined = [...serverTechs];
                 pendingAdds.forEach(pa => {
                     // Use strict string comparison to avoid duplicates
                     if (!combined.find(m => String(m.id) === String(pa.id))) {
                         combined.push(pa);
                     }
                 });

                 // C. Preserve Last Seen (local state)
                 const updated = combined.map((st: any) => {
                     const existing = prev.find(p => String(p.id) === String(st.id));
                     return {
                         ...st,
                         lastSeen: existing ? existing.lastSeen : undefined
                     };
                 });
                 
                 // Clean up verified adds from pending list
                 // If the server now has the ID, we don't need to track it as pending anymore
                 data.technicians.forEach((t: any) => pendingActions.current.added.delete(String(t.id)));

                 localStorage.setItem('technicians', JSON.stringify(updated));
                 return updated;
             });
        }

        // 3. Update Presence
        if (data.technicianStatuses && Array.isArray(data.technicianStatuses)) {
            setTechnicians(prev => prev.map(tech => {
                const status = data.technicianStatuses.find((s: any) => String(s.id) === String(tech.id));
                return status ? { ...tech, lastSeen: new Date(status.lastSeen) } : tech;
            }));
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

  const login = (u: User) => { setUser(u); localStorage.setItem('currentUser', JSON.stringify(u)); sendHeartbeat(); };
  const logout = () => { setUser(null); localStorage.removeItem('currentUser'); };
  
  const updateTechnician = (tech: Technician) => {
      setTechnicians(prev => {
          const updated = prev.map(t => t.id === tech.id ? tech : t);
          localStorage.setItem('technicians', JSON.stringify(updated));
          return updated;
      });
  };

  const deleteTechnician = (id: string) => {
      const idStr = String(id);
      
      // 1. Mark as pending delete to prevent Sync from re-adding it immediately
      pendingActions.current.deleted.add(idStr);
      setTimeout(() => pendingActions.current.deleted.delete(idStr), 120000); // Clear after 2 mins

      // 2. Remove Locally (Immediate Feedback)
      setTechnicians(prev => {
          const updated = prev.filter(t => String(t.id) !== idStr);
          localStorage.setItem('technicians', JSON.stringify(updated));
          return updated;
      });

      // 3. Remove from Server (Cloud)
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ action: 'REMOVE_TECHNICIAN', technicianId: idStr })
      })
      .then(res => {
          if(!res.ok) throw new Error('Server returned ' + res.status);
      })
      .catch(err => {
          console.error("Failed to delete tech from server", err);
          // Don't revert local state to keep UI snappy, but warn user
          addToast("Network issue: Server deletion might have failed.", 'error');
      });

      if (user && user.id === idStr) {
          logout();
      } else {
          addToast(`Technician removed. Syncing...`, 'success');
      }
  };

  const addTechnician = (tech: any): boolean => {
    // 1. Check duplicate PIN locally
    if (technicians.some(t => t.password === tech.password)) {
        addToast(`Error: PIN ${tech.password} is already used.`, 'error');
        return false;
    }

    const newId = `tech${Date.now()}`; // Simpler ID for reliability
    const newTech = { ...tech, id: newId, points: 0 };
    
    // 2. Mark as pending add to prevent Sync from removing it before server updates
    pendingActions.current.added.add(newId);
    setTimeout(() => pendingActions.current.added.delete(newId), 120000); // Clear after 2 mins
    
    // 3. Save Locally (Immediate Feedback)
    setTechnicians(prev => {
        const updated = [...prev, newTech];
        localStorage.setItem('technicians', JSON.stringify(updated));
        return updated;
    });

    // 4. Save to Server (Cloud Sync)
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'ADD_TECHNICIAN', technician: newTech })
    }).catch(err => console.error("Failed to sync new tech to server", err));

    addToast(`${tech.name} Saved! Data sent to Google Sheet.`, 'success');
    return true;
  };

  const refreshData = () => window.location.reload();

  return (
    <AppContext.Provider value={{ 
        user, 
        tickets, 
        technicians, 
        feedback, 
        isSyncing,
        login, 
        logout, 
        addTicket, 
        updateTicket, 
        uploadDamagedPart: () => {}, 
        addFeedback: () => {}, 
        addTechnician, 
        updateTechnician, 
        deleteTechnician, 
        resetTechniciansToDefaults: () => {}, 
        sendReceipt: () => {}, 
        markAttendance: () => {}, 
        sendUrgentAlert: () => {}, 
        resetAllTechnicianPoints: () => {}, 
        syncTickets, 
        webhookStatus, 
        checkWebhookHealth, 
        sendCustomWebhookPayload: () => {}, 
        lastSyncTime, 
        isAppLoading, 
        refreshData, 
        sendHeartbeat 
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
