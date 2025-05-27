
import React, { useState } from 'react';
import { AppView, AccessibilityReport, ReportType } from '../types';
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { LoadingSpinner } from './LoadingSpinner';
import { conceptualizeAccessibilityCheck } from '../services/geminiService';

interface AccessibilityCheckerViewProps {
  onNavigate: (view: AppView) => void;
  apiKeyAvailable: boolean;
  onSaveReport: (report: AccessibilityReport) => void;
  isLoadingGlobal: boolean; // Renamed to avoid conflict
  setIsLoadingGlobal: (isLoading: boolean) => void; // Renamed to avoid conflict
  handleError: (message: string, view?: AppView) => void;
}

export const AccessibilityCheckerView: React.FC<AccessibilityCheckerViewProps> = ({
  onNavigate,
  apiKeyAvailable,
  onSaveReport,
  isLoadingGlobal, // Using renamed prop
  setIsLoadingGlobal, // Using renamed prop
  handleError,
}) => {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Local loading state for this component

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyAvailable) {
      handleError("Gemini API Key is not configured. Cannot perform accessibility check.", AppView.ACCESSIBILITY_CHECKER);
      return;
    }
    if (!targetUrl.trim()) {
      alert("Please enter a Website URL for the accessibility check.");
      return;
    }

    setIsProcessing(true);
    try {
      const conceptualResult = await conceptualizeAccessibilityCheck(targetUrl, description);
      
      const report: AccessibilityReport = {
        id: `report-a11y-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`,
        reportType: ReportType.ACCESSIBILITY,
        generatedAt: new Date().toISOString(),
        targetUrl: targetUrl,
        targetDescription: description || `Conceptual Accessibility Check for ${targetUrl}`,
        summary: conceptualResult.summary,
        issues: conceptualResult.issues,
      };
      onSaveReport(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to perform accessibility check due to an unknown error.';
      handleError(message, AppView.ACCESSIBILITY_CHECKER);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/60">
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-purple-pink flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 10.5h6M9 13.5h4.5m-4.5 3h4.5m-7.5-6H5.25m0 0V5.25M5.25 9.75V8.25m1.5 0V5.25m0 .001a2.25 2.25 0 0 0-2.25-2.25H5.25a2.25 2.25 0 0 0 0 4.5h.75m0 0V12m2.25-4.5a2.25 2.25 0 0 0-2.25-2.25H5.25M16.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          Accessibility Checker (Conceptual)
        </h2>
        <button
          onClick={() => onNavigate(AppView.DASHBOARD)}
          className="px-4 py-2 text-sm bg-slate-600/80 hover:bg-slate-500/80 text-slate-100 hover:text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center gap-1.5"
          aria-label="Back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
          Dashboard
        </button>
      </div>

      {!apiKeyAvailable && <div className="mb-6"><ApiKeyInstructions /></div>}
      
      <p className="text-sm text-slate-400/80 mb-6 leading-relaxed">
        Enter a URL and an optional description of specific areas or user flows to focus on. 
        TestPilot AI will perform a conceptual analysis for common web accessibility issues based on WCAG guidelines.
        This is not a substitute for comprehensive manual testing or automated tools on live sites.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="a11yTargetUrl" className="block text-sm font-medium text-slate-300/90 mb-1.5">
            Website URL <span className="text-pink-400">*</span>
          </label>
          <input
            type="url"
            id="a11yTargetUrl"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none placeholder-slate-500/80"
          />
        </div>
        <div>
          <label htmlFor="a11yDescription" className="block text-sm font-medium text-slate-300/90 mb-1.5">
            Focus Area / Description (Optional)
          </label>
          <textarea
            id="a11yDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g., Focus on the main navigation and product listing page."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none custom-scrollbar placeholder-slate-500/80 text-sm"
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={!apiKeyAvailable || isProcessing || isLoadingGlobal}
            className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold rounded-lg shadow-lg hover:shadow-pink-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-pink-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            aria-label="Run conceptual accessibility check with AI"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2 animate-pulse">AI Checking Accessibility...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
                Run Conceptual Accessibility Check
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
