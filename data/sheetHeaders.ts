
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
  'Status'
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
export const ATTENDANCE_SHEET_HEADERS = [
  'Technician ID',
  'Technician Name',
  'Attendance Status',
  'Timestamp',
  'Timestamp ISO',
  'Check In Time',
  'Check Out Time'
];
