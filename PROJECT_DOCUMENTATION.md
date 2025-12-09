
# Pandit Glen Service App - Documentation

**Version:** 4.6.3
**System Health Monitor:** Built-in

---

## 🚀 Data Flow: How it works
1. **Adding Technicians:** When you add a technician in Settings, they are saved locally to YOUR app. When that technician logs in on their phone, the app sends a `HEARTBEAT` to n8n, which records them as "Active" in the `Presence` tab of your sheet.
2. **Heartbeat:** Every 2 minutes, technicians "ping" n8n. This updates the Green Dot in your Admin view.

---

## 🧪 How to Test with Multiple Technicians
You don't need 10 phones to test the app! You can simulate a team of 10 from one laptop:
1. **Incognito Tabs:** Open Chrome and press `Ctrl+Shift+N`. Every Incognito window acts like a brand-new phone.
2. **Chrome Profiles:** Use the "Profile" icon in the top-right of Chrome to "Add" a person. Each profile has its own memory, allowing you to stay logged in as Tech 1, Tech 2, and Tech 3 simultaneously.
3. **Simulation Controls:** Use the **Diagnostic Terminal** (tap version 5 times) to trigger mock data rows to confirm n8n is processing Attendance and Jobs correctly without entering real customer data.

---

## 📂 Sheet Requirements
**New Tab:** `Presence`
**Columns:** `Technician ID`, `Technician Name`, `App Version`, `Last Seen`
*Ensure Row 1 contains these headers exactly.*
