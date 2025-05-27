
import React from 'react';

export const ApiKeyInstructions: React.FC = () => {
  return (
    <div className="p-6 md:p-8 bg-yellow-600/10 backdrop-blur-sm border border-yellow-500/50 rounded-xl shadow-xl max-w-2xl mx-auto my-8 text-center">
      <div className="flex justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-yellow-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.015h-.008v-.015Z" />
        </svg>
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-yellow-200 mb-3">Gemini API Key Required</h2>
      <p className="text-yellow-300/80 mb-4 leading-relaxed text-sm sm:text-base">
        TestPilot AI leverages the Gemini API for its core intelligence. 
        Please ensure the <code>API_KEY</code> environment variable is correctly configured in your execution environment.
      </p>
      <p className="text-xs text-yellow-400/60">
        Generating new test concepts, simulating runs, and fetching AI insights will be disabled until the API key is available.
      </p>
    </div>
  );
};