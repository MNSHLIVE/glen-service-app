
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

Use this table to configure your **Switch Node** and **Google Sheets Nodes** correctly.

### 1. The Switch Node
**Expression to filter on:** `{{ $json.action }}`

| Path Name | Operator | **Value** | Description |
| :--- | :--- | :--- | :--- |
| **Add Tech** | String = | `ADD_TECHNICIAN` | Adds a new staff member |
| **Remove Tech** | String = | `REMOVE_TECHNICIAN` | Deletes a staff member |
| **New Job** | String = | `NEW_TICKET` | Creates a new complaint |
| **Update Job** | String = | `UPDATE_TICKET` | Updates status/notes |
| **Attendance** | String = | `ATTENDANCE` | Logs Clock In/Out |

---

### 2. The Google Sheets Nodes (The Actions)

#### Path 1: "Add Tech" (ADD_TECHNICIAN)
*   **Node Type:** Google Sheets
*   **Operation:** **Append Row** (or Update if exists)
*   **Sheet Name:** `Staff`
*   **Mapping:**
    *   Column A (ID) -> `{{ $json.technician.id }}`
    *   Column B (Name) -> `{{ $json.technician.name }}`
    *   Column C (PIN) -> `{{ $json.technician.password }}`

#### Path 2: "Remove Tech" (REMOVE_TECHNICIAN)
*   **Node Type:** Google Sheets
*   **Operation:** **Delete Row**
*   **Sheet Name:** `Staff`
*   **Lookup Column:** `ID` (Column A)
*   **Lookup Value:** `{{ $json.technicianId }}`
    *   *Note: Ensure you select the 'ID' column correctly in the dropdown.*

---

## 🟢 How to Test (Final Verification)
1.  Open App > Admin Dashboard.
2.  Tap Version Number (v4.6.3) **5 times** to open Diagnostics.
3.  **Click [TEST] Add Staff**: A row should appear in your 'Staff' tab.
4.  **Click [TEST] Delete Staff**: That row should disappear.

If this works, your app is **100% Ready**.
