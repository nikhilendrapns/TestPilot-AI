

import React, { useState } from 'react';
import { AppView, LoadTestReport, ReportType } from '../types';
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { LoadingSpinner } from './LoadingSpinner';
import { generateJmeterTestPlanFromFiddler } from '../services/geminiService';

interface LoadTestSimulatorViewProps {
  onNavigate: (view: AppView) => void;
  apiKeyAvailable: boolean;
  onSaveReport: (report: LoadTestReport) => void;
  isLoading: boolean; 
  setIsLoading: (isLoading: boolean) => void;
  handleError: (message: string, view?: AppView) => void;
}

export const LoadTestSimulatorView: React.FC<LoadTestSimulatorViewProps> = ({ onNavigate, apiKeyAvailable, onSaveReport, isLoading, setIsLoading, handleError }) => {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [fiddlerFile, setFiddlerFile] = useState<File | null>(null);
  const [fiddlerFileName, setFiddlerFileName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [conceptualResult, setConceptualResult] = useState<Omit<LoadTestReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType' | 'inputFileName'> | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.saz')) {
        setFiddlerFile(file);
        setFiddlerFileName(file.name);
      } else {
        alert("Please upload a valid Fiddler trace file (.saz).");
        event.target.value = ''; // Reset file input
        setFiddlerFile(null);
        setFiddlerFileName('');
      }
    }
  };

  const handleSubmitAiConceptualization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyAvailable) {
      handleError("Gemini API Key is not configured.", AppView.LOAD_TEST_SIMULATOR);
      return;
    }
     if (!targetUrl.trim()) {
      alert("Please enter a Target URL as a hint for the AI.");
      return;
    }
    if (!fiddlerFile) {
        alert("Please upload a Fiddler (.saz) file.");
        return;
    }
    setIsLoading(true);
    setConceptualResult(null);
    try {
      // Note: We are not sending the file content, only its name and user inputs.
      // The AI will imagine the contents based on these hints.
      const result = await generateJmeterTestPlanFromFiddler(targetUrl, fiddlerFileName, description);
      setConceptualResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate JMX plan due to an unknown error.';
      handleError(message, AppView.LOAD_TEST_SIMULATOR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConceptualReport = () => {
    if (!conceptualResult || !fiddlerFileName) return;
    const report: LoadTestReport = {
      id: `report-load-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`,
      reportType: ReportType.LOAD,
      generatedAt: new Date().toISOString(),
      targetUrl: targetUrl,
      targetDescription: description || `Conceptual JMX Plan from ${fiddlerFileName}`,
      inputFileName: fiddlerFileName,
      jmxTestPlan: conceptualResult.jmxTestPlan,
      summaryMessage: conceptualResult.summaryMessage,
    };
    onSaveReport(report);
  };

  const handleDownloadJmx = () => {
    if (!conceptualResult?.jmxTestPlan) return;
    const blob = new Blob([conceptualResult.jmxTestPlan], { type: 'application/xml;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeFileName = fiddlerFileName.replace('.saz', '').replace(/[^a-z0-9_.-]/gi, '_') || 'test_plan';
    link.setAttribute("download", `${safeFileName}_${new Date().toISOString().split('T')[0]}.jmx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };


  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/60">
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-purple-pink flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-pink-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
          JMeter Plan Generator (from Fiddler)
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
        Upload a Fiddler trace file (.saz). TestPilot AI will conceptually analyze it (based on filename and your description)
        and generate a JMeter Test Plan (.jmx) that you can download and refine.
        The actual content of the .saz file is not processed or uploaded, only its name is used as a hint for the AI.
      </p>

      <form onSubmit={handleSubmitAiConceptualization} className="space-y-6">
        <div>
          <label htmlFor="fiddlerFile" className="block text-sm font-medium text-slate-300/90 mb-1.5">Fiddler Trace File (.saz) <span className="text-pink-400">*</span></label>
          <input 
            type="file" 
            id="fiddlerFile" 
            onChange={handleFileChange} 
            accept=".saz" 
            required 
            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-600/80 file:text-pink-50 hover:file:bg-pink-500/80 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
           {fiddlerFileName && <p className="text-xs text-slate-400/70 mt-1.5">Selected file: {fiddlerFileName}</p>}
        </div>
        <div>
          <label htmlFor="loadTargetUrl" className="block text-sm font-medium text-slate-300/90 mb-1.5">Target URL (Main Domain Hint) <span className="text-pink-400">*</span></label>
          <input type="url" id="loadTargetUrl" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://example.com" required className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none placeholder-slate-500/80" />
        </div>
        <div>
          <label htmlFor="loadTestDescription" className="block text-sm font-medium text-slate-300/90 mb-1.5">Describe Application/Flows (Optional)</label>
          <textarea id="loadTestDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="e.g., Test user login, search, and add to cart flow captured in the Fiddler trace." className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none custom-scrollbar placeholder-slate-500/80 text-sm" />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={!apiKeyAvailable || isLoading || !fiddlerFile}
            className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold rounded-lg shadow-lg hover:shadow-pink-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-pink-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            aria-label="Generate JMeter JMX plan with AI"
          >
            {isLoading ? (
              <> <LoadingSpinner size="sm" /> <span className="ml-2">AI Generating JMX Plan...</span></>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
                Generate JMeter (.jmx) Plan
              </>
            )}
          </button>
        </div>
      </form>

      {isLoading && !conceptualResult && (
         <div className="mt-10 text-center">
           <LoadingSpinner size="md"/>
           <p className="mt-4 text-slate-300/80 animate-pulse">AI is generating your JMeter plan...</p>
         </div>
      )}
      
      {conceptualResult && !isLoading && (
        <div className="mt-10 p-6 bg-slate-700/40 rounded-lg shadow-inner border border-slate-600/50">
          <h3 className="text-xl font-semibold text-gradient-cyan-teal mb-4">AI Generated JMeter Plan</h3>
          
          {conceptualResult.summaryMessage && (
            <div className="mb-5 p-4 bg-slate-600/30 rounded-md border border-slate-500/50">
                <strong className="text-slate-100 block mb-1 font-medium">AI Summary:</strong>
                <p className="text-slate-300/90 text-sm leading-relaxed">{conceptualResult.summaryMessage}</p>
            </div>
          )}
          
          {conceptualResult.jmxTestPlan && (
            <div className="mb-6">
              <strong className="text-slate-200/80 text-sm block mb-2">Generated JMX Plan (Preview):</strong>
              <pre className="bg-slate-900/70 p-3.5 rounded-md text-xs text-cyan-300 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono max-h-60">{
                conceptualResult.jmxTestPlan.length > 1000 ? 
                conceptualResult.jmxTestPlan.substring(0, 1000) + "\n\n... (plan truncated for preview) ..." :
                conceptualResult.jmxTestPlan
              }</pre>
              <button 
                onClick={handleDownloadJmx}
                className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800 w-full sm:w-auto"
                aria-label="Download generated JMX test plan"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download .jmx File
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <button onClick={handleSaveConceptualReport} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
              Save JMX Plan Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};