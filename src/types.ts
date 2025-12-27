export enum UserRole {
  Admin = "Admin",
  Technician = "Technician",
  Controller = "Controller",
}


export enum TicketStatus {
  New = "New",
  InProgress = "In Progress",
  Completed = "Completed",
  Cancelled = "Cancelled",
}
export enum WebhookStatus {
  Unknown = "Unknown",
  Checking = "Checking",
  Connected = "Connected",
  Error = "Error",
}

export enum UrgentAlertType {
  Emergency = "Emergency",
  Support = "Support",
  Technical = "Technical",
}

export interface Technician {
  id: string;
  name: string;
  password: string;
  points: number;
  lastSeen?: Date;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
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
  serviceBookingDate?: Date;
  preferredTime?: string;
  serviceCategory?: string;
  comments?: string;
  adminNotes?: string;
  isEscalated?: boolean;
}
