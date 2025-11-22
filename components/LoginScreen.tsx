
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

const ADMIN_PINS = ['999', '222'];
const CONTROLLER_PIN = '555';
const COORDINATOR_PIN = '777';
const MASTER_DEV_PIN = '888888'; 
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; 

const LoginScreen: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const { login, technicians } = useAppContext();

  useEffect(() => {
    const storedLockout = localStorage.getItem('loginLockoutUntil');
    if (storedLockout) {
        const lockoutTime = parseInt(storedLockout, 10);
        if (Date.now() < lockoutTime) {
            setLockoutUntil(lockoutTime);
        } else {
            localStorage.removeItem('loginLockoutUntil');
        }
    }
  }, []);

  useEffect(() => {
    if (error) setError('');
  }, [pin]);

  const handleLoginAttempt = (enteredPin: string) => {
     if (lockoutUntil) {
         if (Date.now() < lockoutUntil) {
             setError(`App locked. Try again in ${Math.ceil((lockoutUntil - Date.now()) / 60000)} mins.`);
             setPin('');
             return;
         } else {
             setLockoutUntil(null);
             setFailedAttempts(0);
             localStorage.removeItem('loginLockoutUntil');
         }
     }

    if (enteredPin === MASTER_DEV_PIN) {
        login({ id: 'dev01', name: 'Master Developer', role: UserRole.Developer });
        setFailedAttempts(0);
        return;
    }

    if (ADMIN_PINS.includes(enteredPin)) {
      login({ id: 'admin01', name: 'Admin User', role: UserRole.Admin });
      setFailedAttempts(0);
      return;
    }
    
    if (enteredPin === CONTROLLER_PIN) {
        login({ id: 'controller01', name: 'Controller User', role: UserRole.Controller });
        setFailedAttempts(0);
        return;
    }

    if (enteredPin === COORDINATOR_PIN) {
        login({ id: 'coord01', name: 'Coordinator', role: UserRole.Coordinator });
        setFailedAttempts(0);
        return;
    }

    const foundTechnician = technicians.find(t => t.password === enteredPin);
    if (foundTechnician) {
      login({ id: foundTechnician.id, name: foundTechnician.name, role: UserRole.Technician });
      setFailedAttempts(0);
      return;
    }
    
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_TIME;
        setLockoutUntil(lockoutTime);
        localStorage.setItem('loginLockoutUntil', lockoutTime.toString());
        setError('Too many failed attempts. Locked for 15 mins.');
    } else {
        setError(`Invalid PIN. (${MAX_ATTEMPTS - newAttempts} attempts left)`);
    }
    
    setPin('');
  };

  useEffect(() => {
      const isMasterPin = pin === MASTER_DEV_PIN;
      const isPotentialMatch = pin.length === 3 && (ADMIN_PINS.includes(pin) || pin === CONTROLLER_PIN || pin === COORDINATOR_PIN || technicians.some(t => t.password === pin));

      if (isMasterPin || isPotentialMatch || pin.length >= 4) {
           const timer = setTimeout(() => {
               const matchesAny = ADMIN_PINS.includes(pin) || pin === CONTROLLER_PIN || pin === COORDINATOR_PIN || technicians.some(t => t.password === pin) || pin === MASTER_DEV_PIN;
               if (matchesAny) {
                   handleLoginAttempt(pin);
               } else if (pin.length >= (pin === MASTER_DEV_PIN ? 6 : 4)) {
                   handleLoginAttempt(pin);
               }
           }, 300);
           return () => clearTimeout(timer);
      }
  }, [pin, technicians]);


  const handleKeyPress = (key: string) => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    if (pin.length < 6) setPin(prev => prev + key);
  };

  const handleBackspace = () => setPin(prev => prev.slice(0, -1));
  const handleClear = () => setPin('');

  const PinDisplay = () => (
    <div className={`flex justify-center items-center space-x-3 h-12 bg-gray-100 rounded-lg border-2 ${error ? 'border-red-500 animate-shake' : 'border-gray-300'}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={`block w-4 h-4 rounded-full ${pin.length > i ? 'bg-glen-blue' : 'bg-gray-300'}`}></span>
      ))}
    </div>
  );
  
  const KeypadButton: React.FC<{ value: string, onClick: (v: string) => void, children: React.ReactNode }> = ({ value, onClick, children }) => (
    <button onClick={() => onClick(value)} disabled={!!lockoutUntil && Date.now() < lockoutUntil} className="bg-white/50 text-gray-800 text-3xl font-light rounded-full h-20 w-20 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-glen-blue/50 active:bg-glen-light-blue transition-colors disabled:opacity-50">
        {children}
    </button>
  );

  const InstallHelpModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">How to Install</h3>
                  <button onClick={() => setShowInstallHelp(false)} className="text-gray-500 text-2xl">&times;</button>
              </div>
              <div className="space-y-4 text-sm text-gray-600">
                  <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-bold text-glen-blue mb-1">🤖 Android</p>
                      <ul className="list-disc list-inside space-y-1">
                          <li>Open in <strong>Chrome</strong>.</li>
                          <li>Tap <strong>3 dots (⋮)</strong> > <strong>"Install App"</strong>.</li>
                      </ul>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="font-bold text-gray-800 mb-1">🍎 iPhone (iOS)</p>
                      <ul className="list-disc list-inside space-y-1">
                          <li>Open in <strong>Safari</strong>.</li>
                          <li>Tap <strong>Share</strong> > <strong>"Add to Home Screen"</strong>.</li>
                      </ul>
                  </div>
              </div>
              <button onClick={() => setShowInstallHelp(false)} className="mt-6 w-full bg-glen-blue text-white font-bold py-2 rounded-lg">Got it</button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome</h2>
        <p className="text-center text-gray-500 mb-6">Enter your PIN</p>
        <div className="space-y-6">
          <PinDisplay />
          {error && <p className="text-center text-red-500 text-xs font-semibold animate-pulse">{error}</p>}
          <div className="grid grid-cols-3 gap-4 justify-items-center">
              {'123456789'.split('').map(num => <KeypadButton key={num} value={num} onClick={handleKeyPress}>{num}</KeypadButton>)}
              <KeypadButton value="clear" onClick={handleClear}><span className="text-sm font-semibold">CLEAR</span></KeypadButton>
              <KeypadButton value="0" onClick={handleKeyPress}>0</KeypadButton>
              <KeypadButton value="backspace" onClick={handleBackspace}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12" /></svg>
              </KeypadButton>
          </div>
        </div>
      </div>
      <button onClick={() => setShowInstallHelp(true)} className="mt-8 text-sm text-glen-blue underline opacity-80 hover:opacity-100">
        Don't have the app? Tap here.
      </button>
      {showInstallHelp && <InstallHelpModal />}
    </div>
  );
};

export default LoginScreen;
