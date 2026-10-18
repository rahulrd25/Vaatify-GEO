'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Lock, Mail, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AuthView() {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSentEmail, setVerificationSentEmail] = useState('');
  const [sentNoticeEmail, setSentNoticeEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

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
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          if (res.error?.toLowerCase().includes('not confirmed')) {
            setErrorMsg(`Your email (${email}) has not been verified yet. Please check your email inbox for the confirmation link.`);
          } else {
            setErrorMsg(res.error || 'Invalid credentials. Please verify your email and password.');
          }
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

  // Dedicated "Check Your Email" Verification Screen
  if (verificationSentEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Vaatify GEO"
              width={170}
              height={42}
              priority
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-orange-50 border border-orange-200 mb-4">
              <Mail className="h-7 w-7 text-[#FE4D03]" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Check your email</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              We dispatched a confirmation link to <strong className="text-slate-900 font-semibold">{verificationSentEmail}</strong>.
              <br />
              Please click the link in your email to verify your account and start brand onboarding.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-left text-[11px] text-slate-600 mb-5 space-y-1">
              <p className="font-semibold text-slate-800">What to do next:</p>
              <p>1. Open the email from Supabase and click <strong>&quot;Confirm your mail&quot;</strong>.</p>
              <p>2. Once confirmed, click <strong>&quot;I Have Verified — Sign In&quot;</strong> below.</p>
            </div>

            {resendStatus && (
              <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                {resendStatus}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setVerificationSentEmail('');
                  setIsSignUp(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] rounded cursor-pointer transition-colors shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>I Have Verified — Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleResendEmail()}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded cursor-pointer transition-colors hover:bg-slate-50"
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
                className="w-full py-1.5 text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Use a different email address
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Login / Sign Up Screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.svg"
            alt="Vaatify GEO"
            width={170}
            height={42}
            priority
            className="h-10 w-auto object-contain"
          />
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          {isSignUp ? 'Create your brand account' : 'Welcome back to Vaatify GEO'}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          If you already have an account with the same email, you&apos;ll be signed in automatically.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Notice if user just signed up and switched to sign-in */}
            {!isSignUp && sentNoticeEmail && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-950">Confirmation link sent to {sentNoticeEmail}</p>
                  <p className="text-[11px] text-emerald-700 leading-normal">
                    Please click the verification link in your email. Once clicked, enter your password below to sign in.
                  </p>
                </div>
              </div>
            )}

            {resendStatus && (
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                {resendStatus}
              </div>
            )}

            {/* Work Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 space-y-1.5">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded shadow-xs text-xs font-semibold text-white bg-[#FE4D03] hover:bg-[#e04402] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating with Supabase...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account & Start Onboarding' : 'Sign In'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="font-semibold text-[#FE4D03] hover:text-[#d03e00] cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
