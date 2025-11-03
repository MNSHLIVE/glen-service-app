
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

const LoginScreen: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.Technician);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, technicians } = useAppContext();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === UserRole.Admin) {
      if (identifier === 'admin' && password === 'admin') {
        login({ id: 'admin01', name: 'Admin User', role: UserRole.Admin });
      } else {
        setError('Invalid admin credentials.');
      }
    } else {
      const foundTechnician = technicians.find(t => t.name.toLowerCase() === identifier.toLowerCase() && t.password === password);
      if (foundTechnician) {
        login({ id: foundTechnician.id, name: foundTechnician.name, role: UserRole.Technician });
      } else {
        setError('Invalid technician name or password.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
      
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setRole(UserRole.Technician)}
          className={`px-6 py-2 rounded-l-lg text-sm font-semibold transition-colors ${role === UserRole.Technician ? 'bg-glen-blue text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Technician
        </button>
        <button
          onClick={() => setRole(UserRole.Admin)}
          className={`px-6 py-2 rounded-r-lg text-sm font-semibold transition-colors ${role === UserRole.Admin ? 'bg-glen-blue text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Admin
        </button>
      </div>

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="identifier">
            {role === UserRole.Admin ? 'Username' : 'Technician Name'}
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-glen-blue"
            placeholder={role === UserRole.Admin ? 'admin' : 'e.g., Anil Kumar'}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-glen-blue"
            placeholder="********"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-glen-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
   