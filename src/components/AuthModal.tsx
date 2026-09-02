import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  LogIn, 
  AlertCircle
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

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { user, error } = await signInWithGoogle();
      if (user) {
        onLoginSuccess({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'admin'
        });
        onClose();
      } else if (error) {
        setErrorMsg(error);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg(err?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
              {errorMsg.includes('unauthorized-domain') && (
                <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px] text-slate-300 space-y-1 pl-6">
                  <p className="font-semibold text-rose-300">Vercel এ Gmail Login চালু করার নিয়ম:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li><strong>Firebase Console</strong>-এ যান (<a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline text-emerald-400">console.firebase.google.com</a>)</li>
                    <li><strong>Authentication</strong> → <strong>Settings</strong> → <strong>Settings tab</strong> → <strong>Authorized domains</strong> এ যান।</li>
                    <li><strong>Add domain</strong> বাটনে ক্লিক করে আপনার Vercel domain (যেমন: <code>your-app-name.vercel.app</code>) টি paste করে <strong>Save</strong> করুন।</li>
                  </ol>
                  <p className="text-[10px] text-slate-400 pt-1">Domain যোগ করার ২ মিনিটের মধ্যে Vercel সাইটে Gmail Login কাজ করা শুরু করবে।</p>
                </div>
              )}
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              id="google-signin-btn"
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
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

            <p className="text-[11px] text-center text-slate-400">
              Sign in with your official Google account to schedule trainings and sync with Google Calendar.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
