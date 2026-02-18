
import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getDatabase, ref, onValue, push, set, remove } from 'firebase/database';
import { FIREBASE_CONFIG } from '../constants';

interface UserEntry {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt: number;
}

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    {show ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    )}
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

interface UserManagementProps {
  onBack: () => void;
  canManage: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack, canManage }) => {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'viewer'>('viewer');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{id: string, email: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    const usersRef = ref(db, 'AdminConfig/RegisteredUsers');
    const unsub = onValue(usersRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]: [string, any]) => ({
        id,
        ...val
      }));
      setUsers(list);
    });
    return () => unsub();
  }, [db]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const secondaryAppName = 'SecondaryApp';
      let secondaryApp;
      if (getApps().find(app => app.name === secondaryAppName)) {
        secondaryApp = getApp(secondaryAppName);
      } else {
        secondaryApp = initializeApp(FIREBASE_CONFIG, secondaryAppName);
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      await sendEmailVerification(userCredential.user);
      
      const userRef = push(ref(db, 'AdminConfig/RegisteredUsers'));
      await set(userRef, {
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        createdAt: Date.now()
      });

      setMessage({ text: `Provisioned as ${newRole.toUpperCase()}! Link sent.`, type: 'success' });
      setNewEmail('');
      setNewPassword('');
      setNewRole('viewer');
      
      await secondaryAuth.signOut();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Provisioning failed: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canManage) return;
    
    setIsDeleting(true);
    try {
      // We remove from database. App.tsx now listens to this and kicks them out instantly.
      const targetRef = ref(db, `AdminConfig/RegisteredUsers/${deleteTarget.id}`);
      await remove(targetRef);
      setMessage({ text: `SYSTEM BLOCK ACTIVE: ${deleteTarget.email} access revoked.`, type: 'success' });
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Delete Error:", err);
      setMessage({ text: `SYSTEM ERROR: ${err.message}`, type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const initiateDelete = (userId: string, email: string) => {
    // Safety check: Super Admin
    if (email === 'isuru24120@gmail.com') {
      alert("PROTECTED ACCOUNT: Super Admin cannot be removed.");
      return;
    }
    // Safety check: Self
    if (auth.currentUser?.email === email) {
      alert("ACTION DENIED: You cannot revoke your own active session.");
      return;
    }
    setDeleteTarget({ id: userId, email });
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto space-y-8 pb-24">
      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-fadeIn">
          <div className="bg-[#161b22] border border-[#30363d] rounded-[2.5rem] max-w-sm w-full p-10 shadow-2xl space-y-8 text-center scale-up">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
               </svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Revoke System Access?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                You are about to block <span className="text-white font-bold">{deleteTarget.email}</span> from the LTL Monitoring System. Their current session will be terminated immediately.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full py-4 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'BLOCKING...' : 'YES, REVOKE ACCESS'}
              </button>
              <button 
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="w-full py-4 bg-[#0d1117] text-gray-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-[#30363d]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-3 rounded-2xl bg-[#161b22] border border-[#30363d] text-gray-400 hover:text-white hover:border-sky-500 transition-all shadow-lg active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">User Management</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Access Control Center</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-[#161b22] border border-[#30363d] rounded-[2rem] p-8 shadow-2xl h-fit">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2 uppercase tracking-tight">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Add New Personnel
          </h3>
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email Identifier</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="name@ltl.com"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Access Key</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-emerald-500"
                >
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Security Role</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0d1117] rounded-2xl border border-[#30363d]">
                <button 
                  type="button"
                  onClick={() => setNewRole('admin')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newRole === 'admin' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Admin
                </button>
                <button 
                  type="button"
                  onClick={() => setNewRole('viewer')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newRole === 'viewer' ? 'bg-sky-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Viewer
                </button>
              </div>
            </div>
            
            {message.text && (
              <p className={`text-[10px] font-black uppercase tracking-widest text-center py-3 rounded-xl ${message.type === 'success' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'}`}>
                {message.text}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
            >
              {loading ? 'DEPLOYING...' : 'PROVISION USER'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
            Security Directory
          </h3>
          
          <div className="grid gap-4">
            {users.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-[2rem] p-16 text-center">
                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Registry is empty</p>
              </div>
            ) : (
              users.map(user => (
                <div key={user.id} className="bg-[#161b22] border border-[#30363d] rounded-[1.5rem] p-6 flex items-center justify-between hover:border-sky-500/30 transition-all group shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${user.role === 'admin' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'}`}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-none mb-2">{user.email}</h4>
                      <div className="flex gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${user.role === 'admin' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-sky-500 border-sky-500/20 bg-sky-500/5'}`}>
                          {user.role}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono tracking-tighter">Reg: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {canManage && user.email !== 'isuru24120@gmail.com' && (
                      <button 
                        onClick={() => initiateDelete(user.id, user.email)}
                        className="p-3 transition-all flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/10 text-gray-600 hover:text-red-500 hover:bg-red-500/10"
                        title="Revoke Access"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
