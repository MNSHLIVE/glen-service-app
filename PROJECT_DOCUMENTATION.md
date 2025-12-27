
# Pandit Glen Service App - Documentation

**Version:** 4.6.3
**System Health Monitor:** Built-in (badge on Dashboard)

---

## 🧪 JSON PAYLOADS FOR TESTING (Copy into n8n)

If you are testing your n8n workflow manually (without using the app), copy these JSON blocks into the **Mock Data** section of your Webhook Node.

### 1. Test Add Technician
**Action:** Adds a new staff member to the 'Staff' tab.
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
**Action:** Deletes the staff member from the 'Staff' tab.
```json
{
  "action": "DELETE_TECHNICIAN",
  "technicianId": "tech-manual-test"
}
```

### 3. Test Attendance
**Action:** Logs a Clock-In event to the 'Attendance' tab.
```json
{
  "action": "ATTENDANCE",
  "technicianId": "tech-manual-test",
  "technicianName": "Rahul Test",
  "status": "Clock In",
  "timestamp": "2023-10-27T10:00:00.000Z"
}
```

### 4. Test Job Completed
**Action:** Completes a job (use this for "Job Updates" sheet logic).
```json
{
  "action": "JOB_COMPLETED",
  "ticket": {
     "id": "PG-9999",
     "customerName": "Test Client",
     "status": "Completed",
     "amountCollected": 500
  }
}
```

---

## ⚡️ COMPLETE N8N CONFIGURATION GUIDE

### 1. The Switch Node (Routing)
**Expression to filter on:** `{{ $json.action }}`

| Output Port | Rule Name | Operator | **Value** | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **0** | New Job | String = | `NEW_TICKET` | Create complaint |
| **1** | Add Tech | String = | `ADD_TECHNICIAN` | Add staff member |
| **2** | Remove Tech | String = | `DELETE_TECHNICIAN` | Delete staff member |
| **3** | Job Completed | String = | `JOB_COMPLETED` | Close job/Update |
| **4** | Presence | String = | `HEARTBEAT` | (Optional) Update last seen |
| **5** | Attendance | String = | `ATTENDANCE` | Log Clock In/Out |
| **6** | Fetch Jobs | String = | `FETCH_NEW_JOBS` | Return jobs JSON |

---

## 🟢 How to Test (Final Verification)
1.  Open App > Admin Dashboard.
2.  Tap Version Number (v4.6.3) **5 times** to open Diagnostics.
3.  **Click [TEST] Add Staff**: A row should appear in your 'Staff' tab.
4.  **Click [TEST] Delete Staff**: That row should disappear.

If this works, your app is **100% Ready**.
