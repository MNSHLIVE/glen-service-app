
export enum UserRole {
  Admin = 'Admin',
  Technician = 'Technician',
  Controller = 'Controller',
  Developer = 'Developer',
  Coordinator = 'Coordinator',
}

export enum WebhookStatus {
  Unknown = 'Unknown',
  Checking = 'Checking',
  Connected = 'Connected',
  Error = 'Error',
  Simulating = 'Simulating',
}

export enum UrgentAlertType {
  VehicleBreakdown = 'Vehicle Breakdown',
  PaymentIssue = 'Payment/Discount Approval',
  PartUnavailable = 'Part Unavailable',
  CustomerDispute = 'Customer Dispute',
  CallMe = 'Call Me Urgently',
  Other = 'Other'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  version?: string;
}

export interface Technician {
  id: string;
  name: string;
  password?: string;
  points: number;
  lastSeen?: Date;
}

export enum TicketStatus {
  New = 'New',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum PaymentStatus {
  Cash = 'Cash',
  UPI = 'UPI',
  Pending = 'Pending',
}

export interface ServiceChecklist {
    amcDiscussion: boolean;
}

export enum PartType {
    Repair = 'Repair',
    Replacement = 'Replacement',
}

export enum PartWarrantyStatus {
    InWarranty = 'In-Warranty',
    OutOfWarranty = 'Out Of Warranty',
}

export interface ReplacedPart {
    name: string;
    price: number;
    type: PartType;
    warrantyStatus: PartWarrantyStatus;
    category: string;
    warrantyDuration: string;
}

export interface Ticket {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  complaint: string;
  technicianId: string;
  status: TicketStatus;
  createdAt: Date;
  serviceBookingDate: Date;
  preferredTime: string;
  serviceCategory: string;
  productDetails: {
      make: string;
      segment: string;
      category: string;
      subCategory: string;
      product: string;
  };
  symptoms: string[];
  serialNo?: string;
  purchaseDate?: Date;
  completedAt?: Date;
  workDone?: string;
  paymentStatus?: PaymentStatus;
  remarks?: string;
  warrantyUpdated?: boolean;
  photoUrl?: string;
  damagedPartImageUrl?: string;
  serviceChecklist?: ServiceChecklist;
  comments?: string;
  cause?: string;
  reason?: string;
  warrantyApplicable?: boolean;
  amountCollected?: number;
  partsReplaced?: ReplacedPart[];
  pointsAwarded?: boolean;
  freeService?: boolean;
  adminNotes?: string;
  isEscalated?: boolean; // New: Tracks if a job was re-opened due to dissatisfaction
}

export interface Feedback {
  id: string;
  ticketId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}
