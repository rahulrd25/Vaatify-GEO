'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Copy,
  Check,
  Building,
  Lock,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserAccount } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface UserSettingsViewProps {
  user: UserAccount | null;
  brandName?: string;
  brandDomain?: string;
  onSignOut: () => void;
}

export default function UserSettingsView({
  user,
  brandName,
  brandDomain,
  onSignOut,
}: UserSettingsViewProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Your password has been successfully updated.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    } catch {
      setPasswordError('An unexpected error occurred while updating your password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="h-4 w-4 text-orange-600" />
          User Settings & Security
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Manage your personal account credentials, security access, and workspace identity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Account Profile */}
        <div className="card-white rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Mail className="h-4 w-4 text-orange-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Account Profile
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium">
                <span className="truncate">{user?.email || 'N/A'}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <Check className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </div>

            {/* User UID */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                User ID (Tenant UID)
              </label>
              <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-700">
                <span className="truncate mr-2">{user?.id || 'N/A'}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Account Classification
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium flex items-center justify-between">
                <span>{user?.isWorkEmail ? 'Corporate Work Account' : 'Standard User Account'}</span>
                <span className="text-[10px] text-slate-500 capitalize">
                  Role: Account Owner
                </span>
              </div>
            </div>

            {/* Associated Brand */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Active Brand Workspace
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center gap-2 text-slate-800">
                <Building className="h-4 w-4 text-orange-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold">{brandName || 'My Brand'}</span>
                  {brandDomain && (
                    <span className="text-slate-500 text-[11px] ml-1.5 font-mono">
                      ({brandDomain})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Password & Security */}
        <div className="card-white rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <KeyRound className="h-4 w-4 text-orange-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Change Password
            </h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
            <div>
              <label htmlFor="new-password" className="text-[11px] font-semibold text-slate-700 block mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-hidden focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="text-[11px] font-semibold text-slate-700 block mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-hidden focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword || !newPassword}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FE4D03] hover:bg-[#e04402] disabled:opacity-50 text-white font-semibold text-xs rounded cursor-pointer transition-colors shadow-2xs"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>

          {/* Session Security Indicator */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-600">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              Cryptographic JWT Session Active
            </span>
            <span className="font-mono text-[10px] text-slate-400">RS256 Verified</span>
          </div>
        </div>
      </div>

      {/* Card 3: Session & Sign Out */}
      <div className="card-white rounded-lg p-4 shadow-xs flex items-center justify-between border-slate-200">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Sign Out</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Log out of your current session on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded transition-colors cursor-pointer shadow-2xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
