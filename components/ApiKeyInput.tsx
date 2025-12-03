import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface ApiKeyInputProps {
  onSave: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSave }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      // Sanitize key to remove non-printable characters that cause header errors
      const sanitizedKey = inputKey.replace(/[^a-zA-Z0-9_\-]/g, '');
      onSave(sanitizedKey);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full">
        <div className="bg-brand-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-brand-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Enter Gemini API Key</h2>
        <p className="text-slate-400 mb-6 text-sm">
          To generate podcasts, ListenIn requires your own Gemini API key. It is stored locally in your browser and never sent to our servers.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-slate-600"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputKey}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Start Listening
          </button>
        </form>
        <div className="mt-6 text-xs text-slate-500">
          Need a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">Get one from Google AI Studio</a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInput;