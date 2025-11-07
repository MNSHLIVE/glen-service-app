export enum UserRole {
  Admin = 'Admin',
  Technician = 'Technician',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Technician {
  id: string;
  name: string;
  password?: string; // For mock login
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
    concernInformed: boolean;
    replacedPartsShown: boolean;
    taggingDone: boolean;
    siteCleaned: boolean;
    amcDiscussion: boolean;
    partsGivenToCustomer: boolean;
    cashReceiptHanded: boolean;
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
  photoUrl?: string; // base64 data URL for job completion proof
  damagedPartImageUrl?: string; // URL link to image in Google Drive
  serviceChecklist?: ServiceChecklist;
  comments?: string;
  cause?: string;
  reason?: string;
  warrantyApplicable?: boolean;
  amountCollected?: number;
  partsReplaced?: ReplacedPart[];
}

export interface Feedback {
  id: string;
  ticketId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}