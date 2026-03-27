import React, { useState, useEffect } from 'react';
import { updateApiKey } from '../services/geminiService';

export const SettingsView = () => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    updateApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    setApiKey('');
    updateApiKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Hero Banner */}
      <div className="relative w-full bg-white overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?q=80&w=2342&auto=format&fit=crop" 
            alt="Modern Office Interior" 
            className="w-full h-full object-cover object-center opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        <div className="relative z-10 px-4 lg:px-8 py-8 lg:py-12 max-w-4xl mx-auto w-full flex flex-col items-start text-left">
          <h2 className="text-xl lg:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Settings
          </h2>
          <p className="text-slate-600 text-sm lg:text-base max-w-xl">
            Configure application settings and API keys.
          </p>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-4xl mx-auto w-full">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 lg:px-8 lg:py-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">API Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set your Gemini API key to use the chatbot on deployed environments.
              </p>
            </div>
          </div>
          
          <div className="p-6 lg:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-2xl bg-slate-50 border-transparent p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-slate-500 mt-2">
                This key is stored securely in your browser's local storage and is never sent to our servers.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Save Key
              </button>
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                Clear Key
              </button>
              
              {saved && (
                <span className="text-sm text-emerald-600 font-medium transition-opacity duration-300">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
