
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole, WebhookStatus, UrgentAlertType } from '../types';
import { TECHNICIANS, INITIAL_TICKETS } from '../constants';
import { useToast } from './ToastContext';
import { APP_CONFIG, APP_VERSION } from '../config';
import { triggerDataSync, listenForDataSync, updateLastSyncTime } from '../utils/dataSync';



// Ticket visibility window (frontend only)
const ADMIN_DATA_DAYS = 5;
const TECHNICIAN_DATA_DAYS = 2;



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
  const [isInitializing, setIsInitializing] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(WebhookStatus.Unknown);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const pendingActions = useRef<{ added: Set<string>, deleted: Set<string>, updated: Set<string> }>({ 
      added: new Set(), 
      deleted: new Set(),
      updated: new Set()
  });

const loadTicketsFromServer = async () => {
  try {
    const res = await fetch("/api/n8n-proxy?action=read-complaint");
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn("Tickets payload not array", data);
      return;
    }

    const normalized: Ticket[] = data.map((t: any) => ({
      ...t,
      status:
        t.status === "Completed"
          ? TicketStatus.Completed
          : t.status === "InProgress"
          ? TicketStatus.InProgress
          : TicketStatus.New,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      serviceBookingDate: t.serviceBookingDate
        ? new Date(t.serviceBookingDate)
        : new Date()
    }));

    setTickets(normalized);
updateLastSyncTime(new Date());

  } catch (e) {
    console.error("Ticket read failed", e);
  }
};



  // Fetch technicians directly from server on app startup
  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/n8n-proxy?action=read-technician');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTechnicians(data);
          // Also save to localStorage for offline fallback
          localStorage.setItem('technicians', JSON.stringify(data));
          console.log('✅ Fetched technicians from server:', data.length);
        }
      } else {
        console.error('Failed to fetch technicians:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  };

  // Fetch tickets directly from server on app startup
  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/n8n-proxy?action=read-complaint');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTickets(data);
          // Also save to localStorage for offline fallback
          localStorage.setItem('tickets', JSON.stringify(data));
          console.log('✅ Fetched tickets from server:', data.length);
        }
      } else {
        console.error('Failed to fetch tickets:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const syncTickets = async (isBackground: boolean = false) => {
  if (!user) return;
  if (!isBackground) setIsSyncing(true);

  const payload = {
    function: 'FETCH_NEW_JOBS',
    role: user.role,
    technicianId: user.id,
    syncOrigin: 'Device_Cloud_Handshake'
  };

  try {
    const response = await fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setWebhookStatus(WebhookStatus.Error);
      return;
    }

    const data = await response.json();

    // ✅ TECHNICIANS ONLY
    if (Array.isArray(data?.technicians)) {
      setTechnicians(prev => {
        const serverTechs = data.technicians.filter(
          (t: any) => !pendingActions.current.deleted.has(String(t.id))
        );

        return serverTechs.map((t: any) => {
          const existing = prev.find(p => String(p.id) === String(t.id));
          return { ...t, lastSeen: existing?.lastSeen };
        });
      });
    }

    setLastSyncTime(new Date());
    setWebhookStatus(WebhookStatus.Connected);

  } catch (err) {
    console.error('❌ syncTickets failed:', err);
    setWebhookStatus(WebhookStatus.Error);
  } finally {
    if (!isBackground) setIsSyncing(false);
  }
};


  const sendHeartbeat = useCallback(() => {
      if (!user || user.role !== UserRole.Technician) return;
      const payload = {
          function: 'HEARTBEAT',
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
        const payload = { function: 'HEALTH_CHECK' };
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

  // INITIAL LOAD LOGIC
  useEffect(() => {
    const initApp = async () => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            let currentUser = null;
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                setUser(currentUser);
            }

            // Load local cache as placeholder until server responds
            const savedTechs = localStorage.getItem('technicians');
            if (savedTechs) {
                setTechnicians(JSON.parse(savedTechs).map((t: any) => ({
                    ...t, lastSeen: t.lastSeen ? new Date(t.lastSeen) : undefined
                })));
            } else {
                setTechnicians(TECHNICIANS);
            }

            // Fetch fresh technicians and tickets from server on app startup
            await fetchTechnicians();
            await loadTicketsFromServer();

        } catch (error) {
            console.error('App init fail:', error);
        } finally {
            setIsAppLoading(false);
            checkWebhookHealth();
        }
    };
        // Maximum timeout to ensure app doesn't hang indefinitely (10 seconds max)
    const maxTimeoutId = setTimeout(() => setIsAppLoading(false), 10000);
    return () => clearTimeout(maxTimeoutId);
                  

    initApp();
  }, [checkWebhookHealth]);

  // SYNC AFTER LOGIN
  useEffect(() => {
    if (!user) return;

    const init = async () => {
        await loadTicketsFromServer();

    };

    init();
  }, [user]);

  // AUTO-SYNC ON VISIBILITY CHANGE (When user re-opens the browser tab)
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && user) {
              console.log('App resumed, syncing cloud data...');
              loadTicketsFromServer();
;
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const login = (u: User) => { 
      setUser(u); 
      localStorage.setItem('currentUser', JSON.stringify(u)); 
      sendHeartbeat();
      // Force sync immediately upon login to overwrite local stale data
      syncTickets(false); 
  };

  const logout = () => { 
      setUser(null); 
      localStorage.removeItem('currentUser'); 
  };
  
  const updateTechnician = (tech: Technician) => {
      const idStr = String(tech.id);
      pendingActions.current.updated.add(idStr);
      setTimeout(() => pendingActions.current.updated.delete(idStr), 120000);
      const payload = { function: 'UPDATE_TECHNICIAN', technician: tech };
      console.log('Sending Webhook:', payload.function, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(res => {
          if (res.ok) {
              syncTickets(true);
              addToast('Staff details updated successfully', 'success');
          } else {
              addToast('Failed to update staff details.', 'error');
          }
      }).catch(err => {
          console.error('UPDATE_TECHNICIAN error:', err);
          addToast('Network error. Staff details may not have been updated.', 'error');
      });
  };

  const deleteTechnician = (id: string) => {
      const idStr = String(id);
      pendingActions.current.deleted.add(idStr);
      setTimeout(() => pendingActions.current.deleted.delete(idStr), 120000);
      const payload = { function: 'DELETE_TECHNICIAN', technicianId: idStr, id: idStr };
      console.log('Sending Webhook:', payload.function, payload);
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
    const payload = { function: 'ADD_TECHNICIAN', technician: newTech };
    console.log('Sending Webhook:', payload.function, payload);
    fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then(res => {
        if (res.ok) {
            addToast(`${tech.name} Saved to Server!`, 'success');
            // IMMEDIATELY add to local state so it shows up in dropdown
            setTechnicians(prev => [...prev, newTech]);
            // Also save to localStorage as backup
            localStorage.setItem('technicians', JSON.stringify([...technicians, newTech]));
            // Trigger sync to get fresh data from server
            ;
        } else {
            addToast('Failed to add technician. Please try again.', 'error');
        }
    }).catch(err => {
        console.error('ADD_TECHNICIAN error:', err);
        addToast('Network error. Technician may not have been saved.', 'error');
    });
    return true;
  };

  const addTicket = (ticketData: any) => {
      const newTicket: Ticket = {
          ...ticketData,
          id: `PG-${Math.floor(1000 + Math.random() * 9000)}`,
          status: TicketStatus.New,
          createdAt: new Date(),
          serviceBookingDate: new Date(),
      };
      addToast('New service ticket generated!', 'success');
      const payload = { function: 'NEW_TICKET', ticket: newTicket };
      console.log('Sending Webhook:', payload.function, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(res => {
          if (res.ok) {
              console.log('✅ NEW_TICKET sent successfully to webhook. Ticket ID:', newTicket.id);
              console.log('⏳ Waiting 2 seconds for Google Sheet to update...');
              // Wait 2 seconds for n8n to write to Google Sheet before reading
              setTimeout(async () => {
  console.log('📥 Now fetching fresh data from server...');
  await loadTicketsFromServer();
  triggerDataSync('tickets_updated')}, 2000);

          } else {
              addToast('Failed to save ticket. Please try again.', 'error');
              console.error('❌ NEW_TICKET response failed:', res.status);
          }
      }).catch(err => {
          console.error('❌ NEW_TICKET error:', err);
          addToast('Network error. Ticket may not have been saved.', 'error');
      });
  };

  const updateTicket = (updatedTicket: Ticket) => {
      addToast('Job updated successfully.', 'success');
      const functionName = updatedTicket.status === TicketStatus.Completed ? 'JOB_COMPLETED' : 'UPDATE_TICKET';
      const payload = { function: functionName, ticket: updatedTicket };
      console.log('Sending Webhook:', payload.function, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(res => {
          if (res.ok) {
              syncTickets(true);
          } else {
              addToast('Failed to update job. Please try again.', 'error');
          }
      }).catch(err => {
          console.error('UPDATE_TICKET error:', err);
          addToast('Network error. Job may not have been updated.', 'error');
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

      addToast('Job re-opened and escalated!', 'success');
      const payload = { function: 'REOPEN_TICKET', ticket: updatedTicket };
      console.log('Sending Webhook:', payload.function, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      }).then(res => {
          if (res.ok) {
              syncTickets(true);
          } else {
              addToast('Failed to re-open job. Please try again.', 'error');
          }
      }).catch(err => {
          console.error('REOPEN_TICKET error:', err);
          addToast('Network error. Job may not have been re-opened.', 'error');
      });
  };

  const markAttendance = (status: 'Clock In' | 'Clock Out') => {
      if (!user) return;
      const payload = {
          function: 'ATTENDANCE',
          technicianId: user.id,
          technicianName: user.name,
          status,
          timestamp: new Date().toISOString()
      };
      console.log('Sending Webhook:', payload.function, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(res => {
          if (res.ok) {
              syncTickets(true);
          } else {
              addToast('Failed to record attendance. Please try again.', 'error');
          }
      }).catch(err => {
          console.error('ATTENDANCE error:', err);
          addToast('Network error. Attendance may not have been recorded.', 'error');
      });
  };

  const sendUrgentAlert = (type: UrgentAlertType, comments: string) => {
      if (!user) return;
      const payload = {
          function: 'URGENT_ALERT',
          technicianId: user.id,
          technicianName: user.name,
          alertType: type,
          comments,
          timestamp: new Date().toISOString()
      };
      console.log('Sending Webhook:', payload.function, payload);
      fetch(APP_CONFIG.MASTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  };

  const resetAllTechnicianPoints = () => {
       addToast("Please implement server-side logic to reset points.", 'success');
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

