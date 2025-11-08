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
 * Headers for Sheet2: The "Technician Update Sheet".
 * This sheet is populated when a job is marked as completed.
 */
export const UPDATE_SHEET_HEADERS = [
    'Ticket ID',
    'Completed At',
    'Technician Name',
    'Work Done Summary',
    'Amount Collected',
    'Payment Status',
    'Parts Replaced (Name | Price | Warranty)',
    'Concern Informed',
    'Replaced Parts Shown',
    'Tagging Done',
    'Site Cleaned',
    'AMC Discussion',
    'Parts Given to Customer',
    'Cash Receipt Handed',
    'Completion Photo URL',
    'Damaged Part Image URL',
];
