
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

const ADMIN_PINS = ['999', '222'];

const LoginScreen: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login, technicians } = useAppContext();

  useEffect(() => {
    if (!pin) return;

    if (ADMIN_PINS.includes(pin)) {
      login({ id: 'admin01', name: 'Admin User', role: UserRole.Admin });
      return;
    }

    const foundTechnician = technicians.find(t => t.password === pin);
    if (foundTechnician) {
      login({ id: foundTechnician.id, name: foundTechnician.name, role: UserRole.Technician });
      return;
    }
    
    // Check for potential partial matches to avoid premature error messages
    const isPartialMatch = technicians.some(t => t.password?.startsWith(pin));
    if (!isPartialMatch && pin.length >= 3 && !ADMIN_PINS.some(p => p.startsWith(pin))) {
        setError('Invalid PIN');
        const timer = setTimeout(() => setError(''), 1000);
        return () => clearTimeout(timer);
    }

  }, [pin, login, technicians]);

  const handleKeyPress = (key: string) => {
    setError('');
    if (pin.length < 6) {
      setPin(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin(prev => prev.slice(0, -1));
  };
  
  const handleClear = () => {
    setError('');
    setPin('');
  }

  const PinDisplay = () => (
    <div className={`flex justify-center items-center space-x-3 h-12 bg-gray-100 rounded-lg border-2 ${error ? 'border-red-500 animate-shake' : 'border-gray-300'}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={`block w-4 h-4 rounded-full ${pin.length > i ? 'bg-glen-blue' : 'bg-gray-300'}`}></span>
      ))}
    </div>
  );
  
  const KeypadButton: React.FC<{ value: string, onClick: (v: string) => void, isIcon?: boolean, children: React.ReactNode }> = ({ value, onClick, isIcon, children }) => (
    <button onClick={() => onClick(value)} className="bg-white/50 text-gray-800 text-3xl font-light rounded-full h-20 w-20 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-glen-blue/50 active:bg-glen-light-blue transition-colors">
        {children}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome</h2>
      <p className="text-center text-gray-500 mb-6">Enter your PIN to log in</p>
      
      <div className="space-y-6">
        <PinDisplay />
        <div className="grid grid-cols-3 gap-4 justify-items-center">
            {'123456789'.split('').map(num => <KeypadButton key={num} value={num} onClick={handleKeyPress}>{num}</KeypadButton>)}
             <KeypadButton value="clear" onClick={handleClear}>
                 <span className="text-sm font-semibold">CLEAR</span>
             </KeypadButton>
             <KeypadButton value="0" onClick={handleKeyPress}>0</KeypadButton>
             <KeypadButton value="backspace" onClick={handleBackspace}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12" />
                </svg>
             </KeypadButton>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;