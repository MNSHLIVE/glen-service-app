import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

/* ================= ADD MODAL ================= */

const AddTechnicianModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addTechnician } = useAppContext();

  const [form, setForm] = useState({
    name: '',
    pin: '',
    phone: '',
    vehicleNumber: '',
  });

  const submit = async () => {
    if (!form.name || !form.pin) {
      alert('Name and PIN are required');
      return;
    }

    await addTechnician(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-80 space-y-4">
        <h3 className="font-bold text-lg">Add Technician</h3>

        <input
          className="border p-2 w-full"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="PIN"
          value={form.pin}
          onChange={e => setForm({ ...form, pin: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Phone"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Vehicle Number"
          value={form.vehicleNumber}
          onChange={e =>
            setForm({ ...form, vehicleNumber: e.target.value })
          }
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN ================= */

const Technicians: React.FC = () => {
  const { technicians, deleteTechnician } = useAppContext();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Technicians</h2>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Technician
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white rounded shadow divide-y">
        {technicians.length === 0 && (
          <p className="p-4 text-gray-500">No active technicians</p>
        )}

        {technicians.map((tech: any) => (
          <div
            key={tech.id}
            className="p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{tech.name}</p>
              <p className="text-sm text-gray-500">
                ID: {tech.id} | PIN: {tech.pin}
              </p>
            </div>

            <button
              onClick={() => deleteTechnician(tech.id)}
              className="text-red-600 font-bold"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {isAddOpen && <AddTechnicianModal onClose={() => setIsAddOpen(false)} />}
    </div>
  );
};

export default Technicians;
