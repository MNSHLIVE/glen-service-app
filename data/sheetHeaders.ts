
// IMPORTANT: The order of these headers must exactly match the order of columns in your Google Sheets.

// Headers for Sheet 1: The sheet where new complaints are initially logged.
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
  'Admin Notes' // New Column
];

// Headers for Sheet 2: The master sheet where completed job details are logged.
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

// Headers for Sheet 3: Attendance Logging
// UPDATED: Strictly matching the user's screenshot headers (No TimestampISO)
export const ATTENDANCE_SHEET_HEADERS = [
  'TechnicianId',      // Matches Col A
  'Technician Name',   // Matches Col B
  'AttendanceStatus',  // Matches Col C
  'Timestamp',         // Matches Col D
  'CheckIn',           // Matches Col E
  'CheckOut'           // Matches Col F
];
