
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
  "action": "REMOVE_TECHNICIAN",
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

---

## ⚡️ COMPLETE N8N CONFIGURATION GUIDE

### 1. The Switch Node (Routing)
**Expression to filter on:** `{{ $json.action }}`

| Output Port | Rule Name | Operator | **Value** | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **0** | New Job | String = | `NEW_TICKET` | Create complaint |
| **1** | Add Tech | String = | `ADD_TECHNICIAN` | Add staff member |
| **2** | Remove Tech | String = | `REMOVE_TECHNICIAN` | Delete staff member |
| **3** | Update Job | String = | `UPDATE_TICKET` | Close job/Update |
| **4** | Presence | String = | `HEARTBEAT` | (Optional) Update last seen |
| **5** | Attendance | String = | `ATTENDANCE` | Log Clock In/Out |

---

### 2. The Google Sheets Nodes (Wiring)

**🚫 Do not use "Get Row" unless necessary.** The simplest, most robust wiring is:

#### Path 0: "New Job"
*   **Connects to:** Google Sheet Node A
*   **Operation:** Append Row
*   **Sheet:** `Complaints`

#### Path 1: "Add Tech" (The missing link)
*   **Connects to:** Google Sheet Node B (Create a new one if needed)
*   **Operation:** **Append Row**
*   **Sheet:** `Staff`
*   **Mapping:**
    *   `ID` -> `{{ $json.technician.id }}`
    *   `Name` -> `{{ $json.technician.name }}`
    *   `PIN` -> `{{ $json.technician.password }}`

#### Path 2: "Remove Tech" (The broken link)
*   **Connects to:** Google Sheet Node C (Create a new one if needed)
*   **Operation:** **Delete Row**
*   **Sheet:** `Staff`
*   **Mode:** **Lookup** (Use the dropdown to select Lookup, NOT Row Number)
*   **Lookup Column:** `ID` (Column A)
*   **Lookup Value:** `{{ $json.technicianId }}`

#### Path 3: "Update Job"
*   **Connects to:** Google Sheet Node D
*   **Operation:** Append Row
*   **Sheet:** `Job Updates`

#### Path 5: "Attendance"
*   **Connects to:** Google Sheet Node E
*   **Operation:** Append Row
*   **Sheet:** `Attendance`
*   **Mapping:**
    *   `TechnicianId` -> `{{ $json.technicianId }}`
    *   `Status` -> `{{ $json.status }}`
    *   `Timestamp` -> `{{ $json.timestamp }}`

---

## 🟢 How to Test (Final Verification)
1.  Open App > Admin Dashboard.
2.  Tap Version Number (v4.6.3) **5 times** to open Diagnostics.
3.  **Click [TEST] Add Staff**: A row should appear in your 'Staff' tab.
4.  **Click [TEST] Delete Staff**: That row should disappear.

If this works, your app is **100% Ready**.
