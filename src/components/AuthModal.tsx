import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  ShieldCheck, 
  LogIn, 
  UserCheck, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        onLoginSuccess({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'admin'
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      // Helpful message if iframe restricts popups
      setErrorMsg(err.message || 'Google Sign-In failed or popup was blocked in preview. You can also sign in with demo accounts below.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (trainerName: string, email: string) => {
    onLoginSuccess({
      uid: `demo-${trainerName.toLowerCase()}`,
      email: email,
      displayName: `${trainerName} (Trainer)`,
      photoURL: null,
      role: 'trainer'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Tipsoi System Authentication
              </h2>
              <p className="text-xs text-slate-400">
                Gmail &amp; Google Sign-in for Trainers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Google Login Button */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              id="google-signin-btn"
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Signing In...' : 'Continue with Google / Gmail'}</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-medium uppercase">Or Select Demo Trainer</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Quick Trainer Demo Logins */}
          <div className="space-y-2">
            <button
              onClick={() => handleDemoSignIn('Shahin', 'shahin.trainer@tipsoi.com')}
              className="w-full p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  S
                </div>
                <div className="text-left">
                  <span className="font-semibold text-white block">Shahin</span>
                  <span className="text-[10px] text-slate-400">Senior Trainer (85+ completed)</span>
                </div>
              </div>
              <span className="text-emerald-400 text-[11px] font-semibold">Sign In →</span>
            </button>

            <button
              onClick={() => handleDemoSignIn('Badhon', 'badhon.trainer@tipsoi.com')}
              className="w-full p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  B
                </div>
                <div className="text-left">
                  <span className="font-semibold text-white block">Badhon</span>
                  <span className="text-[10px] text-slate-400">Payroll &amp; Technical Trainer</span>
                </div>
              </div>
              <span className="text-emerald-400 text-[11px] font-semibold">Sign In →</span>
            </button>

            <button
              onClick={() => handleDemoSignIn('Anika', 'anika.trainer@tipsoi.com')}
              className="w-full p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  A
                </div>
                <div className="text-left">
                  <span className="font-semibold text-white block">Anika</span>
                  <span className="text-[10px] text-slate-400">Geo Fence &amp; Client Success</span>
                </div>
              </div>
              <span className="text-emerald-400 text-[11px] font-semibold">Sign In →</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
