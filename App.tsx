import React from 'react';
import { useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import TechnicianView from './components/TechnicianView';
import AdminDashboard from './components/AdminDashboard';
import { UserRole } from './types';

const App: React.FC = () => {
  const ctx: any = useAppContext();
  const user = ctx?.user || ctx?.currentUser;

  if (!user) {
    return <LoginScreen />;
  }

  if (user.role === UserRole.Technician) {
    return <TechnicianView />;
  }

  return <AdminDashboard />;
};

export default App;
