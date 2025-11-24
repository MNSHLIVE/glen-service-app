
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus, UserRole, WebhookStatus } from '../types';
import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { COMPLAINT_SHEET_HEADERS, TECHNICIAN_UPDATE_HEADERS, ATTENDANCE_SHEET_HEADERS } from '../data/sheetHeaders';
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
  resetTechniciansToDefaults: () => void;
  sendReceipt: (ticketId: string) => void;
  markAttendance: (status: 'Clock In' | 'Clock Out') => void;
  resetAllTechnicianPoints: () => void;
  syncTickets: (isBackground?: boolean) => Promise<void>;
  checkWebhookHealth: (urlOverride?: string) => Promise<void>;
  sendCustomWebhookPayload: (action: 'NEW_TICKET' | 'JOB_COMPLETED' | 'ATTENDANCE', payload: Record<string, any>, urlOverride?: string) => void;
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
  
  // Effect for loading data from localStorage ONCE on startup, with error handling
  useEffect(() => {
    try {
      // --- CONFIGURATION PERSISTENCE CHECK ---
      // If config.ts has values, force them into localStorage so they stick
      if (APP_CONFIG.MASTER_WEBHOOK_URL) {
          localStorage.setItem('masterWebhookUrl', APP_CONFIG.MASTER_WEBHOOK_URL);
      }
      if (APP_CONFIG.GOOGLE_SHEET_URL) {
          localStorage.setItem('googleSheetUrl', APP_CONFIG.GOOGLE_SHEET_URL);
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
        // Don't block UI with checking state on load, allow user to edit
        setWebhookStatus(WebhookStatus.Unknown);
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


  const sendWebhook = async (action: string, payload: object, defaultLogMessage: string, urlOverride?: string) => {
      const webhookUrl = urlOverride || localStorage.getItem('masterWebhookUrl');
      const actionName = action.replace(/_/g, ' ').toLowerCase();

      // Combine action and payload at the top level (FLAT STRUCTURE)
      const finalPayload = { action, ...payload };

      if (webhookUrl) {
          if (action !== 'HEALTH_CHECK') {
             // Only set to checking if not a health check to avoid UI flicker on manual tests
             setWebhookStatus(WebhookStatus.Checking);
          }
          try {
              console.log(`[WEBHOOK PAYLOAD] Sending to ${webhookUrl}:`, JSON.stringify(finalPayload, null, 2));
              const response = await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 
                      'Content-Type': 'application/json',
                      // Removed X-App-Source to reduce CORS preflight issues
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
                  console.error(`[AUTOMATION] Failed to send data to webhook for action ${action}. Status: ${response.status}`);
                  addToast(`Webhook error: ${response.status}. Check Automation (n8n) is ON.`, 'error');
              }
          } catch (error: any) {
              setWebhookStatus(WebhookStatus.Error);
              console.error(`[AUTOMATION] Error sending data to webhook for action ${action}:`, error);
              
              // More descriptive error handling
              let errorMsg = 'Failed to send webhook.';
              if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                  const isHttps = window.location.protocol === 'https:';
                  const isHttpUrl = webhookUrl.startsWith('http:');
                  if (isHttps && isHttpUrl) {
                      errorMsg = 'Blocked: Mixed Content. Cannot send to HTTP n8n from HTTPS app.';
                  } else {
                      errorMsg = 'Network Error. Check if n8n is running and CORS is enabled.';
                  }
              }

              addToast(`${errorMsg} Ensure n8n is active/listening.`, 'error');
          }
      } else {
          setWebhookStatus(WebhookStatus.Simulating);
          console.log(defaultLogMessage, JSON.stringify(finalPayload, null, 2));
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
        },
        body: JSON.stringify({ action: 'HEALTH_CHECK' }),
      });

      const responseText = await response.text();

      if (response.ok) {
        setWebhookStatus(WebhookStatus.Connected);
        
        // Try to parse for perfect configuration, but don't fail if just connected
        try {
            const data = JSON.parse(responseText);
            if (data.status === 'ok') {
                addToast('Success! Automation system is online and ready.', 'success');
            } else {
                 addToast('Connected! (n8n received the signal)', 'success');
            }
        } catch (e) {
            // Not JSON, likely just a 200 OK text response. This is fine for connectivity.
            console.log("[HEALTH CHECK] Non-JSON response (200 OK):", responseText);
            addToast('Connected! (n8n received the signal)', 'success');
        }
      } else {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('[HEALTH CHECK] Failed:', error);
      
      let errorMsg = error.message || 'Connection failed.';
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          errorMsg = 'Network Error: Could not reach n8n. Check CORS/Server.';
      }
      
      addToast(errorMsg, 'error');
      setWebhookStatus(WebhookStatus.Error);
    }
  };

  const sendCustomWebhookPayload = (action: 'NEW_TICKET' | 'JOB_COMPLETED' | 'ATTENDANCE', payload: Record<string, any>, urlOverride?: string) => {
     // Send payload directly (flat), do not wrap in 'data'
     sendWebhook(
        action,
        payload,
        `[AUTOMATION] Trigger: Sending custom test data for ${action}. (Master Webhook not configured)`,
        urlOverride
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
        addToast('Syncing... (Sending: FETCH_NEW_JOBS)', 'success');
    }

    try {
      const payload = {
        action: 'FETCH_NEW_JOBS',
        role: user.role,
        technicianId: user.role === UserRole.Technician ? user.id : "", 
      };
      
      if (!isBackground) console.log('[SYNC] Sending payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setWebhookStatus(WebhookStatus.Error);
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const responseText = await response.text();
      
      // For Sync, we DO expect data back, so we keep the check stricter than Health Check
      if ((responseText.includes('Accepted') || responseText.includes('Workflow started')) && responseText.length < 100) {
         throw new Error("n8n accepted command but sent no data. Add 'Respond to Webhook' node to Path 3.");
      }

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (e) {
          console.error("[SYNC] Response was not JSON:", responseText);
          throw new Error(`Automation returned "${responseText}" instead of tickets JSON.`);
      }

      let ticketsArray: any[] = [];
      
      if (Array.isArray(data)) {
          ticketsArray = data;
      } else if (data.tickets && Array.isArray(data.tickets)) {
          ticketsArray = data.tickets;
      } else {
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
          setLastSyncTime(new Date());
          if (!isBackground) {
              addToast(`Synced ${syncedTickets.length} jobs successfully!`, 'success');
          }
      }

    } catch (error: any) {
      setWebhookStatus(WebhookStatus.Error);
      if (!isBackground) {
        console.error('[SYNC] Error syncing tickets:', error);
        
        let errorMsg = error.message || 'Sync failed.';
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
           errorMsg = 'Sync Error: Could not reach n8n (CORS/Network).';
        }
        addToast(errorMsg, 'error');
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
      [COMPLAINT_SHEET_HEADERS[1]]: newTicket.createdAt.toLocaleString(),
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

    // Send flattened payload
    sendWebhook(
        'NEW_TICKET', 
        flatPayload,
        `[AUTOMATION] Trigger: New Ticket Created.`
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
        `[AUTOMATION] Trigger: Ticket Updated.`
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

        sendWebhook(
            'JOB_COMPLETED',
            flatJobCompletedPayload,
            `[AUTOMATION] Trigger: Job Completed.`
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
        `[AUTOMATION] Trigger: Damaged Part Image Uploaded.`
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
        `[AUTOMATION] Trigger: New Feedback Received.`
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

  const resetTechniciansToDefaults = () => {
      setTechnicians(TECHNICIANS);
      localStorage.setItem('technicians', JSON.stringify(TECHNICIANS));
      addToast('Technicians reset to defaults from code!', 'success');
  };

  const sendReceipt = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const technician = technicians.find(t => t.id === ticket.technicianId);

    const payload = {
        ticketId: ticket.id,
        customerName: ticket.customerName,
        amountCollected: ticket.amountCollected,
        workDone: ticket.workDone,
        technicianName: technician?.name || 'Unassigned',
        date: new Date().toISOString(),
    };
    sendWebhook(
        'GENERATE_RECEIPT',
        payload,
        `[AUTOMATION] Trigger: Receipt Generated.`
    );
  };

  const markAttendance = (status: 'Clock In' | 'Clock Out') => {
      if (!user) return;
      const now = new Date();
      // Format time as "09:00 AM"
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      const attendancePayload = {
          [ATTENDANCE_SHEET_HEADERS[0]]: user.id,
          [ATTENDANCE_SHEET_HEADERS[1]]: user.name,
          [ATTENDANCE_SHEET_HEADERS[2]]: status,
          [ATTENDANCE_SHEET_HEADERS[3]]: now.toLocaleString(),
          [ATTENDANCE_SHEET_HEADERS[4]]: now.toISOString(),
          // Conditionally fill Check In or Check Out based on the action
          [ATTENDANCE_SHEET_HEADERS[5]]: status === 'Clock In' ? timeString : '', 
          [ATTENDANCE_SHEET_HEADERS[6]]: status === 'Clock Out' ? timeString : '',
      };

      sendWebhook(
          'ATTENDANCE',
          attendancePayload,
          `[AUTOMATION] Trigger: Attendance ${status} for ${user.name}`
      );
  };

  const resetAllTechnicianPoints = () => {
    if (window.confirm('Are you sure you want to reset all technician points to zero? This action cannot be undone.')) {
        const resetTechs = technicians.map(t => ({...t, points: 0}));
        setTechnicians(resetTechs);
        addToast('All technician points have been reset to 0.', 'success');
    }
  };


  const contextValue = { user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, addFeedback, uploadDamagedPart, addTechnician, updateTechnician, deleteTechnician, resetTechniciansToDefaults, sendReceipt, markAttendance, resetAllTechnicianPoints, isSyncing, syncTickets, webhookStatus, checkWebhookHealth, sendCustomWebhookPayload, lastSyncTime };

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
