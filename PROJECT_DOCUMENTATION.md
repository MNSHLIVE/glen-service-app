# Pandit Glen Service App - Project Documentation

**Version:** 3.3
**Date:** May 20, 2025
**Type:** Progressive Web Application (PWA) & Automation System

---

## 1. Project Overview
The **Pandit Glen Service App** is a specialized field service management tool designed to digitize the operations of a service center. It replaces manual WhatsApp coordination and paper logs with a centralized digital system.

The system connects three key pillars:
1.  **The Mobile App:** For Technicians and Admins to view/update jobs.
2.  **Google Sheets:** Acts as the database for easy reporting and data ownership.
3.  **n8n Automation:** The "Brain" that moves data between the App and Sheets instantly.

---

## 2. Key Features by Role

### 👨‍💼 Admin / Developer
*   **Secure Login:** Username/Password protected dashboard (`admin` / `dev`).
*   **Job Creation:**
    *   **Manual Entry:** Standard form.
    *   **Intelligent AI Parsing:** Paste a rough WhatsApp message or upload a photo of a ticket, and AI extracts the Name, Address, and Complaint automatically.
*   **Live Dashboard:** View all jobs, filter by status (New, In Progress, Completed).
*   **Performance Analytics:** Real-time charts showing daily revenue, jobs completed per tech, and leaderboards.
*   **Settings Control:** Configure Automation URLs and manage Technician users/PINs directly from the app.

### 🛠️ Technician
*   **Fast Login:** 3-Digit PIN access for quick entry in the field.
*   **My Jobs View:** Only sees jobs assigned to them.
*   **One-Tap Actions:**
    *   Call Customer (opens dialer).
    *   WhatsApp Customer (opens chat).
    *   Map Navigation (via address).
*   **Job Completion:**
    *   Log "Work Done".
    *   Record Parts Replaced (with warranty status).
    *   Calculate Total Amount.
    *   **Digital Receipt:** Generates and sends a receipt summary.
*   **Attendance:** "Clock In" and "Clock Out" with one tap (Geolocation ready).
*   **Gamification:** Earn points for every completed job to appear on the leaderboard.

---

## 3. Automation Logic (The "Brain")

The app sends data to **n8n** via Webhooks. The **Switch Node** in n8n routes data based on the `action` keyword.

| Action | Trigger Point | Result in Google Sheet |
| :--- | :--- | :--- |
| **NEW_TICKET** | Admin creates a job | Adds row to **Sheet 1 (Complaints)** |
| **JOB_COMPLETED** | Tech finishes a job | Adds row to **Sheet 2 (Completed Jobs)** with revenue & parts |
| **ATTENDANCE** | Tech taps Clock In/Out | Adds row to **Sheet 3 (Attendance)** with Timestamp & Tech ID |
| **FETCH_NEW_JOBS** | App loads/refreshes | Reads **Sheet 1**, converts to JSON, sends to App |

---

## 4. Safety & Maintenance Checklist (For Admin)

To keep this application running smoothly for the next 6+ months, perform these tasks:

### 🔴 Critical Precautions (Do NOT Do This)
1.  **Do NOT Change Sheet Headers:** The automation relies on exact column names (e.g., "TechnicianId", "TimestampISO"). If you rename a column in Google Sheets, the connection will break.
2.  **Do NOT Share Admin Password:** The Admin login has the power to delete technicians and change system URLs.
3.  **Do NOT Delete "Hidden" Columns:** Columns like `TimestampISO` or `TechnicianId` might look ugly, but they are required for the computer to sort dates and identify staff. Hide them, don't delete them.

### 🟢 Routine Tasks
1.  **Technician Management:**
    *   If a technician leaves, delete them from the "Settings > Technicians" menu immediately.
    *   If a new technician joins, add them via Settings. Give them a unique 3-digit PIN.
2.  **Data Backup:**
    *   Google Sheets saves automatically, but once a month, go to `File > Download > Microsoft Excel` to save a backup on your computer.
3.  **App Updates:**
    *   If you need a new feature, contact the Developer. The update will happen automatically on everyone's phones (no download needed).

---

## 5. Technical Specifications

*   **Frontend:** React 19, TypeScript, Tailwind CSS.
*   **Build Tool:** Vite.
*   **AI Integration:** Google Gemini 2.5 Flash (for parsing text/images).
*   **Hosting:** Vercel (Cloud Edge Network).
*   **Database:** LocalStorage (Device) + Google Sheets (Cloud).
*   **PWA:** Service Workers enabled for offline caching and "Add to Home Screen" capability.
