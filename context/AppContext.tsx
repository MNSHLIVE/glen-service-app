import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// Fix: Import PartType and PartWarrantyStatus to correctly type the mock data.
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole } from '../types';
import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { COMPLAINT_SHEET_HEADERS, UPDATE_SHEET_HEADERS, SAMPLE_COMPLAINT_DATA, SAMPLE_UPDATE_DATA } from '../data/sheetHeaders';

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  technicians: Technician[];
  feedback: Feedback[];
  isSyncing: boolean;
  login: (user: User) => void;
  logout: () => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'serviceBookingDate'>) => void;
  updateTicket: (updatedTicket: Ticket) => void;
  uploadDamagedPart: (ticketId: string, imageData: string) => void;
  addFeedback: (feedbackItem: Feedback) => void;
  addTechnician: (tech: Omit<Technician, 'id' | 'points'>) => void;
  updateTechnician: (updatedTech: Technician) => void;
  deleteTechnician: (techId: string) => void;
  sendReceipt: (ticketId: string) => void;
  initializeSheets: () => void;
  resetAllTechnicianPoints: () => void;
  syncTickets: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fix: Export AppProvider to make it available for import.
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { addToast } = useToast();

  // Load initial data from localStorage for offline-first experience
  useEffect(() => {
    // Technicians
    const savedTechs = localStorage.getItem('technicians');
    if (savedTechs) {
      setTechnicians(JSON.parse(savedTechs));
    } else {
      setTechnicians(TECHNICIANS);
      localStorage.setItem('technicians', JSON.stringify(TECHNICIANS));
    }
    // Tickets
    const savedTickets = localStorage.getItem('tickets');
    if (savedTickets) {
        const parsedTickets = JSON.parse(savedTickets, (key, value) => {
             if (key === 'createdAt' || key === 'serviceBookingDate' || key === 'completedAt' || key === 'purchaseDate') {
                return value ? new Date(value) : undefined;
            }
            return value;
        });
      setTickets(parsedTickets);
    }
  }, []);

  // Persist tickets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);


  // Helper function to send data to a single master webhook
  const sendWebhook = async (action: string, payload: object, defaultLogMessage: string) => {
      const webhookUrl = localStorage.getItem('masterWebhookUrl');
      const actionName = action.replace(/_/g, ' ').toLowerCase();

      if (webhookUrl) {
          const finalPayload = { action, ...payload };
          try {
              const response = await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(finalPayload),
              });
              if (response.ok) {
                  console.log(`[AUTOMATION] Successfully sent data for action: ${action}`);
                  addToast(`Automation for "${actionName}" triggered!`, 'success');
              } else {
                  if (response.status === 410) {
                      console.error('[AUTOMATION] Webhook URL is gone (410). Clearing from storage.');
                      localStorage.removeItem('masterWebhookUrl');
                      addToast('Webhook URL is invalid (Error 410). It has been cleared. Please paste a new URL from Make.com and save it in Settings.', 'error');
                  } else {
                      console.error(`[AUTOMATION] Failed to send data to webhook for action ${action}. Status: ${response.status}`);
                      addToast(`Webhook error for "${actionName}". Status: ${response.status}`, 'error');
                  }
              }
          } catch (error) {
              console.error(`[AUTOMATION] Error sending data to webhook for action ${action}:`, error);
              addToast(`Failed to send webhook for "${actionName}".`, 'error');
          }
      } else {
          console.log(defaultLogMessage, JSON.stringify({ action, ...payload }, null, 2));
          addToast(`Automation for "${actionName}" is in simulation mode.`, 'success');
      }
  };

  const login = (loggedInUser: User) => setUser(loggedInUser);
  const logout = () => {
    setUser(null);
    // Optional: Clear tickets on logout to ensure fresh data for next user
    // setTickets([]); 
  };


  const syncTickets = async () => {
    if (!user) return;
    const webhookUrl = localStorage.getItem('masterWebhookUrl');
    if (!webhookUrl) {
      addToast('Webhook URL not configured in settings.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const payload = {
        action: 'GET_TICKETS',
        role: user.role,
        technicianId: user.role === UserRole.Technician ? user.id : undefined,
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 410) {
            console.error('[AUTOMATION] Webhook URL is gone (410). Clearing from storage.');
            localStorage.removeItem('masterWebhookUrl');
            addToast('Webhook URL is invalid (Error 410). It has been cleared. Please get a new URL from Make.com and save it in Settings.', 'error');
        } else {
            throw new Error(`Sync failed with status: ${response.status}`);
        }
        return; // Stop execution if sync fails
      }

      const data = await response.json();
      
      if (data.tickets && Array.isArray(data.tickets)) {
          const syncedTickets = data.tickets.map((ticket: any) => ({
              ...ticket,
              createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
              serviceBookingDate: ticket.serviceBookingDate ? new Date(ticket.serviceBookingDate) : new Date(),
              completedAt: ticket.completedAt ? new Date(ticket.completedAt) : undefined,
              purchaseDate: ticket.purchaseDate ? new Date(ticket.purchaseDate) : undefined,
              // Ensure partsReplaced is an array
              partsReplaced: ticket.partsReplaced || [],
          }));

          setTickets(syncedTickets);
          addToast('Jobs synced successfully!', 'success');
      } else {
           throw new Error('Invalid data format received from webhook.');
      }

    } catch (error) {
      console.error('[SYNC] Error syncing tickets:', error);
      addToast('Failed to sync jobs from Google Sheets.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const addTicket = (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'serviceBookingDate'>) => {
    const newTicket: Ticket = {
        ...ticketData,
        id: `SB/${new Date().getFullYear()}/${new Date().getMonth()+1}/DL/${Math.floor(Math.random() * 900000) + 100000}`,
        status: TicketStatus.New,
        createdAt: new Date(),
        serviceBookingDate: new Date(), // Default to today, can be changed
    }
    // Optimistic UI update
    setTickets(prev => [newTicket, ...prev]);
    const technician = technicians.find(t => t.id === newTicket.technicianId);
    
    const payload = { 
        ticket: newTicket,
        technicianName: technician?.name || 'Unassigned'
    };

    sendWebhook(
        'NEW_TICKET', 
        payload,
        `[AUTOMATION] Trigger: New Ticket Created. Sending data to Make.com... (Master Webhook not configured)`
    );
  };

  const updateTicket = (updatedTicket: Ticket) => {
    const originalTicket = tickets.find(t => t.id === updatedTicket.id);
    // Optimistic UI update
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    
    const technician = technicians.find(t => t.id === updatedTicket.technicianId);
    const payload = { 
        ticket: updatedTicket, 
        technicianName: technician?.name || 'Unassigned'
    };
    
    sendWebhook(
        'TICKET_UPDATED',
        payload,
        `[AUTOMATION] Trigger: Ticket Updated. Sending data to Make.com... (Master Webhook not configured)`
    );

    if (originalTicket?.status !== TicketStatus.Completed && updatedTicket.status === TicketStatus.Completed) {
        if (!updatedTicket.pointsAwarded) {
            const updatedTechs = technicians.map(t => {
                if (t.id === updatedTicket.technicianId) {
                    addToast(`${t.name} earned 250 points!`, 'success');
                    return { ...t, points: t.points + 250 };
                }
                return t;
            });
            setTechnicians(updatedTechs);
            localStorage.setItem('technicians', JSON.stringify(updatedTechs));
            updatedTicket.pointsAwarded = true; 
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        }

        sendWebhook(
            'JOB_COMPLETED',
            payload,
            `[AUTOMATION] Trigger: Job Completed. Sending data to Make.com... (Master Webhook not configured)`
        );
    }
  };

  const uploadDamagedPart = (ticketId: string, imageData: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const technician = technicians.find(t => t.id === ticket.technicianId);
    
    const payload = { 
        ticketId, 
        imageData, 
        timestamp: new Date().toISOString(),
        technicianName: technician?.name || 'Unassigned',
    };
    sendWebhook(
        'DAMAGED_PART_UPLOADED',
        payload,
        `[AUTOMATION] Trigger: Damaged Part Image Uploaded for Ticket ${ticketId}. (Master Webhook not configured)`
    );
    
    const fakeGoogleDriveUrl = `https://docs.google.com/a-fake-link-to-image/${ticketId}-${Date.now()}.jpg`;
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, damagedPartImageUrl: fakeGoogleDriveUrl } : t
    ));
  };
  
  const addFeedback = (feedbackItem: Feedback) => {
    setFeedback(prev => [feedbackItem, ...prev]);
    const ticket = tickets.find(t => t.id === feedbackItem.ticketId);
    if (!ticket) return;
    const technician = technicians.find(t => t.id === ticket.technicianId);

    const payload = { ...feedbackItem, technicianName: technician?.name || 'Unassigned' };
    sendWebhook(
        'NEW_FEEDBACK',
        payload,
        `[AUTOMATION] Trigger: New Feedback Received. Sending data to Make.com... (Master Webhook not configured)`
    );
  };

  const addTechnician = (tech: Omit<Technician, 'id' | 'points'>) => {
      const newTech = { ...tech, id: `tech${Date.now()}`, points: 0 };
      const updatedTechs = [...technicians, newTech];
      setTechnicians(updatedTechs);
      localStorage.setItem('technicians', JSON.stringify(updatedTechs));
      addToast('Technician added successfully!', 'success');
  }

  const updateTechnician = (updatedTech: Technician) => {
      const updatedTechs = technicians.map(t => t.id === updatedTech.id ? updatedTech : t);
      setTechnicians(updatedTechs);
      localStorage.setItem('technicians', JSON.stringify(updatedTechs));
      addToast('Technician updated successfully!', 'success');
  }

  const deleteTechnician = (techId: string) => {
      const updatedTechs = technicians.filter(t => t.id !== techId);
      setTechnicians(updatedTechs);
      localStorage.setItem('technicians', JSON.stringify(updatedTechs));
      addToast('Technician removed successfully!', 'success');
  }

  const sendReceipt = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const technician = technicians.find(t => t.id === ticket.technicianId);

    const payload = {
        ticket,
        technicianName: technician?.name || 'Unassigned',
    };
    sendWebhook(
        'GENERATE_RECEIPT',
        payload,
        `[AUTOMATION] Trigger: Receipt Generated for Ticket ${ticketId}. (Master Webhook not configured)`
    );
  };
  
  const initializeSheets = () => {
    const payload = {
      complaintSheetHeaders: COMPLAINT_SHEET_HEADERS,
      updateSheetHeaders: UPDATE_SHEET_HEADERS,
      sampleComplaintData: SAMPLE_COMPLAINT_DATA,
      sampleUpdateData: SAMPLE_UPDATE_DATA,
    };
    sendWebhook(
      'INITIALIZE_SHEETS',
      payload,
      `[AUTOMATION] Trigger: Initialize Google Sheets. (Master Webhook not configured)`
    );
  };

  const resetAllTechnicianPoints = () => {
    if (window.confirm('Are you sure you want to reset all technician points to zero? This action cannot be undone.')) {
        const resetTechs = technicians.map(t => ({...t, points: 0}));
        setTechnicians(resetTechs);
        localStorage.setItem('technicians', JSON.stringify(resetTechs));
        addToast('All technician points have been reset to 0.', 'success');
    }
  };


  const contextValue = { user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, addFeedback, uploadDamagedPart, addTechnician, updateTechnician, deleteTechnician, sendReceipt, initializeSheets, resetAllTechnicianPoints, isSyncing, syncTickets };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};