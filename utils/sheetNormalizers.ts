export function normalizeTechnicianFromSheet(row: any) {
  if (!row) return null;

  const id = String(row.technician_id || '').trim();
  if (!id) return null; // 🚫 reject corrupted rows

  return {
    id,
    name: String(row.technician_name || '').trim() || '(Unnamed)',
    pin: String(row.pin || ''),
    phone: String(row.phone || ''),
    role: row.role || 'Technician',
    vehicleNumber: row.vehicleNumber || '',
    status: row.status || 'ACTIVE',
    points: Number(row.points || 0),
  };
}
normalizeTicketRow(row)
normalizeAttendanceRow(row)
normalizeCompletedJobRow(row)
