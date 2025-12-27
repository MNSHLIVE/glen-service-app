import React from "react";
import { useAppContext } from "./context/AppContext";
import LoginScreen from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";
import TechnicianView from "./components/TechnicianView";
import { UserRole } from "./types";

const App = () => {
  const { user } = useAppContext();

  // Not logged in
  if (!user) {
    return <LoginScreen />;
  }

  // Admin
  if (user.role === UserRole.Admin) {
    return (
      <AdminDashboard
        onViewTicket={(id: string) => {
          console.log("View ticket:", id);
        }}
      />
    );
  }

  // Technician
  if (user.role === UserRole.Technician) {
    return <TechnicianView />;
  }

  return <div>Invalid role</div>;
};

export default App;
