import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// Fix: Import PartType and PartWarrantyStatus to correctly type the mock data.
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus, ReplacedPart, PartType, PartWarrantyStatus } from '../types';
import { TECHNICIANS } from '../constants';
import { useToast } from './ToastContext';
import { COMPLAINT_SHEET_HEADERS, UPDATE_SHEET_HEADERS } from '../data/sheetHeaders';

interface AppContextType {
  user: User | null;
  tickets: Ticket[];
  technicians: Technician[];
  feedback: Feedback[];
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Pre-populated ticket for testing purposes as per user request
const initialTickets: Ticket[] = [
  {
    id: `SB/2025/11/DL/1291020`,
    customerName: 'Dr. Vargis',
    phone: '9876543210',
    address: 'Flat no 234, Shardha apartment, Green park',
    complaint: 'Chimney repair. To be attended tomorrow at 11 am.',
    technicianId: 'tech1', // Anil Kumar's ID
    status: TicketStatus.New,
    createdAt: new Date('2025-11-01T09:00:00Z'),
    serviceBookingDate: new Date('2025-11-02'),
    preferredTime: '10AM-12PM',
    serviceCategory: 'Chimney',
    productDetails: { make: 'Glen', segment: 'Kitchen Appliances', category: 'Chimney', subCategory: 'Wall Mounted', product: 'CH6050SXTS' },
    symptoms: ['not starting', 'making noise'],
  },
  {
    id: `SB/2025/11/DL/1291021`,
    customerName: 'Meera Singh',
    phone: '9821123456',
    address: '12B, Karol Bagh, New Delhi',
    complaint: 'Cooktop burner not working',
    technicianId: 'tech2', // Sunil Sharma's ID
    status: TicketStatus.InProgress,
    createdAt: new Date('2025-11-01T11:30:00Z'),
    serviceBookingDate: new Date('2025-11-01'),
    preferredTime: '02PM-04PM',
    serviceCategory: 'Cook top',
    productDetails: { make: 'Glen', segment: 'Large appliances', category: 'Cook top', subCategory: 'Cooktop Glass', product: 'GI 1038 gt fb dd black' },
    symptoms: ['burner-problem'],
  },
   {
    id: `SB/2025/11/DL/1291022`,
    customerName: 'Amit Patel',
    phone: '8876543210',
    address: 'C-45, Lajpat Nagar, New Delhi',
    complaint: 'Electric kettle not heating',
    technicianId: 'tech3', // Rajesh Verma's ID
    status: TicketStatus.Completed,
    createdAt: new Date('2025-10-30T14:00:00Z'),
    completedAt: new Date('2025-10-31T12:00:00Z'),
    serviceBookingDate: new Date('2025-10-31'),
    preferredTime: '10AM-12PM',
    serviceCategory: 'Electric kettle',
    productDetails: { make: 'Glen', segment: 'Small Appliances', category: 'Kettle', subCategory: 'Electric', product: 'SA-5010' },
    symptoms: ['no heating'],
    workDone: 'Replaced heating element and tested.',
    paymentStatus: PaymentStatus.UPI,
    cause: 'Faulty heating element due to scaling.',
    reason: 'Element was beyond repair and required replacement.',
    warrantyApplicable: false,
    amountCollected: 1200,
    pointsAwarded: true, // Assuming points were already given for this old completed job
    // Fix: Corrected the ReplacedPart object to match the interface definition.
    // Renamed 'warranty' to 'warrantyDuration' and added missing properties.
    partsReplaced: [{
        name: 'Heating Coil',
        price: 800,
        type: PartType.Replacement,
        warrantyStatus: PartWarrantyStatus.OutOfWarranty,
        category: 'Small Appliances',
        warrantyDuration: '6 Months'
    }]
  }
];

const initialFeedback: Feedback[] = [
    {
        id: 'FB-1',
        ticketId: 'SB/2025/11/DL/1291022', // Rajesh's completed job
        rating: 4,
        comment: 'Rajesh has done excellent work he was clean shaved and humble in answering all questions etc.',
        createdAt: new Date('2025-10-31T18:00:00Z'),
    }
]

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);
  const { addToast } = useToast();

  useEffect(() => {
    const savedTechs = localStorage.getItem('technicians');
    if (savedTechs) {
      setTechnicians(JSON.parse(savedTechs));
    } else {
      setTechnicians(TECHNICIANS);
      localStorage.setItem('technicians', JSON.stringify(TECHNICIANS));
    }
  }, []);

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
                  console.error(`[AUTOMATION] Failed to send data to webhook for action ${action}. Status: ${response.status}`);
                  addToast(`Webhook error for "${actionName}". Status: ${response.status}`, 'error');
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
  const logout = () => setUser(null);

  const addTicket = (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'serviceBookingDate'>) => {
    const newTicket: Ticket = {
        ...ticketData,
        id: `SB/${new Date().getFullYear()}/${new Date().getMonth()+1}/DL/${Math.floor(Math.random() * 900000) + 100000}`,
        status: TicketStatus.New,
        createdAt: new Date(),
        serviceBookingDate: new Date(), // Default to today, can be changed
    }
    setTickets(prev => [newTicket, ...prev]);
    const technician = technicians.find(t => t.id === newTicket.technicianId);
    
    // Payload for the COMPLAINT_SHEET
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

    // If the job is completed, award points and send a payload for the UPDATE_SHEET
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
            updatedTicket.pointsAwarded = true; // Mark points as awarded
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t)); // Save the flag change
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


  const contextValue = { user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, addFeedback, uploadDamagedPart, addTechnician, updateTechnician, deleteTechnician, sendReceipt, initializeSheets, resetAllTechnicianPoints };

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