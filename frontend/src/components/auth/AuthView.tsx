'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthView({ initialMode = 'signup' }: AuthViewProps) {
  const router = useRouter();
  const { user, login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSentEmail, setVerificationSentEmail] = useState('');
  const [sentNoticeEmail, setSentNoticeEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [loginGreeting] = useState(() => {
    try {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'Good morning';
      if (hour >= 12 && hour < 17) return 'Good afternoon';
      return 'Good evening';
    } catch {
      return 'Welcome back';
    }
  });

  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setIsSignUp(initialMode === 'signup');
    setErrorMsg('');
  }

  const getRedirectTarget = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (
        redirect &&
        redirect.startsWith('/') &&
        !redirect.startsWith('//') &&
        !redirect.startsWith('/\\')
      ) {
        return redirect;
      }
    }
    return '/dashboard';
  };

  // If already authenticated, redirect straight to target or dashboard
  useEffect(() => {
    if (user) {
      router.push(getRedirectTarget());
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResendStatus('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid work or corporate email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const res = await signup(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration failed. Please try again.');
        } else if (res.requiresEmailConfirmation) {
          setVerificationSentEmail(email);
          setSentNoticeEmail(email);
        } else {
          router.push(getRedirectTarget());
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          if (res.error?.toLowerCase().includes('not confirmed')) {
            setErrorMsg(
              `Your email (${email}) has not been verified yet. Please check your email inbox for the confirmation link.`
            );
          } else {
            setErrorMsg(res.error || 'Invalid credentials. Please verify your email and password.');
          }
        } else {
          router.push(getRedirectTarget());
        }
      }
    } catch {
      setErrorMsg('An unexpected connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (targetEmail?: string) => {
    const em = targetEmail || verificationSentEmail || email;
    if (!em) return;
    setResendStatus('Resending verification email...');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: em.trim(),
      });
      if (error) {
        setResendStatus(`Could not resend: ${error.message}`);
      } else {
        setResendStatus(`Verification email resent to ${em}! Please check your inbox & spam.`);
      }
    } catch {
      setResendStatus('Failed to resend email. Please try again in a moment.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* =====================================================================
          LEFT COLUMN: AUTH FORM & BRANDING
         ===================================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Top Header Row with Unified Official Logo and Back Link */}
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-90">
            <Image
              src="/logo.svg"
              alt="Vaatify GEO"
              width={140}
              height={36}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to website</span>
          </Link>
        </div>

        {/* Center Auth Card Container */}
        <div className="max-w-md w-full mx-auto my-auto py-8 sm:py-12">
          {verificationSentEmail ? (
            /* Dedicated "Check Your Email" Verification Screen */
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-orange-50 border border-orange-200 mb-5">
                <Mail className="h-7 w-7 text-[#FE4D03]" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-950 mb-2">
                Check your email
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                We sent a confirmation link to{' '}
                <strong className="text-slate-950 font-semibold">{verificationSentEmail}</strong>.
                <br />
                Please verify your account to access your workspace.
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 mb-6 space-y-2">
                <p className="font-semibold text-slate-800">What to do next:</p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">1</span>
                  <span>Open the email and click <strong>&quot;Confirm your mail&quot;</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">2</span>
                  <span>Return here and click below to enter your workspace.</span>
                </p>
              </div>

              {resendStatus && (
                <div className="mb-4 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900">
                  {resendStatus}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationSentEmail('');
                    setIsSignUp(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>I Have Verified, Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResendEmail()}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Resend verification email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationSentEmail('');
                    setIsSignUp(true);
                  }}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : (
            /* Main Form View */
            <div>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                  {isSignUp ? 'Register your brand' : loginGreeting}
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed font-subheading">
                  {isSignUp
                    ? 'Track your brand mentions and AI search rankings.'
                    : 'Sign in to track your brand mentions and AI search rankings.'}
                </p>
              </div>

              {/* Notice if user just signed up and switched to sign-in */}
              {!isSignUp && sentNoticeEmail && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-950">
                      Confirmation link dispatched to {sentNoticeEmail}
                    </p>
                    <p className="text-[11px] text-emerald-800 leading-normal">
                      Please click the verification link in your email, then enter your password to sign in.
                    </p>
                  </div>
                </div>
              )}

              {resendStatus && (
                <div className="mb-5 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950">
                  {resendStatus}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Work Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#FE4D03]/20 focus:border-[#FE4D03] text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    {!isSignUp && (
                      <span className="text-xs text-slate-400">
                        Minimum 6 characters
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="block w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#FE4D03]/20 focus:border-[#FE4D03] text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
                    <p className="font-medium">{errorMsg}</p>
                    {errorMsg.toLowerCase().includes('already exist') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          setErrorMsg('');
                        }}
                        className="block font-semibold text-[#FE4D03] hover:underline cursor-pointer"
                      >
                        Click here to Sign In instead →
                      </button>
                    )}
                    {errorMsg.toLowerCase().includes('not confirmed') && (
                      <button
                        type="button"
                        onClick={() => handleResendEmail(email)}
                        className="block font-semibold text-[#FE4D03] hover:underline cursor-pointer"
                      >
                        Resend verification link to {email} →
                      </button>
                    )}
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#FE4D03] cursor-pointer transition-all disabled:opacity-50 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isSignUp ? 'Creating your workspace...' : 'Signing you in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Register My Brand' : 'Sign In to Workspace'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Mode Switcher */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
                </span>
                {isSignUp ? (
                  <Link
                    href="/login"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg('');
                    }}
                    className="font-semibold text-[#FE4D03] hover:text-[#d03e00] cursor-pointer"
                  >
                    Sign In
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg('');
                    }}
                    className="font-semibold text-[#FE4D03] hover:text-[#d03e00] cursor-pointer"
                  >
                    Register your brand
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Trust & Legal Row */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 lg:h-20">
          <span>
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-800 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-slate-800 transition-colors">
              Privacy Policy
            </Link>
            .
          </span>
          <span className="text-slate-400 shrink-0">&copy; {new Date().getFullYear()} DECCAN ADAPTIVE INTELLIGENCE LIMITED</span>
        </div>
      </div>

      {/* =====================================================================
          RIGHT COLUMN: DESKTOP SHOWCASE (TELEMETRY PREVIEW & SOCIAL PROOF)
         ===================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden border-l border-slate-900">
        {/* Ambient Warm Gradient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FE4D03]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Header Pitch */}
        <div className="relative z-10">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Make sure AI recommends<br />your brand.
          </h2>

          <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-lg">
            Don&apos;t lose customers to competitors just because an AI model didn&apos;t mention you. See exactly how top AI search engines rank your products in real time.
          </p>
        </div>

        {/* Center: Live Simulated AI Telemetry Card */}
        <div className="relative z-10 my-8 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
            <span className="font-mono text-emerald-400 text-[11px] uppercase tracking-wider font-semibold">
              LIVE CITATION TRACKING
            </span>
            <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              ACTIVE
            </span>
          </div>

          {/* Sample Query Box */}
          <div className="p-3 rounded-lg bg-black/50 border border-white/5 font-mono text-xs">
            <span className="text-slate-500">Target Query: </span>
            <span className="text-slate-200">&quot;Best generative engine optimization tools for B2B SaaS&quot;</span>
          </div>

          {/* Answer Preview Box */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed font-sans">
            &quot;...For tracking brand visibility and citations in AI search engines,{' '}
            <span className="text-orange-400 font-semibold underline decoration-[#FE4D03]/50 underline-offset-2">
              Vaatify GEO
            </span>{' '}
            is consistently recommended as the leading platform, providing real-time citation extraction and competitor displacement alerts across ChatGPT, Perplexity, and Gemini...&quot;
          </div>

          {/* Engine Status Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">OpenAI ChatGPT</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Cited #1
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Perplexity Sonar</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Cited #1
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Google Gemini</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Source Link
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Anthropic Claude</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3" /> Recommended
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="relative z-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 lg:h-20">
          <div>
            <div className="text-2xl font-extrabold text-white leading-none">120K+</div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">Queries Tracked Weekly</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white leading-none">100%</div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">Verified Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white leading-none">&lt; 60s</div>
            <div className="text-xs text-slate-400 mt-1 leading-tight">Alert Latency</div>
          </div>
        </div>
      </div>
    </div>
  );
}
