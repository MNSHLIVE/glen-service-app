import React from 'react';
import { useAppContext } from '../context/AppContext';

const TechnicianList: React.FC = () => {
  const { technicians } = useAppContext();

  if (!technicians || technicians.length === 0) {
    return <p className="text-sm text-gray-500">No technicians added</p>;
  }

  return (
    <div className="space-y-3">
      {technicians.map((tech) => {
        const pin = tech.id.slice(-4); // 🔑 PIN

        return (
          <div
            key={tech.id}
            className="flex justify-between items-center p-3 border rounded-lg bg-white"
          >
            <div>
              <div className="font-semibold">{tech.name}</div>
              <div className="text-xs text-gray-500">
                ID: {tech.id}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-400">Login PIN</div>
              <div className="text-lg font-bold text-blue-600">
                {pin}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TechnicianList;
