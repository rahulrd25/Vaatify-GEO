'use client';

import { useState } from 'react';
import { Play, Key, Loader2, X } from 'lucide-react';


interface TopNavbarProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  brandName: string;
  brandDomain: string;
  onTriggerRun: () => void;
  isLoading: boolean;
}

export default function TopNavbar({
  apiKey,
  setApiKey,
  brandName,
  brandDomain,
  onTriggerRun,
  isLoading,
}: TopNavbarProps) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setShowKeyModal(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-2.5 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Breadcrumb / Context */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-900">{brandName}</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-slate-500">{brandDomain || 'vaatify.com'}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Production</span>
        </div>


        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5">

          {/* API Credentials */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Key className="h-3.5 w-3.5 text-slate-400" />
            <span>API Key</span>
          </button>

          {/* Main Primary Action: Run Pipeline */}
          <button
            onClick={onTriggerRun}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-5 border border-slate-300 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm">API Key Credentials</h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter your backend <code className="text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">X-API-Key</code> header value.
            </p>
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="geoagent_secret_key_2026"
              className="w-full px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 mb-5 font-mono"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-3.5 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

