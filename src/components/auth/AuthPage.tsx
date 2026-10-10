import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Pickaxe,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SpaceCanvas } from '../cosmic/SpaceCanvas';

export type AuthPageMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  mode: AuthPageMode;
  onOpenSetup: () => void;
}

const inputClassName =
  'w-full rounded-xl border border-white/10 bg-[#08070d]/80 py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#B026FF]/80 focus:ring-2 focus:ring-[#B026FF]/20';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongEnoughPassword = (password: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

function readableAuthError(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('email_not_confirmed') || message.includes('email not confirmed')) {
    return 'Verify your email using the link we sent before signing in.';
  }
  if (message.includes('invalid login credentials')) {
    return 'That email and password combination was not recognized.';
  }
  if (
    message.includes('profiles_username_lower_unique') ||
    (message.includes('username') && (message.includes('taken') || message.includes('duplicate') || message.includes('unique')))
  ) {
    return 'That username is already in use. Choose another one.';
  }
  if (
    message.includes('provider is not enabled') ||
    message.includes('unsupported provider') ||
    message.includes('provider_disabled')
  ) {
    return 'Google sign-in is not enabled for this Supabase project. In Supabase, open Authentication → Sign In / Providers → Google, enable it, and add the Google OAuth client ID and secret.';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'The authentication server could not be reached. Check your connection and try again.';
  }

  return error.message;
}

function getPostAuthPath(): string {
  const next = new URLSearchParams(window.location.search).get('next');
  if (next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) {
    return next;
  }
  return '/?tab=command';
}

const GoogleMark = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onOpenSetup }) => {
  const {
    isAuthReady,
    isPasswordRecovery,
    isRealUser,
    isSupabaseLive,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    updatePassword,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    const authError = new URLSearchParams(window.location.search).get('authError');
    return authError ? readableAuthError(new Error(authError)) : null;
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).has('passwordUpdated')
      ? 'Your password has been updated. Sign in with your new password.'
      : null;
  });

  const isLogin = mode === 'login';
  const isRegistration = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const recoverySessionReady = isAuthReady && (isPasswordRecovery || isRealUser);

  const setModeMessage = (message: string | null) => {
    setErrorMessage(message);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setModeMessage(null);

    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim();
    if ((isLogin || isRegistration || isForgotPassword) && !isValidEmail(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (isRegistration && !/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
      setErrorMessage('Your username must be 3–20 characters and use only letters, numbers, or underscores.');
      return;
    }
    if ((isLogin || isRegistration) && password.length === 0) {
      setErrorMessage('Enter your password.');
      return;
    }
    if ((isRegistration || isResetPassword) && !isStrongEnoughPassword(password)) {
      setErrorMessage('Use at least 8 characters, including at least one letter and one number.');
      return;
    }
    if ((isRegistration || isResetPassword) && password !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }
    if (isResetPassword && !recoverySessionReady) {
      setErrorMessage('This recovery link is invalid or has expired. Request a new reset link to continue.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signInWithEmail(normalizedEmail, password);
        if (error) throw error;
        window.location.replace(getPostAuthPath());
      } else if (isRegistration) {
        const { error, needsEmailVerification } = await signUpWithEmail(
          normalizedEmail,
          password,
          normalizedUsername,
          getPostAuthPath()
        );
        if (error) throw error;
        if (needsEmailVerification) {
          setSuccessMessage('Account created. Check your inbox for the email verification link, then sign in.');
        } else {
          window.location.replace(getPostAuthPath());
        }
      } else if (isForgotPassword) {
        const { error } = await resetPasswordForEmail(normalizedEmail);
        if (error) throw error;
        setSuccessMessage('If an account exists for that address, a password-reset link is on its way.');
      } else {
        const { error } = await updatePassword(password);
        if (error) throw error;
        window.location.replace('/login?passwordUpdated=1');
      }
    } catch (error) {
      setErrorMessage(readableAuthError(error instanceof Error ? error : new Error('Authentication failed.')));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setModeMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle(getPostAuthPath());
    } catch (error) {
      setErrorMessage(readableAuthError(error instanceof Error ? error : new Error('Google sign-in failed.')));
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (confirm = false) => {
    if (confirm) setShowConfirmPassword((visible) => !visible);
    else setShowPassword((visible) => !visible);
  };

  return (
    <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-white sm:px-6">
      <SpaceCanvas />
      <div aria-hidden="true" className="auth-orbit auth-orbit-one" />
      <div aria-hidden="true" className="auth-orbit auth-orbit-two" />
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_440px] lg:gap-16">
        <section className="hidden text-left lg:block">
          <a href="/" className="inline-flex items-center gap-3" aria-label="VOID MINER home">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B026FF]/50 bg-[#B026FF]/10 shadow-[0_0_30px_rgba(176,38,255,0.24)]">
              <Pickaxe className="h-6 w-6 text-[#D8B4FE]" />
            </span>
            <span className="font-orbitron text-lg font-black tracking-[0.18em]">
              VOID<span className="text-[#B026FF]">MINER</span>
            </span>
          </a>
          <div className="mt-16 max-w-xl">
            <p className="mb-5 flex items-center gap-2 font-tech text-xs font-bold tracking-[0.32em] text-[#C084FC]">
              <span className="h-px w-10 bg-[#B026FF]" />
              DEEP VOID EXTRACTION PROTOCOL
            </p>
            <h1 className="font-orbitron text-5xl font-black leading-[1.13] tracking-tight xl:text-6xl">
              ENTER
              <br />
              THE <span className="auth-heading-glow text-[#C084FC]">VOID</span>
            </h1>
            <p className="mt-6 max-w-md font-tech text-xl text-zinc-300">
              Your universe. Your community. Your game.
            </p>
            <div className="mt-12 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-[#B026FF]" />
              SECURE COMMS · ONE UNIVERSE · YOUR SQUAD
            </div>
          </div>
        </section>

        <section className="auth-card w-full rounded-3xl p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <a href="/" className="inline-flex items-center gap-2.5" aria-label="VOID MINER home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#B026FF]/50 bg-[#B026FF]/10">
                <Pickaxe className="h-5 w-5 text-[#D8B4FE]" />
              </span>
              <span className="font-orbitron text-sm font-black tracking-[0.14em]">
                VOID<span className="text-[#B026FF]">MINER</span>
              </span>
            </a>
            <span className="rounded-full border border-[#B026FF]/20 bg-[#B026FF]/5 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#C084FC]">
              COMMS ONLINE
            </span>
          </div>

          <div className="mb-7">
            <p className="mb-2 font-tech text-[11px] font-bold tracking-[0.25em] text-[#C084FC] lg:hidden">
              DEEP VOID EXTRACTION PROTOCOL
            </p>
            <h1 className="font-orbitron text-2xl font-black tracking-[0.07em] sm:text-3xl">
              ENTER THE <span className="text-[#C084FC]">VOID</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400">Your universe. Your community. Your game.</p>
            <p className="mt-5 text-xs font-bold tracking-[0.2em] text-zinc-300">
              {isLogin && 'WELCOME BACK, OPERATIVE'}
              {isRegistration && 'CREATE YOUR OPERATIVE'}
              {isForgotPassword && 'RECOVER YOUR ACCESS'}
              {isResetPassword && 'SET A NEW PASSWORD'}
            </p>
          </div>

          {!isSupabaseLive && (
            <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-xs leading-relaxed text-amber-100/90">
              Connect your existing Supabase project to enable authentication.
              <button
                type="button"
                onClick={onOpenSetup}
                className="ml-1 font-bold text-[#D8B4FE] underline decoration-[#B026FF]/60 underline-offset-2 hover:text-white"
              >
                Configure Supabase
              </button>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="mb-4 flex gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-3 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <p>{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div role="status" className="mb-4 flex gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] p-3 text-sm text-emerald-200">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <p>{successMessage}</p>
            </div>
          )}

          {isResetPassword && isAuthReady && !recoverySessionReady ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#B026FF]/30 bg-[#B026FF]/10">
                <KeyRound className="h-5 w-5 text-[#C084FC]" />
              </div>
              <h2 className="font-bold text-white">This reset link can’t be used</h2>
              <p className="mt-2 leading-relaxed">
                It may have expired or already been used. Request a new link to reset your password.
              </p>
              <a href="/forgot-password" className="mt-5 inline-flex items-center gap-2 font-bold text-[#D8B4FE] hover:text-white">
                Request a new link <ArrowLeft className="h-4 w-4 rotate-180" />
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {isRegistration && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-zinc-300">Username</span>
                  <span className="relative block">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      autoComplete="username"
                      className={inputClassName}
                      maxLength={20}
                      minLength={3}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="e.g. VoidRanger"
                      required
                      value={username}
                    />
                  </span>
                  <span className="mt-1 block text-[11px] text-zinc-500">3–20 letters, numbers, or underscores</span>
                </label>
              )}

              {!isResetPassword && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-zinc-300">Email address</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      autoComplete="email"
                      className={inputClassName}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </span>
                </label>
              )}

              {!isForgotPassword && (
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span>{isResetPassword ? 'New password' : 'Password'}</span>
                    {isLogin && (
                      <a href="/forgot-password" className="font-medium text-[#C084FC] transition hover:text-white">
                        Forgot password?
                      </a>
                    )}
                  </span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      className={inputClassName}
                      minLength={8}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
                      onClick={() => togglePasswordVisibility()}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                  {(isRegistration || isResetPassword) && (
                    <span className="mt-1 block text-[11px] text-zinc-500">Use at least 8 characters with a letter and a number</span>
                  )}
                </label>
              )}

              {(isRegistration || isResetPassword) && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-zinc-300">Confirm password</span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      autoComplete="new-password"
                      className={inputClassName}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Enter your password again"
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                    />
                    <button
                      aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
                      onClick={() => togglePasswordVisibility(true)}
                      type="button"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
              )}

              {isSupabaseLive && (
                <button
                  className="auth-primary-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={loading || !isAuthReady}
                  type="submit"
                >
                  {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {loading
                    ? 'CONNECTING…'
                    : isLogin
                      ? 'SIGN IN'
                      : isRegistration
                        ? 'CREATE ACCOUNT'
                        : isForgotPassword
                          ? 'SEND RESET LINK'
                          : 'UPDATE PASSWORD'}
                </button>
              )}

              {isLogin && isSupabaseLive && (
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/[0.08]" />
                  </div>
                  <span className="relative mx-auto block w-fit bg-[#100B18] px-3 text-[10px] font-semibold tracking-[0.2em] text-zinc-500">
                    OR CONTINUE WITH
                  </span>
                </div>
              )}

              {isLogin && isSupabaseLive && (
                <button
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={loading || !isAuthReady}
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleMark />}
                  Continue with Google
                </button>
              )}
            </form>
          )}

          <div className="mt-6 border-t border-white/[0.08] pt-5 text-center text-sm text-zinc-400">
            {isLogin && (
              <p>
                New to the void?{' '}
                <a href="/register" className="font-bold text-[#D8B4FE] transition hover:text-white">Create an account</a>
              </p>
            )}
            {isRegistration && (
              <p>
                Already have an account?{' '}
                <a href="/login" className="font-bold text-[#D8B4FE] transition hover:text-white">Sign in</a>
              </p>
            )}
            {isForgotPassword && (
              <a href="/login" className="inline-flex items-center gap-2 font-bold text-[#D8B4FE] transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </a>
            )}
            {isResetPassword && (
              <a href="/login" className="inline-flex items-center gap-2 font-bold text-[#D8B4FE] transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </a>
            )}
          </div>

          {isLogin && (
            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-600">
              <ShieldCheck className="h-3.5 w-3.5 text-[#A855F7]" />
              Sessions are securely persisted by your Supabase client.
            </p>
          )}
        </section>
      </div>
    </main>
  );
};
