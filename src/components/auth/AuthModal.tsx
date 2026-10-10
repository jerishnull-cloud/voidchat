import React, { useState } from 'react';
import { X, LogIn, UserPlus, KeyRound, Mail, Lock, User, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../lib/sounds';

interface AuthModalProps {
  onClose: () => void;
  onOpenSetup: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onOpenSetup }) => {
  const {
    currentUser,
    isRealUser,
    isSupabaseLive,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPasswordForEmail,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    sounds.playClick();

    try {
      if (!isSupabaseLive) {
        setErrorMsg('Supabase is not connected. Enter your existing Supabase project credentials in the Setup panel first.');
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Authentication successful! Connecting to quantum comms...');
          sounds.playReaction();
          setTimeout(() => onClose(), 1000);
        }
      } else if (mode === 'register') {
        const { error } = await signUpWithEmail(email.trim(), password, username.trim());
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Operative registration received! Check your inbox if email verification is enabled.');
          sounds.playReaction();
          setTimeout(() => onClose(), 2000);
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPasswordForEmail(email.trim());
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset transmission dispatched. Check your email for recovery instructions.');
          sounds.playReaction();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication transmission failure.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    sounds.playClick();
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google OAuth initialization failed.';
      setErrorMsg(msg);
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    sounds.playClick();
    await signOut();
    setSuccessMsg('Disconnected from authenticated operative terminal.');
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-dropdown rounded-2xl border border-[#B026FF]/40 shadow-[0_0_35px_rgba(176,38,255,0.3)] overflow-hidden font-tech">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#B026FF]/20 bg-[#100B18]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B026FF]/20 border border-[#B026FF]/40 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-[#B026FF]" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">
                VOID MINER AUTHENTICATION
              </h3>
              <p className="text-[11px] text-[#A1A1AA]">
                {isRealUser ? 'Existing Authenticated Session' : 'Connect Existing Supabase User Account'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If already logged in as a real user */}
        {isRealUser ? (
          <div className="p-5 space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto overflow-hidden border-2 border-[#B026FF] shadow-[0_0_15px_#B026FF]">
              <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-orbitron font-bold text-white text-base">{currentUser.username}</h4>
              <p className="text-xs text-[#B026FF]">{currentUser.email || currentUser.callsign}</p>
              <p className="text-[11px] text-[#A1A1AA] mt-1">Authenticated via existing Supabase Project</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>SIGN OUT OF SUPABASE</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Status alerts */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error:</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            {/* Mode selection tabs */}
            <div className="flex border-b border-[#B026FF]/20 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-colors ${
                  mode === 'login' ? 'border-[#B026FF] text-white' : 'border-transparent text-[#A1A1AA] hover:text-white'
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-colors ${
                  mode === 'register' ? 'border-[#B026FF] text-white' : 'border-transparent text-[#A1A1AA] hover:text-white'
                }`}
              >
                CREATE ACCOUNT
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-2 border-b-2 text-center cursor-pointer transition-colors ${
                  mode === 'forgot' ? 'border-[#B026FF] text-white' : 'border-transparent text-[#A1A1AA] hover:text-white'
                }`}
              >
                RECOVER
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] uppercase text-[#A1A1AA] mb-1">
                    Operative Callsign / Username *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. ShadowMiner99"
                      className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#B026FF]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase text-[#A1A1AA] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="miner@voidminer.io"
                    className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#B026FF]"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label className="block text-[11px] uppercase text-[#A1A1AA] mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#050507] border border-[#B026FF]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#B026FF]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#8A2BE2] hover:shadow-[0_0_15px_#B026FF] text-white font-bold text-xs tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : mode === 'register' ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                <span>
                  {loading
                    ? 'TRANSMITTING...'
                    : mode === 'login'
                    ? 'SIGN IN TO COMMS'
                    : mode === 'register'
                    ? 'REGISTER OPERATIVE'
                    : 'SEND RESET LINK'}
                </span>
              </button>
            </form>

            {/* Google OAuth Option */}
            <div className="pt-2 border-t border-[#B026FF]/15">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#050507] hover:bg-white/5 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
