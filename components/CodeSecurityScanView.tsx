
import React, { useState, useCallback } from 'react';
import { AppView, CodeScanResult, SecurityFlaw } from '../types';
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { LoadingSpinner } from './LoadingSpinner';
import { scanCodeForSecurityFlaws } from '../services/geminiService';

interface CodeSecurityScanViewProps {
  onNavigate: (view: AppView) => void;
  apiKeyAvailable: boolean;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  handleError: (message: string, view?: AppView) => void;
}

const SeverityBadge: React.FC<{ severity: SecurityFlaw['severity'] }> = ({ severity }) => {
  let colorClasses = 'bg-slate-500 text-slate-100';
  switch (severity?.toLowerCase()) {
    case 'high': colorClasses = 'bg-red-600 text-red-100'; break;
    case 'medium': colorClasses = 'bg-yellow-500 text-yellow-100'; break;
    case 'low': colorClasses = 'bg-sky-500 text-sky-100'; break;
    case 'informational': colorClasses = 'bg-teal-500 text-teal-100'; break;
  }
  return <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${colorClasses}`}>{severity}</span>;
};

export const CodeSecurityScanView: React.FC<CodeSecurityScanViewProps> = ({
  onNavigate,
  apiKeyAvailable,
  isLoading,
  setIsLoading,
  handleError,
}) => {
  const [codeContent, setCodeContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<CodeScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCodeContent(e.target?.result as string);
      };
      reader.onerror = () => {
        setScanError(`Error reading file: ${file.name}`);
        handleError(`Error reading file: ${file.name}`, AppView.CODE_SECURITY_SCAN);
      };
      reader.readAsText(file);
    }
    event.target.value = ''; // Reset file input
  };

  const handleScanCode = async () => {
    if (!apiKeyAvailable) {
      handleError("Gemini API Key is not configured. Cannot perform security scan.", AppView.CODE_SECURITY_SCAN);
      return;
    }
    if (!codeContent.trim()) {
      setScanError("Please enter or upload code to scan.");
      return;
    }

    setIsLoading(true);
    setScanResult(null);
    setScanError(null);

    try {
      const result = await scanCodeForSecurityFlaws(codeContent, fileName || undefined);
      setScanResult({
        ...result,
        fileName: fileName || undefined,
        scannedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan code due to an unknown error.';
      setScanError(message);
      // handleError(message, AppView.CODE_SECURITY_SCAN); // Let local error display handle it, or can use global.
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCode = () => {
    setCodeContent('');
    setFileName(null);
    setScanResult(null);
    setScanError(null);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/60">
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-purple-pink flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          Code Security Scan (Conceptual)
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
      
      <p className="text-sm text-slate-400/80 mb-4 leading-relaxed">
        Paste your code snippet or upload a code file. TestPilot AI will perform a conceptual security analysis and provide insights on potential vulnerabilities and best practices. 
        This scan is for illustrative purposes and does not replace rigorous security testing or human expert review.
      </p>

      <div className="space-y-6 mb-8">
        <div>
          <label htmlFor="code-input-area" className="block text-sm font-medium text-slate-300/90 mb-1.5">
            Code Snippet {fileName && <span className="text-xs text-slate-500">({fileName})</span>}
          </label>
          <textarea
            id="code-input-area"
            value={codeContent}
            onChange={(e) => { setCodeContent(e.target.value); if(fileName) setFileName(null);}}
            rows={15}
            placeholder="Paste your code here..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none custom-scrollbar placeholder-slate-500/80 text-sm font-mono"
            aria-label="Code input area"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label htmlFor="code-file-upload" className="cursor-pointer px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 focus-within:ring-2 focus-within:ring-sky-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 010 11.098H6.75z" /></svg>
            Upload Code File
            <input id="code-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.js,.jsx,.ts,.tsx,.py,.java,.cs,.html,.css,.json,.md,.c,.cpp,.go,.rb,.php,.swift,.kt" />
          </label>
          {codeContent && (
            <button 
              type="button" 
              onClick={handleClearCode}
              className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              Clear Code
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleScanCode}
        disabled={!apiKeyAvailable || isLoading || !codeContent.trim()}
        className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold rounded-lg shadow-lg hover:shadow-pink-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-pink-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02]"
        aria-label="Scan code for security flaws with AI"
      >
        {isLoading ? (
            <> <LoadingSpinner size="sm" /> <span className="ml-2">Scanning with AI...</span></>
        ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m0 0A7.5 7.5 0 1 0 5.25 9.75A7.5 7.5 0 0 0 15 9.75Z" /></svg>
            Scan Code with AI</>
        )}
      </button>

      {scanError && (
        <div className="mt-8 p-4 bg-red-700/20 border border-red-500/50 rounded-md text-red-300/90 text-sm">
          <p><strong>Scan Error:</strong> {scanError}</p>
        </div>
      )}

      {isLoading && !scanResult && (
         <div className="mt-10 text-center">
           <LoadingSpinner size="md"/>
           <p className="mt-4 text-slate-300/80 animate-pulse">AI is analyzing your code for security insights...</p>
         </div>
      )}

      {scanResult && !isLoading && (
        <div className="mt-10 p-6 bg-slate-700/40 rounded-lg shadow-inner border border-slate-600/50">
          <h3 className="text-xl font-semibold text-gradient-cyan-teal mb-2">AI Security Scan Report</h3>
          <p className="text-xs text-slate-400/70 mb-1">Scanned: {scanResult.fileName ? `File (${scanResult.fileName})` : "Pasted Snippet"} at {new Date(scanResult.scannedAt).toLocaleString()}</p>
          {scanResult.languageDetected && <p className="text-xs text-slate-400/70 mb-4">Detected Language (Conceptual): {scanResult.languageDetected}</p>}


          <div className="mb-6 p-4 bg-slate-600/30 rounded-md border border-slate-500/50">
            <strong className="text-slate-100 block mb-1 font-medium">Overall Summary:</strong>
            <p className="text-slate-300/90 text-sm leading-relaxed">{scanResult.summary}</p>
          </div>

          {scanResult.flaws && scanResult.flaws.length > 0 ? (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-100 mt-2 mb-0">Identified Conceptual Flaws:</h4>
              {scanResult.flaws.map((flaw) => (
                <details key={flaw.id} className="bg-slate-600/30 p-4 rounded-lg shadow-md border border-slate-500/60 open:ring-1 open:ring-pink-500/50 transition-all" open={flaw.severity === 'High' || scanResult.flaws.length === 1}>
                  <summary className="font-medium text-slate-100 cursor-pointer flex justify-between items-center list-none -m-px pb-2 mb-2 border-b border-slate-500/50 group-open:pb-3">
                    <span className="truncate pr-2">{flaw.description}</span>
                    <div className="flex items-center gap-2">
                        <SeverityBadge severity={flaw.severity} />
                        <span className="transform transition-transform duration-200 group-open:rotate-90 ml-1 text-slate-400 group-hover:text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </span>
                    </div>
                  </summary>
                  <div className="space-y-3 text-sm">
                    {flaw.lineNumber && <p><strong className="text-slate-200/80">Location:</strong> Approx. Line(s) {flaw.lineNumber}</p>}
                    {flaw.codeSnippet && (
                      <div>
                        <strong className="text-slate-200/80 block mb-1">Problematic Snippet (Conceptual):</strong>
                        <pre className="bg-slate-900/70 p-2.5 rounded-md text-xs text-cyan-200 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono max-h-40">{flaw.codeSnippet}</pre>
                      </div>
                    )}
                    <div>
                      <strong className="text-slate-200/80 block mb-1">Explanation:</strong>
                      <p className="text-slate-300/90 leading-relaxed">{flaw.explanation}</p>
                    </div>
                    <div>
                      <strong className="text-slate-200/80 block mb-1">Suggestion:</strong>
                      <div className="bg-slate-700/50 p-3 rounded-md border border-slate-500/70">
                        <p className="text-slate-300/90 leading-relaxed whitespace-pre-wrap">{flaw.suggestion}</p>
                      </div>
                    </div>
                    {flaw.bestPractices && flaw.bestPractices.length > 0 && (
                      <div>
                        <strong className="text-slate-200/80 block mb-1">Relevant Best Practices:</strong>
                        <ul className="list-disc list-inside text-slate-300/80 space-y-0.5">
                          {flaw.bestPractices.map((bp, i) => <li key={i} className="text-xs">{bp}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-green-300/90 text-center py-4">AI analysis did not identify any obvious critical security flaws in this conceptual scan. Always perform thorough human reviews and professional security audits.</p>
          )}
          
          <div className="mt-8 p-3 bg-yellow-600/10 border border-yellow-500/40 rounded-md text-xs text-yellow-300/80">
            <strong>Disclaimer:</strong> The security insights provided by TestPilot AI are for conceptual and informational purposes only. 
            They are generated by an AI and may not be exhaustive or entirely accurate. 
            This tool does not replace comprehensive security audits, static/dynamic analysis (SAST/DAST) tools, or expert human review. 
            Always validate findings and consult with security professionals before implementing changes based on these suggestions.
          </div>
        </div>
      )}
    </div>
  );
};
