import React from 'react';
import { useAppContext } from '../context/AppContext';
import ViewJobs from './ViewJobs';

interface CoordinatorDashboardProps {
    onViewTicket: (ticketId: string) => void;
}

const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ onViewTicket }) => {
  const { user, logout } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
          <p className="text-sm text-gray-500">Coordinator Dashboard</p>
        </div>
        <button onClick={logout} className="text-sm bg-glen-red text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
          Logout
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md min-h-[400px]">
        <ViewJobs onViewTicket={onViewTicket} />
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
