
import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface UrlInputFormProps {
  onSubmit: (url: string, description: string) => void;
  isLoading: boolean;
  onBackToDashboard: () => void; 
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading, onBackToDashboard }) => {
  const [url, setUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert("Please enter a website URL.");
      return;
    }
    onSubmit(url, description);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50">
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-cyan-teal">
          New UI Test Project
        </h2>
        <button
            onClick={onBackToDashboard}
            className="px-4 py-2 text-sm bg-slate-600/70 hover:bg-slate-500/70 text-slate-100 hover:text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center gap-1.5"
            aria-label="Back to dashboard"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
            Dashboard
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-slate-300/90 mb-1.5">
            Website URL <span className="text-pink-400">*</span>
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors placeholder-slate-500/80 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300/90 mb-1.5">
            Describe the Website & Key Features/User Journeys for AI
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="e.g., E-commerce site: Focus on login, product search (search for 'vintage lamp'), adding to cart, and the complete checkout process. Also, test user registration and profile update for a new user."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors custom-scrollbar placeholder-slate-500/80 shadow-sm text-sm leading-relaxed"
          />
           <p className="text-xs text-slate-400/70 mt-1.5">Provide clear, natural language descriptions. The AI will use this to generate end-to-end test scenarios.</p>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold rounded-lg shadow-lg hover:shadow-pink-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-pink-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:scale-[1.02]"
            aria-label="Generate UI test cases with AI"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2 animate-pulse">Generating UI Test Ideas...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
                Generate UI Test Cases
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};