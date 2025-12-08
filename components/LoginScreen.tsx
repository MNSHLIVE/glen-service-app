
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';
import { APP_CONFIG } from '../config';

// Technicians & Lower roles use PINs
const CONTROLLER_PIN = '555';
const COORDINATOR_PIN = '777';

// Default Fallback Credentials (Secure defaults if config missing)
const DEFAULT_CREDENTIALS = {
    admin: {
        username: 'admin',
        password: 'PanditAdmin@2025',
        name: 'Admin User',
        role: UserRole.Admin
    },
    developer: {
        username: 'dev',
        password: 'GlenMaster@888',
        name: 'Master Developer',
        role: UserRole.Developer
    }
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; 

const LoginScreen: React.FC = () => {
  // State for toggling modes
  const [isCredentialMode, setIsCredentialMode] = useState(false);
  
  // PIN Mode State
  const [pin, setPin] = useState('');
  
  // Credential Mode State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common State
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  
  const { login, technicians } = useAppContext();
  
  // Determine active credentials (Config vs Defaults)
  const CREDENTIALS = {
      admin: {
          ...DEFAULT_CREDENTIALS.admin,
          ...(APP_CONFIG.DEFAULT_CREDENTIALS?.admin || {})
      },
      developer: {
          ...DEFAULT_CREDENTIALS.developer,
          ...(APP_CONFIG.DEFAULT_CREDENTIALS?.developer || {})
      }
  };

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

  // Clear error when typing
  useEffect(() => {
    if (error) setError('');
  }, [pin, username, password]);

  // --- PIN LOGIN HANDLER (Technicians/Staff) ---
  const handlePinLoginAttempt = (enteredPin: string) => {
     if (isLockoutActive()) return;

    if (enteredPin === CONTROLLER_PIN) {
        login({ id: 'controller01', name: 'Controller User', role: UserRole.Controller });
        resetFailure();
        return;
    }

    if (enteredPin === COORDINATOR_PIN) {
        login({ id: 'coord01', name: 'Coordinator', role: UserRole.Coordinator });
        resetFailure();
        return;
    }

    const foundTechnician = technicians.find(t => t.password === enteredPin);
    if (foundTechnician) {
      login({ id: foundTechnician.id, name: foundTechnician.name, role: UserRole.Technician });
      resetFailure();
      return;
    }
    
    handleFailedAttempt();
    setPin('');
  };
  
  // --- CREDENTIAL LOGIN HANDLER (Admin/Dev) ---
  const handleCredentialLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (isLockoutActive()) return;

      if (username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password) {
          login({ id: 'admin01', name: CREDENTIALS.admin.name, role: CREDENTIALS.admin.role });
          resetFailure();
          return;
      }

      if (username === CREDENTIALS.developer.username && password === CREDENTIALS.developer.password) {
          login({ id: 'dev01', name: CREDENTIALS.developer.name, role: CREDENTIALS.developer.role });
          resetFailure();
          return;
      }

      handleFailedAttempt();
  };

  // --- HELPERS ---
  const isLockoutActive = () => {
      if (lockoutUntil) {
         if (Date.now() < lockoutUntil) {
             setError(`System locked. Try again in ${Math.ceil((lockoutUntil - Date.now()) / 60000)} mins.`);
             return true;
         } else {
             setLockoutUntil(null);
             setFailedAttempts(0);
             localStorage.removeItem('loginLockoutUntil');
         }
     }
     return false;
  };

  const handleFailedAttempt = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_TIME;
        setLockoutUntil(lockoutTime);
        localStorage.setItem('loginLockoutUntil', lockoutTime.toString());
        setError('Too many failed attempts. Locked for 15 mins.');
    } else {
        setError(`Invalid Credentials. (${MAX_ATTEMPTS - newAttempts} attempts left)`);
    }
  };

  const resetFailure = () => {
      setFailedAttempts(0);
      setError('');
  };

  // Auto-submit PIN if length matches standard technician pins (3 or 4)
  useEffect(() => {
      if (!isCredentialMode) {
          const isPotentialMatch = pin.length === 3 && (pin === CONTROLLER_PIN || pin === COORDINATOR_PIN || technicians.some(t => t.password === pin));
          if (isPotentialMatch || pin.length >= 4) {
               const timer = setTimeout(() => {
                   // Simple check to avoid instant error on partial types of unknown pins
                   const matchesAny = pin === CONTROLLER_PIN || pin === COORDINATOR_PIN || technicians.some(t => t.password === pin);
                   if (matchesAny) {
                       handlePinLoginAttempt(pin);
                   } else if (pin.length >= 4) {
                       handlePinLoginAttempt(pin);
                   }
               }, 300);
               return () => clearTimeout(timer);
          }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  <h3 className="text-lg font-bold text-gray-800">Install App on Phone</h3>
                  <button onClick={() => setShowInstallHelp(false)} className="text-gray-500 text-2xl">&times;</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                  You do not need an APK file. This is a Modern Web App.
              </p>
              <div className="space-y-4 text-sm text-gray-600">
                  <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-bold text-glen-blue mb-1">🤖 Android (Chrome)</p>
                      <ul className="list-disc list-inside space-y-1">
                          <li>Tap the <strong>3 dots (⋮)</strong> at top right.</li>
                          <li>Tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                      </ul>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="font-bold text-gray-800 mb-1">🍎 iPhone (Safari)</p>
                      <ul className="list-disc list-inside space-y-1">
                          <li>Tap the <strong>Share Icon</strong> at the bottom.</li>
                          <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                      </ul>
                  </div>
              </div>
              <button onClick={() => setShowInstallHelp(false)} className="mt-6 w-full bg-glen-blue text-white font-bold py-2 rounded-lg">Got it</button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto w-full transition-all duration-300">
        <div className="flex justify-center mb-4">
             <div className="bg-glen-blue/10 p-3 rounded-full">
                <svg className="w-8 h-8 text-glen-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
             </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">{isCredentialMode ? 'Secure Login' : 'Staff Login'}</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">{isCredentialMode ? 'Enter credentials for Admin/Dev access' : 'Enter your Technician PIN'}</p>
        
        {isCredentialMode ? (
            // --- USERNAME/PASSWORD FORM ---
            <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username (Case sensitive)</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-glen-blue focus:border-glen-blue" 
                        placeholder="e.g. admin (lowercase)" 
                        autoFocus 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password (Case sensitive)</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-glen-blue focus:border-glen-blue pr-10" 
                            placeholder="••••••••" 
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 mt-1"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                        </button>
                    </div>
                </div>
                 {error && <p className="text-center text-red-500 text-xs font-semibold animate-pulse">{error}</p>}
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glen-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glen-blue">
                    Login securely
                </button>
            </form>
        ) : (
            // --- PIN PAD ---
            <div className="space-y-6">
                <PinDisplay />
                {error && <p className="text-center text-red-500 text-xs font-semibold animate-pulse">{error}</p>}
                <div className="grid grid-cols-3 gap-4 justify-items-center">
                    {'123456789'.split('').map(num => <KeypadButton key={num} value={num} onClick={handleKeyPress}>{num}</KeypadButton>)}
                    <KeypadButton value="clear" onClick={handleClear}><span className="text-sm font-semibold text-gray-500">CLR</span></KeypadButton>
                    <KeypadButton value="0" onClick={handleKeyPress}>0</KeypadButton>
                    <KeypadButton value="backspace" onClick={handleBackspace}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12" /></svg>
                    </KeypadButton>
                </div>
            </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <button onClick={() => { setIsCredentialMode(!isCredentialMode); setError(''); setPin(''); }} className="text-sm text-glen-blue font-semibold hover:underline">
                {isCredentialMode ? '← Back to Staff PIN Login' : 'Admin / Developer Login →'}
            </button>
        </div>
      </div>
      
      {!isCredentialMode && (
          <button onClick={() => setShowInstallHelp(true)} className="mt-8 text-sm text-glen-blue underline opacity-80 hover:opacity-100">
            Don't have the app? Tap here to Install.
          </button>
      )}
      {showInstallHelp && <InstallHelpModal />}
    </div>
  );
};

export default LoginScreen;
