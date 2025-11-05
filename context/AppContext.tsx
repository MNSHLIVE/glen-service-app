import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Ticket, Feedback, Technician, TicketStatus, PaymentStatus } from '../types';
import { TECHNICIANS } from '../constants';

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

// Helper function to send data to a single master webhook
const sendWebhook = async (action: string, payload: object, defaultLogMessage: string) => {
    const webhookUrl = localStorage.getItem('masterWebhookUrl');
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
            } else {
                console.error(`[AUTOMATION] Failed to send data to webhook for action ${action}. Status: ${response.status}`);
            }
        } catch (error)
 {
            console.error(`[AUTOMATION] Error sending data to webhook for action ${action}:`, error);
        }
    } else {
        console.log(defaultLogMessage);
    }
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [technicians] = useState<Technician[]>(TECHNICIANS);
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback);

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
    sendWebhook(
        'NEW_TICKET', 
        newTicket,
        `[AUTOMATION] Trigger: New Ticket Created. Sending data to Make.com... (Master Webhook not configured)`
    );
  };

  const updateTicket = (updatedTicket: Ticket) => {
    const originalTicket = tickets.find(t => t.id === updatedTicket.id);
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    
    // Send a general update for any change
    sendWebhook(
        'TICKET_UPDATED',
        updatedTicket,
        `[AUTOMATION] Trigger: Ticket Updated. Sending data to Make.com... (Master Webhook not configured)`
    );

    // Also send a specific event if the job was just completed
    if (originalTicket?.status !== TicketStatus.Completed && updatedTicket.status === TicketStatus.Completed) {
        sendWebhook(
            'JOB_COMPLETED',
            updatedTicket,
            `[AUTOMATION] Trigger: Job Completed. Sending data to Make.com... (Master Webhook not configured)`
        );
    }
  };

  const uploadDamagedPart = (ticketId: string, imageData: string) => {
    const payload = { ticketId, imageData, timestamp: new Date().toISOString() };
    sendWebhook(
        'DAMAGED_PART_UPLOADED',
        payload,
        `[AUTOMATION] Trigger: Damaged Part Image Uploaded for Ticket ${ticketId}. (Master Webhook not configured)`
    );
    
    // This part remains a simulation as the app cannot receive the URL back from Make.com
    // In a real app, you might poll for an update or use websockets.
    const fakeGoogleDriveUrl = `https://docs.google.com/a-fake-link-to-image/${ticketId}-${Date.now()}.jpg`;
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, damagedPartImageUrl: fakeGoogleDriveUrl } : t
    ));

    alert('Damaged part photo has been sent to the automation workflow.');
  };
  
  const addFeedback = (feedbackItem: Feedback) => {
    setFeedback(prev => [feedbackItem, ...prev]);
    sendWebhook(
        'NEW_FEEDBACK',
        feedbackItem,
        `[AUTOMATION] Trigger: New Feedback Received. Sending data to Make.com... (Master Webhook not configured)`
    );
  };

  const contextValue = { user, tickets, technicians, feedback, login, logout, addTicket, updateTicket, addFeedback, uploadDamagedPart };

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