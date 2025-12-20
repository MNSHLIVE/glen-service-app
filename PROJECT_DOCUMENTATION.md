
# Pandit Glen Service App - Documentation

**Version:** 4.6.3
**Cloud Sync Status:** Server-First Mode Enabled

---

## ⚡️ CRITICAL n8n SETUP (RESPOND TO WEBHOOK)

For the app to work correctly, your n8n workflow **MUST** use a "Respond to Webhook" node at the end of the `FETCH_NEW_JOBS` branch.

### The Response Format
The app expects exactly this JSON structure to stay in sync:

```json
{
  "tickets": [
    {
      "id": "PG-1234",
      "customerName": "Sanjay Gupta",
      "status": "New",
      "technicianId": "tech1",
      "complaint": "Chimney noise"
    }
  ],
  "technicians": [
    {
      "id": "tech1",
      "name": "Anil Kumar",
      "password": "123",
      "points": 450
    }
  ]
}
```

### 1. The Switch Node (Routing)
**Expression to filter on:** `{{ $json.action }}`

| Output Port | Rule Name | Operator | **Value** | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **0** | New Job | String = | `NEW_TICKET` | Create complaint |
| **1** | Add Tech | String = | `ADD_TECHNICIAN` | Add staff member |
| **2** | Remove Tech | String = | `DELETE_TECHNICIAN` | Delete staff member |
| **3** | Job Completed | String = | `JOB_COMPLETED` | Close job/Update |
| **4** | Presence | String = | `HEARTBEAT` | Update last seen |
| **5** | Attendance | String = | `ATTENDANCE` | Log Clock In/Out |
| **6** | Fetch Jobs | String = | `FETCH_NEW_JOBS` | Return jobs & staff JSON |

---

## 🟢 Troubleshooting Sync Issues
If your Laptop shows different data than your Mobile:
1.  Check that **n8n** is responding with **BOTH** the `tickets` array and the `technicians` array in the `FETCH_NEW_JOBS` branch.
2.  The app now auto-refreshes every 30 seconds. Wait 30 seconds for the cloud handshake to complete.
3.  Ensure your `STAFF_SHEET` has columns exactly in this order: `ID`, `Name`, `PIN`, `Points`.

---

## 🧪 JSON PAYLOADS FOR TESTING (Copy into n8n)

### 1. Test Add Technician
```json
{
  "action": "ADD_TECHNICIAN",
  "technician": {
    "id": "tech-manual-test",
    "name": "Rahul Test",
    "password": "999",
    "points": 0
  }
}
```

### 2. Test Remove Technician
```json
{
  "action": "DELETE_TECHNICIAN",
  "technicianId": "tech-manual-test",
  "id": "tech-manual-test"
}
```
