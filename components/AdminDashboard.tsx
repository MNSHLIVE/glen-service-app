
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import AddTicketModal from './AddTicketModal';
import ViewJobs from './ViewJobs';
import TechnicianRatings from './TechnicianRatings';

interface AdminDashboardProps {
    onViewTicket: (ticketId: string) => void;
}

type AdminView = 'jobs' | 'ratings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewTicket }) => {
  const { user, logout } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>('jobs');

  const navButtonClasses = (view: AdminView) =>
    `flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-300 ${
      activeView === view
        ? 'bg-glen-blue text-white rounded-lg shadow'
        : 'text-gray-600 hover:bg-glen-light-blue rounded-lg'
    }`;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        <button onClick={logout} className="text-sm bg-glen-red text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
          Logout
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
         <button onClick={() => setIsModalOpen(true)} className="w-full bg-glen-blue text-white font-bold py-4 px-4 rounded-lg hover:bg-blue-600 transition-colors text-lg flex items-center justify-center space-x-2">
            <PlusIcon/>
            <span>Add New Ticket</span>
         </button>
      </div>

      <div className="bg-white p-2 rounded-lg shadow-md">
        <nav className="flex space-x-2">
          <button onClick={() => setActiveView('jobs')} className={navButtonClasses('jobs')}>
            View Jobs
          </button>
          <button onClick={() => setActiveView('ratings')} className={navButtonClasses('ratings')}>
            Technician Ratings
          </button>
        </nav>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md min-h-[400px]">
        {activeView === 'jobs' && <ViewJobs onViewTicket={onViewTicket} />}
        {activeView === 'ratings' && <TechnicianRatings />}
      </div>

      {isModalOpen && <AddTicketModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);


export default AdminDashboard;