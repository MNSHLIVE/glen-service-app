
// IMPORTANT: The order of these headers must exactly match the order of columns in your Google Sheets.

// Tab 1: "Complaints"
export const COMPLAINT_SHEET_HEADERS = [
  'Ticket ID',
  'Created At',
  'Service Booking Date',
  'Preferred Time',
  'Customer Name',
  'Phone',
  'Address',
  'Service Category',
  'Complaint',
  'Assigned Technician',
  'Status',
  'Admin Notes'
];

// Tab 2: "Job Updates"
export const TECHNICIAN_UPDATE_HEADERS = [
  'Ticket ID',
  'Created At',
  'Service Booking Date',
  'Preferred Time',
  'Customer Name',
  'Phone',
  'Address',
  'Service Category',
  'Complaint',
  'Completed At',
  'Technician Name',
  'Work Done Summary',
  'Amount Collected',
  'Payment Status',
  'Points Awarded',
  'Parts Replaced (Name | Price | Warranty)',
  'AMC Discussion',
  'Free Service'
];

// Tab 3: "Attendance"
export const ATTENDANCE_SHEET_HEADERS = [
  'TechnicianId',
  'Technician Name',
  'AttendanceStatus',
  'Timestamp'
];

// Tab 4: "Presence" (Tracking heartbeats for Green Dot)
export const PRESENCE_SHEET_HEADERS = [
  'Technician ID',    // Col A
  'Technician Name',  // Col B
  'App Version',      // Col C
  'Last Seen'         // Col D (Timestamp ISO)
];
