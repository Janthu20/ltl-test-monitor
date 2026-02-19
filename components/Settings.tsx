
import React, { useState } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';

interface SettingsProps {
  user: any;
  role: string;
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

const Settings: React.FC<SettingsProps> = ({ user, role }) => {
  const [isChanging, setIsChanging] = useState(false);
  const [passData, setPassData] = useState({ new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const auth = getAuth();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    if (passData.new !== passData.confirm) {
      return setMessage({ text: 'VALIDATION ERROR: Passwords do not match.', type: 'error' });
    }
    
    if (passData.new.length < 8) {
      return setMessage({ text: 'SECURITY ERROR: Password must be at least 8 characters.', type: 'error' });
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Update the actual password in Firebase Auth directly
      await updatePassword(auth.currentUser, passData.new);
      
      setMessage({ 
        text: 'SECURITY UPDATE SUCCESSFUL! Your login password has been changed successfully. The new credentials are active immediately.', 
        type: 'success' 
      });
      setPassData({ new: '', confirm: '' });
      setIsChanging(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setMessage({ 
          text: 'SENSITIVE OPERATION: For security, please Log Out and Log In again before changing your password.', 
          type: 'error' 
        });
      } else {
        setMessage({ text: `SYSTEM ERROR: ${err.message}`, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-2xl mx-auto space-y-8 pb-24">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-[#1b264f] rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-xl">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Profile Settings</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Personal Security & Identity</p>
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-[2.5rem] p-10 shadow-2xl space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Personnel Email</label>
            <div className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-6 py-5 text-white font-bold text-sm">
              {user?.email}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Access Tier</label>
            <div className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-6 py-5 text-[#8cc63f] font-black text-sm uppercase tracking-widest">
              {role}
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-[#30363d]">
          {!isChanging ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-sm">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Security Credentials</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Update your system login password regularly to maintain secure access to LTL infrastructure monitoring.
                </p>
              </div>
              <button 
                onClick={() => setIsChanging(true)}
                className="w-full md:w-auto px-8 py-5 bg-[#1b264f] hover:bg-[#2a3a7a] text-white rounded-2xl font-black uppercase tracking-[0.15em] transition-all border border-sky-500/20 shadow-lg"
              >
                Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPass ? "text" : "password"} 
                      value={passData.new}
                      onChange={e => setPassData({...passData, new: e.target.value})}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 transition-all text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-sky-500"
                    >
                      <EyeIcon show={showPass} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Re-enter Password</label>
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={passData.confirm}
                    onChange={e => setPassData({...passData, confirm: e.target.value})}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-sky-500 transition-all text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-sky-500/20"
                >
                  {loading ? 'DEPLOYING...' : 'CONFIRM CHANGE'}
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsChanging(false); setMessage({text: '', type: ''}); }}
                  className="px-8 py-5 bg-[#0d1117] text-gray-500 hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all border border-[#30363d]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {message.text && (
            <div className={`mt-8 p-6 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <p className="text-xs font-black uppercase tracking-widest leading-relaxed text-center">
                {message.text}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1b264f]/10 border border-[#1b264f]/20 rounded-[1.5rem] p-8">
        <div className="flex items-start gap-5">
          <div className="bg-sky-500/20 p-3 rounded-xl">
             <span className="text-sky-400 text-2xl">🛡️</span>
          </div>
          <div>
            <h5 className="text-sm font-black text-sky-400 uppercase tracking-widest mb-2">Security Protocol</h5>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              Password changes are effective immediately across all LTL monitoring modules. Ensure your new credentials are kept secure. If you suspect unauthorized access to your account, please alert the IT Security team immediately at xpisuru@gmail.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
