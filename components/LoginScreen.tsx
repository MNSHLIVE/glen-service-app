import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

/* ================= FIXED ROLE PINS ================= */

const ADMIN_PIN = '1111';
const CONTROLLER_PIN = '5555';
const COORDINATOR_PIN = '7777';

/* ================= COMPONENT ================= */

const LoginScreen: React.FC = () => {
  const { login, technicians } = useAppContext();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  /* ================= LOGIN LOGIC ================= */

  const handlePinLogin = (enteredPin: string) => {
    setError('');

    // Admin
    if (enteredPin === ADMIN_PIN) {
      login({
        id: 'admin01',
        name: 'Admin',
        role: UserRole.Admin
      });
      setPin('');
      return;
    }

    // Controller
    if (enteredPin === CONTROLLER_PIN) {
      login({
        id: 'controller01',
        name: 'Controller',
        role: UserRole.Controller
      });
      setPin('');
      return;
    }

    // Coordinator
    if (enteredPin === COORDINATOR_PIN) {
      login({
        id: 'coord01',
        name: 'Coordinator',
        role: UserRole.Coordinator
      });
      setPin('');
      return;
    }

    // ✅ Technician login (LAST 4 DIGITS OF ID)
    const tech = technicians.find(
      t => typeof t.id === 'string' && t.id.slice(-4) === enteredPin
    );

    if (tech) {
      login({
        id: tech.id,
        name: tech.name,
        role: UserRole.Technician
      });
      setPin('');
      return;
    }

    // Fail
    setError('Invalid PIN');
    setPin('');
  };

  useEffect(() => {
    if (pin.length === 4) {
      handlePinLogin(pin);
    }
  }, [pin]);

  /* ================= PIN INPUT ================= */

  const addPin = (v: string) => {
    if (pin.length < 4) setPin(prev => prev + v);
  };

  const clearPin = () => setPin('');
  const backspace = () => setPin(prev => prev.slice(0, -1));

  /* ================= UI ================= */

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">

        <h2 className="text-xl font-bold text-center mb-4">
          Staff Login
        </h2>

        {/* PIN DOTS */}
        <div className="flex justify-center gap-3 mb-3">
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full ${
                pin.length > i ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm mb-2">
            {error}
          </p>
        )}

        {/* KEYPAD */}
        <div className="grid grid-cols-3 gap-4 justify-items-center">
          {'123456789'.split('').map(n => (
            <button
              key={n}
              onClick={() => addPin(n)}
              className="h-16 w-16 bg-gray-100 rounded-full text-xl"
            >
              {n}
            </button>
          ))}

          <button
            onClick={clearPin}
            className="h-16 w-16 bg-gray-200 rounded-full text-sm"
          >
            CLR
          </button>

          <button
            onClick={() => addPin('0')}
            className="h-16 w-16 bg-gray-100 rounded-full text-xl"
          >
            0
          </button>

          <button
            onClick={backspace}
            className="h-16 w-16 bg-gray-200 rounded-full text-xl"
          >
            ⌫
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
