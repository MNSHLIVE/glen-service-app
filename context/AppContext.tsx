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
    console.log(`[AUTOMATION] Trigger: New Ticket Created. Sending data to Make.com to update Google Sheet and notify technician...`);
    // In a real app, you would use fetch() to send this data to a Make.com webhook.
  };

  const updateTicket = (updatedTicket: Ticket) => {
    const originalTicket = tickets.find(t => t.id === updatedTicket.id);
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    
    if (originalTicket?.status !== TicketStatus.Completed && updatedTicket.status === TicketStatus.Completed) {
        console.log(`[AUTOMATION] Trigger: Job Completed. Sending data to Make.com to update Google Sheet and send feedback WhatsApp...`);
    }
  };

  const uploadDamagedPart = (ticketId: string, imageData: string) => {
    // This function simulates the process of uploading to a backend.
    console.log(`[AUTOMATION] Trigger: Damaged Part Image Uploaded for Ticket ${ticketId}.`);
    console.log(`[AUTOMATION] Sending image data to Make.com webhook...`);
    
    // In a real scenario:
    // 1. Make.com receives this data.
    // 2. It uploads the image to Google Drive.
    // 3. It gets back a shareable URL.
    // 4. It updates the Google Sheet row for this ticketId with the new URL.
    
    // For now, we'll simulate this by adding a fake URL to the ticket in our local state.
    const fakeGoogleDriveUrl = `https://docs.google.com/a-fake-link-to-image/${ticketId}-${Date.now()}.jpg`;
    
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, damagedPartImageUrl: fakeGoogleDriveUrl } : t
    ));

    alert('Damaged part photo has been uploaded and a request sent to admin.');
  };
  
  const addFeedback = (feedbackItem: Feedback) => {
    setFeedback(prev => [feedbackItem, ...prev]);
     console.log(`[AUTOMATION] Trigger: New Feedback Received. Sending data to Make.com to update Google Sheet and notify admin...`);
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