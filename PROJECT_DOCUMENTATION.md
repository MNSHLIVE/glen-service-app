
# Pandit Glen Service App - Documentation

**Version:** 4.6.3
**System Health Monitor:** Built-in (badge on Dashboard)

---

## ⚡️ FINAL N8N CHEAT SHEET (Copy Exact Values)

Use this table to configure your **Switch Node** and **Google Sheets Nodes**.

### Step 1: The Switch Node
**Expression to filter on:** `{{ $json.action }}`

| Path Name | Operator | **Value (Copy This)** | Description |
| :--- | :--- | :--- | :--- |
| **Add Tech** | String = | `ADD_TECHNICIAN` | Adds a new staff member |
| **Remove Tech** | String = | `REMOVE_TECHNICIAN` | Deletes a staff member |
| **New Job** | String = | `NEW_TICKET` | Creates a new complaint |
| **Update Job** | String = | `UPDATE_TICKET` | Updates status/notes |
| **Attendance** | String = | `ATTENDANCE` | Logs Clock In/Out |

---

### Step 2: The Google Sheets Nodes

#### Path 1: If value is "ADD_TECHNICIAN"
*   **Node Type:** Google Sheets
*   **Operation:** Append or Update Row
*   **Sheet:** `Staff`
*   **Mapping:**
    *   Column A (ID) -> `{{ $json.technician.id }}`
    *   Column B (Name) -> `{{ $json.technician.name }}`
    *   Column C (PIN) -> `{{ $json.technician.password }}`

#### Path 2: If value is "REMOVE_TECHNICIAN"
*   **Node Type:** Google Sheets
*   **Operation:** **Delete Row**
*   **Sheet:** `Staff`
*   **Lookup Column:** `ID`
*   **Lookup Value:** `{{ $json.technicianId }}`

---

## 🟢 How to Test (Final Verification)
1.  Open App > Admin Dashboard.
2.  Tap Version Number (v4.6.3) **5 times**.
3.  **Click [TEST] Add Staff**: A row should appear in your 'Staff' tab.
4.  **Click [TEST] Delete Staff**: That row should disappear.

If this works, your app is **100% Ready**.
