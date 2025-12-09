
# Pandit Glen Service App - Documentation

**Version:** 4.6.3
**System Health Monitor:** Built-in (badge on Dashboard)

---

## 🚀 How Data is Handled
### 1. Local Memory (Speed)
When you add a technician or fill a ticket, the app saves it **locally** on your phone instantly. This means you don't have to wait for the internet for basic operations.
*   **Technician Save:** When you click "Save Technician," they are stored in YOUR local list. To sync them with Google Sheets, n8n reads their login activity (Heartbeat).

### 2. "Refresh Server Data" Button
Google Sheets is your "Main Database." Sometimes technicians fill reports, or you manually type data into the Sheet on your PC. 
*   **Sync Logic:** Clicking "Refresh Server Data" forces the app to talk to n8n to fetch the absolute latest status from the Sheet. It updates technicians' online status and checks for new assignment tickets created by n8n.

---

## 🟢 Real-Time Presence ("Green Dot")
The pulsing green dot is **Real-Time**. 
*   **How it works:** Every 2 minutes, the technician's phone sends a "Heartbeat" (a secret ping) to the Hostinger server.
*   **Admin View:** Your dashboard checks these pings. If a ping was received in the last 5 minutes, the dot pulses green. If the tech closes the app, the dot turns gray automatically.

---

## 📂 Sheet Requirements (Maintenance)
**Tab 4:** `Presence`
**Headers (Row 1):** `Technician ID`, `Technician Name`, `App Version`, `Last Seen`
*Ensure your n8n workflow updates this tab whenever it receives an action: "HEARTBEAT".*
