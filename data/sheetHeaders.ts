
// IMPORTANT: The order of these headers must exactly match the order of columns in your Google Sheets.
// Headers are in snake_case format to match Google Sheets and N8N requirements.

// Tab 1: "Complaints"
export const COMPLAINTS_SHEET_HEADERS = [
  'ticket_id',
  'created_at',
  'service_booking_date',
  'preferred_time',
  'customer_name',
  'phone',
  'address',
  'service_category',
  'complaint',
  'assigned_technician',
  'status',
  'reopen_count',
  'revised_at',
  'revised_reason',
  'updated_at'
];

// Tab 2: "Job Updates"
export const TECHNICIAN_UPDATE_HEADERS = [
  'ticket_id',
  'completed_at',
  'technician_name',
  'work_done_summary',
  'amount_collected',
  'payment_status',
  'points_awarded',
  'parts_replaced',
  'amc_discussion',
  'free_service'
];

// Tab 3: "Attendance"
export const ATTENDANCE_SHEET_HEADERS = [
  'technician_id',
  'technician_name',
  'attendance_status',
  'timestamp',
  'check_in',
  'check_out'
];

// Tab 4: "Presence" (Tracking heartbeats for Green Dot)
export const PRESENCE_SHEET_HEADERS = [
  'technician_id',    // Col A
  'technician_name',  // Col B
  'app_version',      // Col C
  'last_seen'         // Col D (Timestamp ISO)
];

// Tab 5: "Staff" (For syncing Technicians across devices)
export const STAFF_SHEET_HEADERS = [
  'technician_id',     // Col A (e.g., tech1715000)
  'technician_name',   // Col B (e.g., Rahul Verma)
  'pin',               // Col C (e.g., 1234)
  'points',            // Col D (e.g., 150)
  'status',            // Col E (active/inactive)
  'created_at',        // Col F (timestamp)
  'deleted_at',        // Col G (timestamp, nullable)
  'app_version',       // Col H (version string)
  'last_seen'          // Col I (timestamp)
];
