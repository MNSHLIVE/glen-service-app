// This file defines the exact headers for the two Google Sheets used in the automation workflow.

/**
 * Headers for Sheet1: The "Complaint Sheet".
 * This sheet is populated when a new ticket is created.
 */
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
];

/**
 * A sample data row corresponding to the COMPLAINT_SHEET_HEADERS.
 * This is sent during initialization to help Make.com understand the sheet structure.
 */
export const SAMPLE_COMPLAINT_DATA = [
    'SB/2025/11/DL/123456',
    new Date().toISOString(),
    new Date().toISOString(),
    '10AM-12PM',
    'Sample Customer',
    '9876543210',
    '123, Sample Lane, Sample City',
    'Chimney',
    'Unit not turning on',
    'Anil Kumar',
    'New',
];


/**
 * Headers for Sheet2: The "Technician Update Sheet".
 * This sheet is populated when a job is marked as completed.
 * It's designed as a master view, containing both original ticket info and completion details.
 */
export const UPDATE_SHEET_HEADERS = [
    // Core Ticket and Customer Info (from Sheet 1)
    'Ticket ID',
    'Created At',
    'Customer Name',
    'Phone',
    'Address',
    'Service Category',
    'Complaint',
    
    // Completion Info
    'Completed At',
    'Technician Name',
    'Work Done Summary',
    'Amount Collected',
    'Payment Status',
    'Parts Replaced (Name | Price | Warranty)',

    // Checklist Info
    'Concern Informed',
    'Replaced Parts Shown',
    'Tagging Done',
    'Site Cleaned',
    'AMC Discussion',
    'Parts Given to Customer',
    'Cash Receipt Handed',
    
    // Media Links
    'Completion Photo URL',
    'Damaged Part Image URL',
];

/**
 * A sample data row corresponding to the UPDATE_SHEET_HEADERS.
 * This is sent during initialization to help Make.com understand the sheet structure.
 */
export const SAMPLE_UPDATE_DATA = [
    'SB/2025/11/DL/123456',
    new Date().toISOString(),
    'Sample Customer',
    '9876543210',
    '123, Sample Lane, Sample City',
    'Chimney',
    'Unit not turning on',
    new Date().toISOString(),
    'Anil Kumar',
    'Cleaned the filter and reset the main circuit board.',
    '500',
    'Cash',
    'Filter Cap | 250 | 6 Months',
    'TRUE',
    'TRUE',
    'TRUE',
    'TRUE',
    'FALSE',
    'TRUE',
    'TRUE',
    'https://example.com/photo.jpg',
    'https://example.com/damaged_part.jpg',
];