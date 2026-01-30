import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const TechnicianView: React.FC = () => {
  const { technicians, addTechnician, deleteTechnician } = useAppContext();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', pin: '' });

  const activeTechs = technicians.filter(t => t.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Technicians</h2>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Technician
        </button>
      </div>

      {activeTechs.map(t => (
        <div key={t.id} className="p-4 bg-white shadow flex justify-between">
          <div>
            <p className="font-bold">{t.name}</p>
            <p className="text-sm text-gray-500">ID: {t.id}</p>
          </div>
          <button
            onClick={() => deleteTechnician(t.id)}
            className="text-red-600"
          >
            Delete
          </button>
        </div>
      ))}

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded space-y-3">
            <input
              className="border p-2 w-full"
              placeholder="Name"
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border p-2 w-full"
              placeholder="PIN"
              onChange={e => setForm({ ...form, pin: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button
                className="bg-blue-600 text-white px-3 py-1"
                onClick={async () => {
                  await addTechnician(form);
                  setOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianView;
