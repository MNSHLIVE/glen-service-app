
import { Technician, Ticket, TicketStatus, UserRole } from './types';

export const TECHNICIANS: Technician[] = [
  { id: 'tech1', name: 'Anil Kumar', password: '123', points: 450, lastSeen: new Date() },
  { id: 'tech2', name: 'Sunil Sharma', password: '124', points: 120 },
  { id: 'tech3', name: 'Rajesh Verma', password: '125', points: 890, lastSeen: new Date() },
  { id: 'tech-test', name: 'Test Technician', password: '000', points: 0 },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'PG-9842',
    customerName: 'Sanjay Gupta',
    phone: '9810023456',
    address: 'Flat 402, Lotus Towers, New Delhi',
    complaint: 'Chimney motor making heavy noise and vibrating.',
    technicianId: 'tech1',
    status: TicketStatus.New,
    createdAt: new Date(),
    serviceBookingDate: new Date(),
    preferredTime: '10AM-12PM',
    serviceCategory: 'Chimney',
    productDetails: { make: 'Glen', segment: '', category: 'Chimney', subCategory: '', product: '' },
    symptoms: ['Noise'],
    adminNotes: 'Client requested senior tech only.'
  },
  {
    id: 'PG-9845',
    customerName: 'Meera Kapoor',
    phone: '9876543210',
    address: 'B-12, Green Park, South Delhi',
    complaint: 'Hob ignition not working, gas smell coming.',
    technicianId: 'tech3',
    status: TicketStatus.InProgress,
    createdAt: new Date(Date.now() - 3600000),
    serviceBookingDate: new Date(),
    preferredTime: '03PM-06PM',
    serviceCategory: 'Hob',
    productDetails: { make: 'Glen', segment: '', category: 'Hob', subCategory: '', product: '' },
    symptoms: ['Ignition issue']
  },
  {
    id: 'PG-9841',
    customerName: 'Rahul Verma',
    phone: '9911223344',
    address: 'Sector 45, Gurgaon',
    complaint: 'Kettle not heating up.',
    technicianId: 'tech2',
    status: TicketStatus.Completed,
    createdAt: new Date(Date.now() - 86400000),
    serviceBookingDate: new Date(Date.now() - 86400000),
    preferredTime: '12PM-03PM',
    serviceCategory: 'Electric kettle',
    productDetails: { make: 'Glen', segment: '', category: 'Electric kettle', subCategory: '', product: '' },
    symptoms: ['No heat'],
    completedAt: new Date(),
    workDone: 'Heating element replaced.',
    amountCollected: 450,
    paymentStatus: undefined // Handled in Reports payment logic
  }
];
