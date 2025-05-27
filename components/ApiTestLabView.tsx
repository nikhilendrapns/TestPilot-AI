
import React, { useState, useEffect } from 'react';
import { AppView, ApiReport, ReportType } from '../types';
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { LoadingSpinner } from './LoadingSpinner';
import { conceptualizeApiTest } from '../services/geminiService';

interface ApiTestLabViewProps {
  onNavigate: (view: AppView) => void;
  apiKeyAvailable: boolean;
  onSaveReport: (report: ApiReport) => void;
  isLoading: boolean; 
  setIsLoading: (isLoading: boolean) => void; 
  handleError: (message: string, view?: AppView) => void;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Header {
  id: string;
  key: string;
  value: string;
}

export const ApiTestLabView: React.FC<ApiTestLabViewProps> = ({ onNavigate, apiKeyAvailable, onSaveReport, isLoading, setIsLoading, handleError }) => {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [headers, setHeaders] = useState<Header[]>([{ id: crypto.randomUUID(), key: '', value: '' }]);
  const [body, setBody] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  const [conceptualResult, setConceptualResult] = useState<Omit<ApiReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType' | 'apiMethod' | 'requestHeadersPreview' | 'requestBodyPreview'> | null>(null);
  const [apiConceptualizationError, setApiConceptualizationError] = useState<string | null>(null);


  const [isLoadingExecution, setIsLoadingExecution] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{ status: number; headers: Record<string, string>; body: any; error?: string } | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.search.includes('test_jsonplaceholder')) {
        setApiUrl('https://jsonplaceholder.typicode.com/todos/1');
        setMethod('GET');
    }
  }, []);


  const handleAddHeader = () => {
    setHeaders([...headers, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const handleHeaderChange = (id: string, field: 'key' | 'value', val: string) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: val } : h));
  };

  const handleRemoveHeader = (id: string) => {
    if (headers.length > 1) {
      setHeaders(headers.filter(h => h.id !== id));
    } else {
      setHeaders([{ id: crypto.randomUUID(), key: '', value: '' }]);
    }
  };

  const handleGenerateConceptualTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiConceptualizationError(null); 
    if (!apiKeyAvailable) {
      handleError("Gemini API Key is not configured for AI conceptualization.", AppView.API_TEST_LAB);
      return;
    }
    if (!apiUrl.trim()) {
      alert("Please enter an API URL for AI conceptualization.");
      return;
    }
    setIsLoading(true); 
    setConceptualResult(null);
    try {
      const headersString = headers.filter(h => h.key.trim() !== '').length > 0 ? 
        JSON.stringify(headers.reduce((acc, h) => {
          if (h.key.trim() !== '') acc[h.key.trim()] = h.value.trim();
          return acc;
        }, {} as Record<string, string>)) : "None";

      const result = await conceptualizeApiTest(apiUrl, method, headersString, body, description);
      setConceptualResult(result);
    } catch (err) {
       const message = err instanceof Error ? err.message : 'Failed to conceptualize API test due to an unknown error.';
       setApiConceptualizationError(message); 
       handleError(message, AppView.API_TEST_LAB); 
    } finally {
      setIsLoading(false); 
    }
  };
  
  const handleExecuteLiveApiCall = async () => {
    if (!apiUrl.trim()) {
      alert("Please enter an API URL to execute.");
      setExecutionError("API URL is required.");
      return;
    }
    setIsLoadingExecution(true);
    setExecutionResult(null);
    setExecutionError(null);

    const requestHeaders: Record<string, string> = {};
    headers.forEach(h => {
      if (h.key.trim() !== '') {
        requestHeaders[h.key.trim()] = h.value.trim();
      }
    });

    const requestOptions: RequestInit = {
      method: method,
      headers: requestHeaders
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      if (body.trim()) {
        requestOptions.body = body;
        if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
            try {
                JSON.parse(body); 
                requestHeaders['Content-Type'] = 'application/json';
            } catch (e) {
                // Not JSON
            }
        }
      }
    }

    try {
      const response = await fetch(apiUrl, requestOptions);
      const responseBody = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let parsedBody: any = responseBody;
      try {
        if (responseHeaders['content-type']?.includes('application/json') || (!responseHeaders['content-type'] && responseBody.startsWith('{') && responseBody.endsWith('}'))) {
          parsedBody = JSON.parse(responseBody);
        }
      } catch (jsonError) {
        // Keep as text
      }

      setExecutionResult({
        status: response.status,
        headers: responseHeaders,
        body: parsedBody
      });
    } catch (err) {
      console.error("Live API Call Error:", err);
      let errorMessage = "Failed to execute live API call.";
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorMessage += " This might be due to a network issue or a CORS policy blocking the request. Check the browser console for more details.";
      } else if (err instanceof Error) {
        errorMessage += ` Error: ${err.message}`;
      }
      setExecutionError(errorMessage);
      setExecutionResult({ status: 0, headers: {}, body: "Error during fetch.", error: errorMessage});
    } finally {
      setIsLoadingExecution(false);
    }
  };

  const handleSaveConceptualReport = () => {
    if (!conceptualResult) return;
    const report: ApiReport = {
      id: `report-api-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`,
      reportType: ReportType.API,
      generatedAt: new Date().toISOString(),
      targetUrl: apiUrl,
      targetDescription: description || `Conceptual API Test for ${method} ${apiUrl}`,
      apiMethod: method,
      requestHeadersPreview: headers.filter(h => h.key.trim()).map(h => `${h.key}: ${h.value}`).join('\n') || "None",
      requestBodyPreview: (method === 'POST' || method === 'PUT' || method === 'PATCH') && body ? body : "N/A",
      ...conceptualResult
    };
    onSaveReport(report);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/60">
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-purple-pink flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
          API Test Lab
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

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div>
          <label htmlFor="apiUrl" className="block text-sm font-medium text-slate-300/90 mb-1.5">API URL <span className="text-pink-400">*</span></label>
          <input type="url" id="apiUrl" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.example.com/resource" required className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none placeholder-slate-500/80" />
        </div>
        <div>
          <label htmlFor="apiMethod" className="block text-sm font-medium text-slate-300/90 mb-1.5">HTTP Method</label>
          <select id="apiMethod" value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none">
            <option value="GET">GET</option> <option value="POST">POST</option> <option value="PUT">PUT</option> <option value="DELETE">DELETE</option> <option value="PATCH">PATCH</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300/90 mb-1.5">Headers</label>
          {headers.map((header, index) => (
            <div key={header.id} className="flex items-center space-x-2 mb-2">
              <input type="text" value={header.key} onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)} placeholder="Header Name (e.g. Content-Type)" className="w-2/5 px-3 py-2.5 bg-slate-600/40 border border-slate-500/60 rounded-md text-slate-100 text-sm focus:ring-1 focus:ring-purple-500 outline-none placeholder-slate-400/70" aria-label={`Header key ${index + 1}`} />
              <input type="text" value={header.value} onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)} placeholder="Header Value (e.g. application/json)" className="w-2/5 px-3 py-2.5 bg-slate-600/40 border border-slate-500/60 rounded-md text-slate-100 text-sm focus:ring-1 focus:ring-purple-500 outline-none placeholder-slate-400/70" aria-label={`Header value ${index + 1}`} />
              <button type="button" onClick={() => handleRemoveHeader(header.id)} className="p-1.5 text-red-400/70 hover:text-red-300 hover:bg-red-600/20 rounded-full transition-colors" aria-label={`Remove header ${index + 1}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddHeader} className="mt-1 px-3 py-1.5 text-xs bg-purple-700/70 hover:bg-purple-600/70 text-white rounded-md shadow hover:shadow-md transition-all flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Header
          </button>
        </div>
        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <div>
            <label htmlFor="apiBody" className="block text-sm font-medium text-slate-300/90 mb-1.5">Request Body</label>
            <textarea id="apiBody" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder='{ "key": "value" }' className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none custom-scrollbar placeholder-slate-500/80 text-sm font-mono" />
          </div>
        )}
         <div>
          <label htmlFor="apiDescription" className="block text-sm font-medium text-slate-300/90 mb-1.5">Test Description / Focus (for AI Conceptualization)</label>
          <input type="text" id="apiDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Test user creation endpoint with valid data" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/70 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none placeholder-slate-500/80" />
        </div>
        
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            type="button" 
            onClick={handleExecuteLiveApiCall} 
            disabled={isLoadingExecution}
            className="w-full flex items-center justify-center px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg hover:shadow-sky-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-sky-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {isLoadingExecution ? <LoadingSpinner size="sm"/> : 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
            }
            Execute Live API Call
          </button>
          <button 
            type="button" 
            onClick={handleGenerateConceptualTest} 
            disabled={!apiKeyAvailable || isLoading} 
            className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 hover:from-purple-700 hover:via-pink-700 hover:to-fuchsia-700 text-white font-bold rounded-lg shadow-lg hover:shadow-pink-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-pink-500/50 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02]"
          >
            {isLoading ? <LoadingSpinner size="sm"/> : 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
            }
             Generate Conceptual Tests (AI)
          </button>
        </div>
      </form>
      
      {apiConceptualizationError && (
        <div className="mt-6 p-4 bg-red-700/20 border border-red-500/50 rounded-md text-red-300/90 text-sm">
          <p><strong>Conceptualization Error:</strong> {apiConceptualizationError}</p>
        </div>
      )}

      {isLoadingExecution && (
        <div className="mt-10 text-center">
          <LoadingSpinner />
          <p className="mt-3 text-slate-300/80">Executing live API call...</p>
        </div>
      )}
      {executionResult && !isLoadingExecution && (
        <div className="mt-10 p-6 bg-slate-700/40 rounded-lg shadow-inner border border-slate-600/50">
          <h3 className="text-xl font-semibold text-gradient-cyan-teal mb-4">Live API Call Result</h3>
          {executionResult.error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md mb-3 text-sm">{executionResult.error}</p>}
          <div className="space-y-3 text-sm">
            <p><strong>Status:</strong> 
              <span className={`ml-2 font-bold ${executionResult.status >= 200 && executionResult.status < 300 ? 'text-green-400' : executionResult.status >= 400 ? 'text-red-400' : 'text-yellow-400'}`}>
                {executionResult.status || "N/A"}
              </span>
            </p>
            <div>
              <strong className="block mb-1 text-slate-200/80">Response Headers:</strong>
              <pre className="bg-slate-900/70 p-3 rounded-md text-xs text-slate-300 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono max-h-40">
                {Object.entries(executionResult.headers).map(([key, value]) => `${key}: ${value}`).join('\n') || "No headers received."}
              </pre>
            </div>
            <div>
              <strong className="block mb-1 text-slate-200/80">Response Body:</strong>
              <pre className="bg-slate-900/70 p-3 rounded-md text-xs text-cyan-300 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono max-h-60">
                {typeof executionResult.body === 'object' ? JSON.stringify(executionResult.body, null, 2) : executionResult.body || "No body received."}
              </pre>
            </div>
             <p className="text-xs text-slate-500/80 pt-2">Note: Live API calls are subject to CORS (Cross-Origin Resource Sharing) policies set by the API server. If the request fails due to CORS, it will be blocked by your browser.</p>
          </div>
        </div>
      )}

      {conceptualResult && (
        <div className="mt-10 p-6 bg-slate-700/40 rounded-lg shadow-inner border border-slate-600/50">
          <h3 className="text-xl font-semibold text-gradient-cyan-teal mb-4">Conceptual AI Test Result</h3>
          <div className="mb-4">
            <strong>Overall Status:</strong> 
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${conceptualResult.overallStatus === 'passed' ? 'bg-green-600/40 text-green-300' : 'bg-red-600/40 text-red-300'}`}>
              {conceptualResult.overallStatus.toUpperCase()}
            </span>
            {conceptualResult.simulatedStatusCode && <span className="ml-3 text-sm text-slate-400">(Simulated Status: {conceptualResult.simulatedStatusCode})</span>}
          </div>
          {conceptualResult.conceptualScript && (
            <div className="mb-4">
              <strong className="text-slate-200/80 text-sm block mb-1">Conceptual Script:</strong>
              <pre className="bg-slate-900/70 p-3 rounded-md text-xs text-cyan-300 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono">{conceptualResult.conceptualScript}</pre>
            </div>
          )}
          {conceptualResult.conceptualTestSteps && conceptualResult.conceptualTestSteps.length > 0 && (
            <div className="mb-4">
              <strong className="text-slate-200/80 text-sm block mb-1">Simulated Steps:</strong>
              <ul className="list-none pl-2 border-l-2 border-slate-600/50">
                {conceptualResult.conceptualTestSteps.map((step, i) => (
                  <li key={`${conceptualResult.conceptualScript?.substring(0,10) || 'step'}-${i}`} className={`py-1 pl-2 text-xs flex items-center gap-2 ${step.status === 'passed' ? 'text-green-300/90' : 'text-red-300/90'}`}>
                    {step.status === 'passed' ? 
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.03-9.97a.75.75 0 0 0-1.06-1.06L6.5 7.38 5.03 5.91a.75.75 0 0 0-1.06 1.06L5.97 9.5H5.5l.03-.03L4.47 8.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5Z" clipRule="evenodd" /></svg> :
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm-.847-8.004a.75.75 0 0 1 1.061 0L10.25 8.97l2.035-2.036a.75.75 0 1 1 1.061 1.06L11.31 10.03l2.036 2.035a.75.75 0 1 1-1.061 1.06L10.25 11.09l-2.036 2.036a.75.75 0 1 1-1.06-1.061L9.19 10.03l-2.036-2.035a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                    }
                    {step.step} {step.details && <span className="text-slate-400/70 text-xs">({step.details})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {conceptualResult.simulatedResponsePreview && (
            <div className="mb-4">
              <strong className="text-slate-200/80 text-sm block mb-1">Simulated Response Preview:</strong>
              <pre className="bg-slate-900/70 p-3 rounded-md text-xs text-cyan-300 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono">{conceptualResult.simulatedResponsePreview}</pre>
            </div>
          )}
          <div className="mt-6 text-center">
            <button onClick={handleSaveConceptualReport} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all">
              Save Conceptual Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};