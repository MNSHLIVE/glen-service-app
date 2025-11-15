import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole } from '../types';
import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { COMPLAINT_SHEET_HEADERS, TECHNICIAN_UPDATE_HEADERS } from '../data/sheetHeaders';

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
  resetAllTechnicianPoints: () => void;
  syncTickets: () => Promise<void>;
  sendCustomWebhookPayload: (action: 'NEW_TICKET' | 'JOB_COMPLETED', payload: Record<string, any>) => void;
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
});


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const savedTechs = localStorage.getItem('technicians');
    if (savedTechs) {
      const parsed = JSON.parse(savedTechs);
      // Ensure test tech exists
      if (!parsed.find((t: Technician) => t.id === 'tech-test')) {
        const updatedTechs = [...parsed, TECHNICIANS.find(t => t.id === 'tech-test')];
        setTechnicians(updatedTechs);
        localStorage.setItem('technicians', JSON.stringify(updatedTechs));
      } else {
        setTechnicians(parsed);
      }
    } else {
      setTechnicians(TECHNICIANS);
      localStorage.setItem('technicians', JSON.stringify(TECHNICIANS));
    }

    const savedTickets = localStorage.getItem('tickets');
    if (savedTickets && JSON.parse(savedTickets).length > 0) {
        const parsedTickets = JSON.parse(savedTickets, (key, value) => {
             if (key === 'createdAt' || key === 'serviceBookingDate' || key === 'completedAt' || key === 'purchaseDate') {
                return value ? new Date(value) : undefined;
            }
            return value;
        });
      setTickets(parsedTickets);
    } else {
        // SEED with dummy ticket if it's the first run
        const dummy = createDummyTicket();
        setTickets([dummy]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);


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
              addToast(`Failed to send webhook for "${actionName}". Check your internet and ensure the Make.com scenario is ON.`, 'error');
          }
      } else {
          console.log(defaultLogMessage, JSON.stringify({ action, ...payload }, null, 2));
          addToast(`Automation for "${actionName}" is in simulation mode.`, 'success');
      }
  };

  const sendCustomWebhookPayload = (action: 'NEW_TICKET' | 'JOB_COMPLETED', payload: Record<string, any>) => {
     sendWebhook(
        action,
        { data: payload },
        `[AUTOMATION] Trigger: Sending custom test data for ${action}. (Master Webhook not configured)`
    );
  };

  const login = (loggedInUser: User) => setUser(loggedInUser);
  const logout = () => {
    setUser(null);
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
        return;
      }

      const data = await response.json();
      
      if (data.tickets && Array.isArray(data.tickets)) {
          const syncedTickets: Ticket[] = data.tickets.map((row: any) => {
            const partsReplacedString = row['Parts Replaced (Name | Price | Warranty)'] || '';
            const parts: ReplacedPart[] = partsReplacedString.split(', ').filter(Boolean).map((partStr: string) => {
              const [name, price, warrantyDuration] = partStr.split(' | ');
              return {
                name: name || 'N/A',
                price: parseFloat(price) || 0,
                warrantyDuration: warrantyDuration || 'N/A',
                type: PartType.Replacement,
                warrantyStatus: PartWarrantyStatus.OutOfWarranty,
                category: 'N/A',
              };
            });
            
            const findTechId = (name: string) => technicians.find(t => t.name === name)?.id || '';

            const ticket: Partial<Ticket> = {
                id: row['Ticket ID'],
                createdAt: row['Created At'] ? new Date(row['Created At']) : new Date(),
                serviceBookingDate: row['Service Booking Date'] ? new Date(row['Service Booking Date']) : new Date(),
                preferredTime: row['Preferred Time'],
                customerName: row['Customer Name'],
                phone: row['Phone'],
                address: row['Address'],
                serviceCategory: row['Service Category'],
                complaint: row['Complaint'],
                technicianId: findTechId(row['Assigned Technician'] || row['Technician Name']),
                status: (row['Status'] as TicketStatus) || TicketStatus.New,
                completedAt: row['Completed At'] ? new Date(row['Completed At']) : undefined,
                workDone: row['Work Done Summary'],
                amountCollected: parseFloat(row['Amount Collected']) || undefined,
                paymentStatus: (row['Payment Status'] as PaymentStatus) || undefined,
                pointsAwarded: !!row['Points Awarded'],
                serviceChecklist: {
                    amcDiscussion: row['AMC Discussion'] === 'true' || row['AMC Discussion'] === true,
                },
                freeService: row['Free Service'] === 'true' || row['Free Service'] === true,
                partsReplaced: parts,
            };
            return {
                ...ticket,
                productDetails: { make: 'Glen', segment: '', category: ticket.serviceCategory || '', subCategory: '', product: '' },
                symptoms: [],
            } as Ticket;
          });

          setTickets(syncedTickets);
          addToast('Jobs synced successfully!', 'success');
      } else {
           throw new Error('Invalid data format received from webhook.');
      }

    } catch (error) {
      console.error('[SYNC] Error syncing tickets:', error);
      addToast('Sync failed. Check your internet and ensure the Make.com scenario is ON.', 'error');
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
        serviceBookingDate: new Date(),
    }
    setTickets(prev => [newTicket, ...prev]);
    const technician = technicians.find(t => t.id === newTicket.technicianId);
    
    const flatPayload = {
      [COMPLAINT_SHEET_HEADERS[0]]: newTicket.id,
      [COMPLAINT_SHEET_HEADERS[1]]: newTicket.createdAt.toISOString(),
      [COMPLAINT_SHEET_HEADERS[2]]: newTicket.serviceBookingDate.toISOString(),
      [COMPLAINT_SHEET_HEADERS[3]]: newTicket.preferredTime,
      [COMPLAINT_SHEET_HEADERS[4]]: newTicket.customerName,
      [COMPLAINT_SHEET_HEADERS[5]]: newTicket.phone,
      [COMPLAINT_SHEET_HEADERS[6]]: newTicket.address,
      [COMPLAINT_SHEET_HEADERS[7]]: newTicket.serviceCategory,
      [COMPLAINT_SHEET_HEADERS[8]]: newTicket.complaint,
      [COMPLAINT_SHEET_HEADERS[9]]: technician?.name || 'Unassigned',
      [COMPLAINT_SHEET_HEADERS[10]]: newTicket.status,
    };

    sendWebhook(
        'NEW_TICKET', 
        { data: flatPayload },
        `[AUTOMATION] Trigger: New Ticket Created. (Master Webhook not configured)`
    );
  };

  const updateTicket = (updatedTicket: Ticket) => {
    const originalTicket = tickets.find(t => t.id === updatedTicket.id);
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    
    const technician = technicians.find(t => t.id === updatedTicket.technicianId);
    const partsReplacedString = (updatedTicket.partsReplaced || []).map(p => `${p.name} | ${p.price} | ${p.warrantyDuration}`).join(', ');

    const updatePayload = { 
        ticketId: updatedTicket.id,
        newStatus: updatedTicket.status,
        comments: updatedTicket.comments,
    };
    
    sendWebhook(
        'TICKET_UPDATED',
        updatePayload,
        `[AUTOMATION] Trigger: Ticket Updated. (Master Webhook not configured)`
    );

    if (originalTicket?.status !== TicketStatus.Completed && updatedTicket.status === TicketStatus.Completed) {
        let pointsEarned = 0;
        if (!updatedTicket.pointsAwarded) {
            pointsEarned = 250;
            const updatedTechs = technicians.map(t => {
                if (t.id === updatedTicket.technicianId) {
                    addToast(`${t.name} earned ${pointsEarned} points!`, 'success');
                    return { ...t, points: t.points + pointsEarned };
                }
                return t;
            });
            setTechnicians(updatedTechs);
            localStorage.setItem('technicians', JSON.stringify(updatedTechs));
            updatedTicket.pointsAwarded = true; 
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        }
        
        const flatJobCompletedPayload = {
            [TECHNICIAN_UPDATE_HEADERS[0]]: updatedTicket.id,
            [TECHNICIAN_UPDATE_HEADERS[1]]: updatedTicket.createdAt.toISOString(),
            [TECHNICIAN_UPDATE_HEADERS[2]]: updatedTicket.customerName,
            [TECHNICIAN_UPDATE_HEADERS[3]]: updatedTicket.phone,
            [TECHNICIAN_UPDATE_HEADERS[4]]: updatedTicket.address,
            [TECHNICIAN_UPDATE_HEADERS[5]]: updatedTicket.serviceCategory,
            [TECHNICIAN_UPDATE_HEADERS[6]]: updatedTicket.complaint,
            [TECHNICIAN_UPDATE_HEADERS[7]]: (updatedTicket.completedAt || new Date()).toISOString(),
            [TECHNICIAN_UPDATE_HEADERS[8]]: technician?.name || 'Unassigned',
            [TECHNICIAN_UPDATE_HEADERS[9]]: updatedTicket.workDone || '',
            [TECHNICIAN_UPDATE_HEADERS[10]]: updatedTicket.amountCollected || 0,
            [TECHNICIAN_UPDATE_HEADERS[11]]: updatedTicket.paymentStatus || PaymentStatus.Pending,
            [TECHNICIAN_UPDATE_HEADERS[12]]: pointsEarned,
            [TECHNICIAN_UPDATE_HEADERS[13]]: partsReplacedString,
            [TECHNICIAN_UPDATE_HEADERS[14]]: updatedTicket.serviceChecklist?.amcDiscussion || false,
            [TECHNICIAN_UPDATE_HEADERS[15]]: updatedTicket.freeService || false,
        };

        sendWebhook(
            'JOB_COMPLETED',
            { data: flatJobCompletedPayload },
            `[AUTOMATION] Trigger: Job Completed. (Master Webhook not configured)`
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
        `[AUTOMATION] Trigger: New Feedback Received. (Master Webhook not configured)`
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

  const resetAllTechnicianPoints = () => {
    if (window.confirm('Are you sure you want to reset all technician points to zero? This action cannot be undone.')) {
        const resetTechs = technicians.map(t => ({...t, points: 0}));
        setTechnicians(resetTechs);
        localStorage.setItem('technicians', JSON.stringify(resetTechs));
        addToast('All technician points have been reset to 0.', 'success');
    }
  };


  const contextValue = { user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, addFeedback, uploadDamagedPart, addTechnician, updateTechnician, deleteTechnician, sendReceipt, resetAllTechnicianPoints, isSyncing, syncTickets, sendCustomWebhookPayload };

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
