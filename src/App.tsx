
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, get, off } from 'firebase/database';
import { FIREBASE_CONFIG } from './constants';
import { View, AppState, TankConfig } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalibrationWizard from './components/CalibrationWizard';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getDatabase(app);

// Eye Icon Component
const EyeIcon = ({ show }: { show: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    {show ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    )}
  </svg>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.LOGIN);
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | 'super'>('viewer');
  const [appState, setAppState] = useState<AppState>({
    tanks: {},
    totalVolume: 0,
    avgLevel: 0,
    loading: true,
    isAdmin: false,
    user: null
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '', error: '' });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [currentCalPin, setCurrentCalPin] = useState('abcd123');
  const [showPin, setShowPin] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  
  const [pinUpdateForm, setPinUpdateForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [showUpdatePins, setShowUpdatePins] = useState({ old: false, new: false, confirm: false });

  const [selectedTank, setSelectedTank] = useState<number | null>(null);

  useEffect(() => {
    let statusListener: any = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      // Cleanup previous listener if exists
      if (statusListener) {
        off(ref(db, 'AdminConfig/RegisteredUsers'));
        statusListener = null;
      }

      if (!user) {
        setAppState(prev => ({ ...prev, user: null, loading: false, isAdmin: false }));
        setUserRole('viewer');
        setView(View.LOGIN);
        return;
      }

      const superAdminEmail = 'isuru24120@gmail.com';
      const isSuperAdmin = user.email === superAdminEmail;

      if (isSuperAdmin) {
        setUserRole('super');
        setAppState(prev => ({ ...prev, user, loading: false, isAdmin: true }));
        setView(prev => (prev === View.LOGIN ? View.DASHBOARD : prev));
        startListeners();
        return;
      }

      // Start Real-time Monitor for this user's existence in the directory
      const usersRef = ref(db, 'AdminConfig/RegisteredUsers');
      statusListener = onValue(usersRef, async (snapshot) => {
        const registeredUsers = snapshot.val() || {};
        const regUserEntry = Object.values(registeredUsers).find((u: any) => u.email === user.email) as any;

        if (!regUserEntry) {
          console.warn("Access Revoked: User removed from directory.");
          await signOut(auth);
          setLoginForm({ email: '', password: '', error: "SESSION TERMINATED: YOUR ACCESS HAS BEEN REVOKED BY AN ADMIN." });
          setView(View.LOGIN);
          return;
        }

        setUserRole(regUserEntry.role);
        setAppState(prev => ({ 
          ...prev, 
          user, 
          loading: false, 
          isAdmin: regUserEntry.role === 'admin' 
        }));
        
        // Transition from login to dashboard only once
        setView(prev => (prev === View.LOGIN ? View.DASHBOARD : prev));
        startListeners();
      });
    });

    return () => {
      unsubAuth();
      if (statusListener) off(ref(db, 'AdminConfig/RegisteredUsers'));
    };
  }, []); // Empty dependency array is critical to avoid resetting view state on navigation

  const startListeners = () => {
    const tanksRef = ref(db, 'Tanks');
    onValue(tanksRef, (snap) => {
      const data = snap.val() || {};
      setAppState(prev => ({ ...prev, tanks: data }));
    });

    const pinRef = ref(db, 'AdminConfig/calPassword');
    onValue(pinRef, (snap) => {
      if (snap.exists()) {
        const pin = String(snap.val()).trim();
        setCurrentCalPin(pin);
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginForm(prev => ({ ...prev, error: '' }));
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (err: any) {
      setLoginForm(prev => ({ ...prev, error: "Access Denied: Invalid Credentials" }));
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const verifyPin = async () => {
    setIsChecking(true);
    setErrorMessage('');
    await new Promise(r => setTimeout(r, 600));

    if (adminPin.trim() === currentCalPin) {
      setView(View.TANK_SELECTION);
      setAdminPin('');
      setShowPin(false);
      setIsChecking(false);
    } else {
      setErrorMessage("ACCESS DENIED: INVALID SECURITY PIN");
      triggerShake();
      setIsChecking(false);
      setAdminPin('');
    }
  };

  const handleUpdatePin = async () => {
    const { oldPin, newPin, confirmPin } = pinUpdateForm;
    setErrorMessage('');

    if (oldPin.trim() !== currentCalPin) {
      setErrorMessage("VERIFICATION FAILED: CURRENT PIN INCORRECT");
      triggerShake();
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMessage("INPUT ERROR: PIN MISMATCH");
      return;
    }

    if (newPin.length < 4) {
      setErrorMessage("SECURITY ERROR: PIN TOO SHORT");
      return;
    }

    try {
      setIsChecking(true);
      await set(ref(db, 'AdminConfig/calPassword'), newPin.trim());
      setIsChecking(false);
      setPinUpdateForm({ oldPin: '', newPin: '', confirmPin: '' });
      setView(View.CALIBRATION_AUTH);
      alert("System Update: New PIN successfully deployed.");
    } catch (error) {
      setIsChecking(false);
      setErrorMessage("SYSTEM ERROR: DATABASE WRITE FAILED");
    }
  };

  const saveTankConfig = async (config: TankConfig) => {
    if (selectedTank) {
      await set(ref(db, `Tanks/Tank${selectedTank}/config`), config);
      setView(View.DASHBOARD);
      setSelectedTank(null);
    }
  };

  const handleNavClick = (target: View) => {
    // Determine the effective role for authorization checks
    const currentRole = userRole;

    // Viewer can access Dashboard and Settings
    if (currentRole === 'viewer' && target !== View.DASHBOARD && target !== View.SETTINGS) {
      alert("Permission Denied: Viewer role restricted to monitoring and personal settings.");
      return;
    }
    setView(target);
  };

  if (appState.loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-sky-500 text-[10px] font-bold tracking-[0.4em] uppercase">Securing Connection...</p>
      </div>
    );
  }

  return (
    <Layout 
      activeView={view} 
      setView={handleNavClick} 
      onLogout={() => signOut(auth)} 
      isAuthenticated={!!appState.user}
      role={userRole}
    >
      {view === View.LOGIN && (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-[2rem] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-white py-10 px-6 text-center border-b-4 border-[#1b264f]">
              <div className="mb-4 flex items-center justify-center">
                <img 
                  src="https://greatplacetowork.lk/wp-content/uploads/2024/09/LTL-Logo-2025.png" 
                  alt="LTL Logo"
                  className="h-24 w-auto object-contain"
                />
              </div>
              <h2 className="text-xl font-black text-[#1b264f] tracking-tight uppercase leading-none">LTL TRANSFORMERS (PVT) LTD</h2>
              <p className="mt-2 text-[10px] font-bold text-[#8cc63f] uppercase tracking-widest italic">Secure Monitoring Portal</p>
            </div>

            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-1 tracking-tight uppercase">Authentication</h3>
                <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">Encryption Mode: Active</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <input 
                  type="email" 
                  value={loginForm.email} 
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500" 
                  placeholder="Personnel ID (Email)"
                  required
                />
                <div className="relative">
                  <input 
                    type={showLoginPass ? "text" : "password"} 
                    value={loginForm.password} 
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500" 
                    placeholder="Security Key"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-500"
                  >
                    <EyeIcon show={showLoginPass} />
                  </button>
                </div>

                {loginForm.error && (
                  <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest bg-red-500/10 px-3 py-3 rounded-xl border border-red-500/20 leading-relaxed">
                    {loginForm.error}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="w-full py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-sky-500/25 transition-all"
                >
                  Engage System
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {view === View.DASHBOARD && <Dashboard tanks={appState.tanks} />}

      {view === View.CALIBRATION_AUTH && (
        <div className="max-w-[420px] w-full mx-auto bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-10 shadow-2xl text-center animate-fadeIn relative">
            <h3 className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-[0.05em]">Admin Escalation</h3>
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.15em] mb-12 font-bold opacity-70">Verification Required for System Setup</p>
            
            <div className={`space-y-10 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
              <div className="relative">
                <input 
                  type={showPin ? "text" : "password"}
                  value={adminPin} 
                  onChange={e => { setErrorMessage(''); setAdminPin(e.target.value); }}
                  onKeyDown={e => e.key === 'Enter' && verifyPin()}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-[1.5rem] px-4 py-8 text-center text-4xl tracking-[0.4em] text-white focus:outline-none focus:border-emerald-500/40 transition-all font-black shadow-inner placeholder:text-gray-800"
                  placeholder="••••••••"
                  maxLength={12}
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-emerald-500 transition-colors p-2"
                >
                  <EyeIcon show={showPin} />
                </button>
              </div>

              {errorMessage && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-bounce">
                  {errorMessage}
                </p>
              )}

              <button 
                onClick={verifyPin}
                disabled={isChecking}
                className={`w-full py-6 bg-gradient-to-r from-[#10b981] to-[#6ee7b7] text-white rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:brightness-110 flex items-center justify-center ${isChecking ? 'opacity-70' : ''}`}
              >
                {isChecking ? 'Verifying...' : 'Confirm Identity'}
              </button>
            </div>

            <div className="mt-14 pt-8 border-t border-[#30363d]/40 flex flex-col gap-6">
              <button 
                onClick={() => setView(View.CHANGE_PIN)}
                className="text-[11px] text-gray-500 font-bold uppercase hover:text-white transition-colors tracking-[0.2em]"
              >
                Modify Access PIN
              </button>
              <button 
                onClick={() => setView(View.DASHBOARD)}
                className="text-[11px] text-gray-600 font-bold uppercase hover:text-gray-300 transition-colors tracking-[0.2em]"
              >
                Return to Dashboard
              </button>
            </div>
        </div>
      )}

      {view === View.CHANGE_PIN && (
        <div className="max-w-[420px] mx-auto bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-10 shadow-2xl animate-fadeIn">
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Security Update</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-10 font-bold opacity-70">Update Admin Access Protocol</p>
          
          <div className={`space-y-4 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            <div className="relative">
              <input 
                type={showUpdatePins.old ? "text" : "password"} 
                placeholder="Current Access PIN" 
                value={pinUpdateForm.oldPin}
                onChange={e => setPinUpdateForm(p => ({ ...p, oldPin: e.target.value }))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-700" 
              />
              <button type="button" onClick={() => setShowUpdatePins(p => ({...p, old: !p.old}))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-500">
                <EyeIcon show={showUpdatePins.old} />
              </button>
            </div>
            <div className="h-4" />
            <div className="relative">
              <input 
                type={showUpdatePins.new ? "text" : "password"} 
                placeholder="New Access PIN" 
                value={pinUpdateForm.newPin}
                onChange={e => setPinUpdateForm(p => ({ ...p, newPin: e.target.value }))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-700" 
              />
              <button type="button" onClick={() => setShowUpdatePins(p => ({...p, new: !p.new}))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-500">
                <EyeIcon show={showUpdatePins.new} />
              </button>
            </div>
            <div className="relative">
              <input 
                type={showUpdatePins.confirm ? "text" : "password"} 
                placeholder="Confirm New PIN" 
                value={pinUpdateForm.confirmPin}
                onChange={e => setPinUpdateForm(p => ({ ...p, confirmPin: e.target.value }))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:border-sky-500 focus:outline-none transition-all placeholder:text-gray-700" 
              />
              <button type="button" onClick={() => setShowUpdatePins(p => ({...p, confirm: !p.confirm}))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-500">
                <EyeIcon show={showUpdatePins.confirm} />
              </button>
            </div>
            
            {errorMessage && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest py-2">{errorMessage}</p>}

            <button onClick={handleUpdatePin} disabled={isChecking} className="w-full mt-6 py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-sky-500/20 active:scale-95 transition-all">
              {isChecking ? 'Deploying...' : 'Save New Credentials'}
            </button>
            <button onClick={() => { setErrorMessage(''); setView(View.CALIBRATION_AUTH); }} className="w-full text-[11px] text-gray-500 uppercase font-bold tracking-widest mt-4 hover:text-white transition-colors">Cancel Update</button>
          </div>
        </div>
      )}

      {view === View.TANK_SELECTION && (
        <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">System Configuration</h2>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Select an active module for recalibration</p>
            </div>
            {(userRole === 'super' || userRole === 'admin') && (
              <button 
                onClick={() => setView(View.USER_MANAGEMENT)}
                className="px-6 py-3 bg-[#1b264f] hover:bg-[#2a3a7a] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-sky-500/20 transition-all shadow-lg flex items-center gap-3"
              >
                Manage Personnel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(id => (
              <div 
                key={id} 
                onClick={() => { setSelectedTank(id); setView(View.WIZARD); }}
                className="bg-[#161b22] border border-[#30363d] p-8 rounded-3xl cursor-pointer group hover:border-emerald-500/50 hover:bg-[#1c222b] transition-all flex flex-col items-center gap-6 shadow-xl active:scale-95"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:rotate-6">0{id}</div>
                <div className="text-center">
                  <h4 className="font-black text-white uppercase tracking-wider mb-2 text-lg">Tank T0{id}</h4>
                  <div className="inline-block px-3 py-1 rounded-full bg-black/40 border border-[#30363d]">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                      {appState.tanks[`Tank${id}`]?.config?.isConfigured ? 'Armed' : 'Ready'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === View.USER_MANAGEMENT && (
        <UserManagement 
          onBack={() => setView(View.TANK_SELECTION)} 
          canManage={userRole === 'super' || userRole === 'admin'}
        />
      )}

      {view === View.SETTINGS && (
        <Settings user={appState.user} role={userRole} />
      )}

      {view === View.WIZARD && selectedTank && (
        <CalibrationWizard 
          tankId={selectedTank}
          onCancel={() => { setSelectedTank(null); setView(View.TANK_SELECTION); }}
          onSave={saveTankConfig}
          liveRaw={appState.tanks[`Tank${selectedTank}`]?.analog_raw || 0}
        />
      )}
    </Layout>
  );
};

export default App;
