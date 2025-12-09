
# Pandit Glen Service App - Documentation

**Version:** 4.6.3
**System Health Monitor:** Built-in

---

## 🚀 Data Flow: How it works
1. **Adding Technicians:** When you add a technician in Settings, they are saved locally to YOUR app. When that technician logs in on their phone, the app sends a `HEARTBEAT` to n8n, which records them as "Active" in the `Presence` tab of your sheet.
2. **Deleting Technicians:** Deleting in-app removes them from the staff list. They will no longer show up in job assignments.
3. **Heartbeat:** Every 2 minutes, technicians "ping" n8n. This updates the Green Dot in your Admin view.

---

## 🛠️ Troubleshooting (Admin Checklist)
* **No Green Dot?** 
   1. Check if technician has v4.6.3 open.
   2. Ensure n8n is running. Click the **"Live Status"** badge on your header to force a connection test.
* **Blank Screen on mobile?** 
   Update Chrome/Safari to the latest version. Modern apps require modern browser engines.
* **Sync Issue?** 
   Open the **Diagnostic Terminal** by tapping the version number 5 times. It will verify your internet reachability to the Hostinger server.

---

## 📂 Sheet Requirements
**New Tab:** `Presence`
**Columns:** `Technician ID`, `Technician Name`, `App Version`, `Last Seen`
*Ensure Row 1 contains these headers exactly.*
