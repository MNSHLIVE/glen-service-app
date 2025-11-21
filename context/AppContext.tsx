
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole, WebhookStatus } from '../types';
import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { COMPLAINT_SHEET_HEADERS, TECHNICIAN_UPDATE_HEADERS } from '../data/sheetHeaders';
import { APP_CONFIG } from '../config'; // Import the new config

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  technicians: Technician[];
  feedback: Feedback[];
  isSyncing: boolean;
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
  sendReceipt: (ticketId: string) => void;
  resetAllTechnicianPoints: () => void;
  syncTickets: (isBackground?: boolean) => Promise<void>;
  checkWebhookHealth: (urlOverride?: string) => Promise<void>;
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
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>(WebhookStatus.Unknown);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { addToast } = useToast();
  
  // Define finalPayload variable for sendWebhook usage
  let finalPayload: any;

  // Effect for loading data from localStorage ONCE on startup, with error handling
  useEffect(() => {
    try {
      // --- CONFIGURATION PERSISTENCE CHECK ---
      // If config.ts has values, force them into localStorage so they stick
      if (APP_CONFIG.MASTER_WEBHOOK_URL) {
          localStorage.setItem('masterWebhookUrl', APP_CONFIG.MASTER_WEBHOOK_URL);
      }
      if (APP_CONFIG.COMPLAINT_SHEET_URL) {
          localStorage.setItem('complaintSheetUrl', APP_CONFIG.COMPLAINT_SHEET_URL);
      }
      if (APP_CONFIG.UPDATE_SHEET_URL) {
          localStorage.setItem('updateSheetUrl', APP_CONFIG.UPDATE_SHEET_URL);
      }

      // Load Technicians
      const savedTechs = localStorage.getItem('technicians');
      let initialTechs = TECHNICIANS;
      if (savedTechs) {
        const parsedTechs = JSON.parse(savedTechs);
        if (Array.isArray(parsedTechs)) {
            // Ensure test tech exists, add if missing
            if (!parsedTechs.some((t: Technician) => t.id === 'tech-test')) {
                const testTech = TECHNICIANS.find(t => t.id === 'tech-test');
                if (testTech) parsedTechs.push(testTech);
            }
            initialTechs = parsedTechs;
        }
      }
      setTechnicians(initialTechs);

      // Load Tickets
      const savedTickets = localStorage.getItem('tickets');
      let initialTickets: Ticket[] = [createDummyTicket()];
      if (savedTickets) {
        const parsedTickets = JSON.parse(savedTickets, (key, value) => {
          if (['createdAt', 'serviceBookingDate', 'completedAt', 'purchaseDate'].includes(key)) {
            return value ? new Date(value) : undefined;
          }
          return value;
        });

        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
          initialTickets = parsedTickets;
        }
      }
      setTickets(initialTickets);

      // Initial Webhook Status Check
      const storedUrl = localStorage.getItem('masterWebhookUrl');
      if (storedUrl) {
        setWebhookStatus(WebhookStatus.Checking);
        // We don't run a full fetch here to avoid lag, just set state
        // The user can trigger a test from settings
      } else {
        setWebhookStatus(WebhookStatus.Simulating);
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage. Resetting to default state.", error);
      addToast('App data was corrupted and has been reset.', 'error');
      
      // Clear corrupted storage and load defaults
      localStorage.removeItem('technicians');
      localStorage.removeItem('tickets');
      setTechnicians(TECHNICIANS);
      setTickets([createDummyTicket()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect for saving tickets to localStorage whenever they change
  useEffect(() => {
    if (tickets.length > 0) {
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
  }, [tickets]);

  // Effect for saving technicians to localStorage whenever they change
  useEffect(() => {
    if (technicians.length > 0) {
        localStorage.setItem('technicians', JSON.stringify(technicians));
    }
  }, [technicians]);


  const sendWebhook = async (action: string, payload: object, defaultLogMessage: string) => {
      const webhookUrl = localStorage.getItem('masterWebhookUrl');
      const actionName = action.replace(/_/g, ' ').toLowerCase();

      if (webhookUrl) {
          if (action !== 'HEALTH_CHECK') {
             setWebhookStatus(WebhookStatus.Checking);
          }
          try {
              finalPayload = { action, ...payload };
              const response = await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 
                      'Content-Type': 'application/json',
                      'X-App-Source': 'Pandit-Glen-App-Secure' // Simple security header to identify legitimate requests
                  },
                  body: JSON.stringify(finalPayload),
              });
              if (response.ok) {
                  setWebhookStatus(WebhookStatus.Connected);
                  if (action !== 'HEALTH_CHECK') {
                    console.log(`[AUTOMATION] Successfully sent data for action: ${action}`);
                    addToast(`Automation for "${actionName}" triggered!`, 'success');
                  }
              } else {
                  setWebhookStatus(WebhookStatus.Error);
                  // REMOVED: We no longer delete the URL on error. User must check it manually.
                  console.error(`[AUTOMATION] Failed to send data to webhook for action ${action}. Status: ${response.status}`);
                  addToast(`Webhook error: ${response.status}. Check Make.com scenario is ON.`, 'error');
              }
          } catch (error) {
              setWebhookStatus(WebhookStatus.Error);
              console.error(`[AUTOMATION] Error sending data to webhook for action ${action}:`, error);
              addToast(`Failed to send webhook. Ensure Make.com scenario is ON.`, 'error');
          }
      } else {
          setWebhookStatus(WebhookStatus.Simulating);
          console.log(defaultLogMessage, JSON.stringify({ action, ...payload }, null, 2));
          addToast(`Automation for "${actionName}" is in simulation mode.`, 'success');
      }
  };
  
  const checkWebhookHealth = async (urlOverride?: string) => {
    const webhookUrl = urlOverride ?? localStorage.getItem('masterWebhookUrl');
    if (!webhookUrl) {
      addToast('Please enter a Master Webhook URL first.', 'error');
      setWebhookStatus(WebhookStatus.Simulating);
      return;
    }
    setWebhookStatus(WebhookStatus.Checking);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-App-Source': 'Pandit-Glen-App-Secure'
        },
        body: JSON.stringify({ action: 'HEALTH_CHECK' }),
      });

      const responseText = await response.text();
      
      // CRITICAL FIX: Check for "Accepted" text which means user forgot the response module
      if (responseText.includes('Accepted') && responseText.length < 50) {
         throw new Error("Make.com accepted the data but didn't reply. You MUST add a 'Webhook Response' module to the end of the path.");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("[HEALTH CHECK] Response was not JSON:", responseText);
        throw new Error(`Make.com returned text "${responseText}" instead of JSON. Add a 'Webhook Response' module to Path 4.`);
      }

      if (response.ok) {
        if (data.status === 'ok') {
          addToast('Success! Automation system is online and ready.', 'success');
          setWebhookStatus(WebhookStatus.Connected);
        } else {
          throw new Error(`Webhook responded, but status was not 'ok'. Got: ${JSON.stringify(data)}`);
        }
      } else {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('[HEALTH CHECK] Failed:', error);
      addToast(error.message || 'Connection failed. Ensure Scenario is ON in Make.com.', 'error');
      setWebhookStatus(WebhookStatus.Error);
    }
  };

  const sendCustomWebhookPayload = (action: 'NEW_TICKET' | 'JOB_COMPLETED', payload: Record<string, any>) => {
     // REVERTED: Wrap in { data: ... } to match original mapping
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


  const syncTickets = async (isBackground: boolean = false) => {
    if (!user) return;
    const webhookUrl = localStorage.getItem('masterWebhookUrl');
    if (!webhookUrl) {
      if (!isBackground) {
          addToast('Webhook URL not configured in settings.', 'error');
      }
      setWebhookStatus(WebhookStatus.Simulating);
      return;
    }

    setIsSyncing(true);
    if (!isBackground) {
        setWebhookStatus(WebhookStatus.Checking);
        // Explicitly telling the user what action is being sent
        addToast('Syncing... (Sending: FETCH_NEW_JOBS)', 'success');
    }

    try {
      const payload = {
        action: 'FETCH_NEW_JOBS', // STANDARDIZED to "FETCH_NEW_JOBS"
        role: user.role,
        technicianId: user.role === UserRole.Technician ? user.id : "", 
      };
      
      if (!isBackground) console.log('[SYNC] Sending payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-App-Source': 'Pandit-Glen-App-Secure'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setWebhookStatus(WebhookStatus.Error);
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const responseText = await response.text();
      
      // CRITICAL FIX: Check for "Accepted" text which means user forgot the response module
      if (responseText.includes('Accepted') && responseText.length < 50) {
         throw new Error("Make.com accepted command but sent no data. Add Webhook Response to Path 3.");
      }

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (e) {
          console.error("[SYNC] Response was not JSON:", responseText);
          throw new Error(`Make.com returned "${responseText}" instead of tickets JSON.`);
      }

      // Handle two possible formats:
      // 1. Standard: { "tickets": [...] }
      // 2. Raw Array: [...] (If user forgets to wrap in Make.com)
      let ticketsArray: any[] = [];
      
      if (Array.isArray(data)) {
          ticketsArray = data;
      } else if (data.tickets && Array.isArray(data.tickets)) {
          ticketsArray = data.tickets;
      } else {
          // Tolerate empty responses if sheets are empty
          console.warn("[SYNC] Received valid JSON but no array found. Assuming empty sheet.", data);
          ticketsArray = []; 
      }

      if (ticketsArray) {
          const syncedTickets: Ticket[] = ticketsArray.map((row: any) => {
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
          setWebhookStatus(WebhookStatus.Connected);
          setLastSyncTime(new Date()); // UPDATE LAST SYNC TIME
          if (!isBackground) {
              addToast(`Synced ${syncedTickets.length} jobs successfully!`, 'success');
          }
      }

    } catch (error: any) {
      setWebhookStatus(WebhookStatus.Error);
      if (!isBackground) {
        console.error('[SYNC] Error syncing tickets:', error);
        addToast(error.message || 'Sync failed. Check Make.com scenario is ON.', 'error');
      }
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
      [COMPLAINT_SHEET_HEADERS[1]]: newTicket.createdAt.toLocaleString(), // Changed to Locale String for better readability in sheets
      [COMPLAINT_SHEET_HEADERS[2]]: newTicket.serviceBookingDate.toLocaleString(),
      [COMPLAINT_SHEET_HEADERS[3]]: newTicket.preferredTime,
      [COMPLAINT_SHEET_HEADERS[4]]: newTicket.customerName,
      [COMPLAINT_SHEET_HEADERS[5]]: newTicket.phone,
      [COMPLAINT_SHEET_HEADERS[6]]: newTicket.address,
      [COMPLAINT_SHEET_HEADERS[7]]: newTicket.serviceCategory,
      [COMPLAINT_SHEET_HEADERS[8]]: newTicket.complaint,
      [COMPLAINT_SHEET_HEADERS[9]]: technician?.name || 'Unassigned',
      [COMPLAINT_SHEET_HEADERS[10]]: newTicket.status,
    };

    // REVERTED: Wrap in { data: ... } to match original mapping
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
        { data: updatePayload },
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
            updatedTicket.pointsAwarded = true; 
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        }
        
        const flatJobCompletedPayload = {
            [TECHNICIAN_UPDATE_HEADERS[0]]: updatedTicket.id,
            [TECHNICIAN_UPDATE_HEADERS[1]]: updatedTicket.createdAt.toLocaleString(),
            [TECHNICIAN_UPDATE_HEADERS[2]]: updatedTicket.serviceBookingDate.toLocaleString(),
            [TECHNICIAN_UPDATE_HEADERS[3]]: updatedTicket.preferredTime,
            [TECHNICIAN_UPDATE_HEADERS[4]]: updatedTicket.customerName,
            [TECHNICIAN_UPDATE_HEADERS[5]]: updatedTicket.phone,
            [TECHNICIAN_UPDATE_HEADERS[6]]: updatedTicket.address,
            [TECHNICIAN_UPDATE_HEADERS[7]]: updatedTicket.serviceCategory,
            [TECHNICIAN_UPDATE_HEADERS[8]]: updatedTicket.complaint,
            [TECHNICIAN_UPDATE_HEADERS[9]]: (updatedTicket.completedAt || new Date()).toLocaleString(),
            [TECHNICIAN_UPDATE_HEADERS[10]]: technician?.name || 'Unassigned',
            [TECHNICIAN_UPDATE_HEADERS[11]]: updatedTicket.workDone || '',
            [TECHNICIAN_UPDATE_HEADERS[12]]: updatedTicket.amountCollected || 0,
            [TECHNICIAN_UPDATE_HEADERS[13]]: updatedTicket.paymentStatus || PaymentStatus.Pending,
            [TECHNICIAN_UPDATE_HEADERS[14]]: pointsEarned,
            [TECHNICIAN_UPDATE_HEADERS[15]]: partsReplacedString,
            [TECHNICIAN_UPDATE_HEADERS[16]]: updatedTicket.serviceChecklist?.amcDiscussion || false,
            [TECHNICIAN_UPDATE_HEADERS[17]]: updatedTicket.freeService || false,
        };

        // REVERTED: Wrap in { data: ... } to match original mapping
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
        { data: payload },
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
        { data: payload },
        `[AUTOMATION] Trigger: New Feedback Received. (Master Webhook not configured)`
    );
  };

  const addTechnician = (tech: Omit<Technician, 'id' | 'points'>) => {
      const newTech = { ...tech, id: `tech${Date.now()}`, points: 0 };
      const updatedTechs = [...technicians, newTech];
      setTechnicians(updatedTechs);
      addToast('Technician added successfully!', 'success');
  }

  const updateTechnician = (updatedTech: Technician) => {
      const updatedTechs = technicians.map(t => t.id === updatedTech.id ? updatedTech : t);
      setTechnicians(updatedTechs);
      addToast('Technician updated successfully!', 'success');
  }

  const deleteTechnician = (techId: string) => {
      const updatedTechs = technicians.filter(t => t.id !== techId);
      setTechnicians(updatedTechs);
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
        { data: payload },
        `[AUTOMATION] Trigger: Receipt Generated for Ticket ${ticketId}. (Master Webhook not configured)`
    );
  };

  const resetAllTechnicianPoints = () => {
    if (window.confirm('Are you sure you want to reset all technician points to zero? This action cannot be undone.')) {
        const resetTechs = technicians.map(t => ({...t, points: 0}));
        setTechnicians(resetTechs);
        addToast('All technician points have been reset to 0.', 'success');
    }
  };


  const contextValue = { user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, addFeedback, uploadDamagedPart, addTechnician, updateTechnician, deleteTechnician, sendReceipt, resetAllTechnicianPoints, isSyncing, syncTickets, webhookStatus, checkWebhookHealth, sendCustomWebhookPayload, lastSyncTime };

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
