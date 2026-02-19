import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getDatabase, ref, onValue, set, off } from 'firebase/database';

import { FIREBASE_CONFIG } from './constants';
import { View, AppState, TankConfig } from './types';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalibrationWizard from './components/CalibrationWizard';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';

// ✅ Firebase Init
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getDatabase(app);

const App: React.FC = () => {

  const [view, setView] = useState<View>(View.LOGIN);
  const [userRole, setUserRole] =
    useState<'admin' | 'viewer' | 'super'>('viewer');

  const [appState, setAppState] = useState<AppState>({
    tanks: {},
    totalVolume: 0,
    avgLevel: 0,
    loading: true,
    isAdmin: false,
    user: null
  });

  const [loginForm, setLoginForm] =
    useState({ email: '', password: '', error: '' });

  const [selectedTank, setSelectedTank] =
    useState<number | null>(null);

  // =====================================================
  // ✅ AUTH LISTENER + SAFETY FIX (IMPORTANT)
  // =====================================================
  useEffect(() => {

    let statusListener: any = null;

    // ⭐ SAFETY TIMEOUT (PREVENTS BLACK SCREEN)
    const timeout = setTimeout(() => {
      setAppState(prev => ({ ...prev, loading: false }));
    }, 3000);

    const unsubAuth = onAuthStateChanged(auth, async (user) => {

      if (statusListener) {
        off(ref(db, 'AdminConfig/RegisteredUsers'));
        statusListener = null;
      }

      // NOT LOGGED IN
      if (!user) {
        setUserRole('viewer');
        setView(View.LOGIN);
        setAppState(prev => ({
          ...prev,
          user: null,
          loading: false,
          isAdmin: false
        }));
        return;
      }

      const superAdminEmail = 'isuru24120@gmail.com';
      const isSuperAdmin = user.email === superAdminEmail;

      // SUPER ADMIN
      if (isSuperAdmin) {
        setUserRole('super');
        setView(View.DASHBOARD);
        setAppState(prev => ({
          ...prev,
          user,
          loading: false,
          isAdmin: true
        }));
        startListeners();
        return;
      }

      // NORMAL USER CHECK
      const usersRef = ref(db, 'AdminConfig/RegisteredUsers');

      statusListener = onValue(usersRef, async snap => {

        const users = snap.val() || {};
        const regUser = Object.values(users)
          .find((u: any) => u.email === user.email) as any;

        if (!regUser) {
          await signOut(auth);
          setView(View.LOGIN);
          return;
        }

        setUserRole(regUser.role);
        setView(View.DASHBOARD);

        setAppState(prev => ({
          ...prev,
          user,
          loading: false,
          isAdmin: regUser.role === 'admin'
        }));

        startListeners();
      });
    });

    return () => {
      clearTimeout(timeout);
      unsubAuth();
      if (statusListener)
        off(ref(db, 'AdminConfig/RegisteredUsers'));
    };

  }, []);

  // =====================================================
  // DATABASE LISTENERS
  // =====================================================
  const startListeners = () => {

    const tanksRef = ref(db, 'Tanks');

    onValue(tanksRef, snap => {
      const data = snap.val() || {};
      setAppState(prev => ({ ...prev, tanks: data }));
    });
  };

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        loginForm.email,
        loginForm.password
      );
    } catch {
      setLoginForm(p => ({
        ...p,
        error: "Invalid Credentials"
      }));
    }
  };

  // =====================================================
  // SAVE CONFIG
  // =====================================================
  const saveTankConfig = async (config: TankConfig) => {
    if (!selectedTank) return;

    await set(
      ref(db, `Tanks/Tank${selectedTank}/config`),
      config
    );

    setSelectedTank(null);
    setView(View.DASHBOARD);
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================
  if (appState.loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-white">
        Loading system...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <Layout
      activeView={view}
      setView={setView}
      onLogout={() => signOut(auth)}
      isAuthenticated={!!appState.user}
      role={userRole}
    >

      {view === View.LOGIN && (
        <div className="p-10 text-white">
          <form onSubmit={handleLogin}>
            <input
              placeholder="Email"
              value={loginForm.email}
              onChange={e =>
                setLoginForm({
                  ...loginForm,
                  email: e.target.value
                })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={e =>
                setLoginForm({
                  ...loginForm,
                  password: e.target.value
                })
              }
            />

            <button type="submit">Login</button>

            {loginForm.error && (
              <p>{loginForm.error}</p>
            )}
          </form>
        </div>
      )}

      {view === View.DASHBOARD &&
        <Dashboard tanks={appState.tanks} />}

      {view === View.WIZARD && selectedTank && (
        <CalibrationWizard
          tankId={selectedTank}
          onCancel={() => setView(View.DASHBOARD)}
          onSave={saveTankConfig}
          liveRaw={
            appState.tanks[`Tank${selectedTank}`]?.analog_raw || 0
          }
        />
      )}

      {view === View.USER_MANAGEMENT &&
        <UserManagement
          onBack={() => setView(View.DASHBOARD)}
          canManage={true}
        />}

      {view === View.SETTINGS &&
        <Settings user={appState.user} role={userRole} />}

    </Layout>
  );
};

export default App;
