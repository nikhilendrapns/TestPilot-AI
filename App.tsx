

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TestCase, TestRun, Report, AppView, AutomationTip, UiReport, ReportType, ApiReport, LoadTestReport, CodeScanResult, AccessibilityReport } from './types'; // Added AccessibilityReport
import { UrlInputForm } from './components/UrlInputForm';
import { TestCaseDisplay, TestCaseDisplayProps } from './components/TestCaseDisplay';
import { TestExecutionView } from './components/TestExecutionView';
import { ReportView } from './components/ReportView';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ApiKeyInstructions } from './components/ApiKeyInstructions';
import { DashboardView } from './components/DashboardView';
import { ApiTestLabView } from './components/ApiTestLabView'; 
import { LoadTestSimulatorView } from './components/LoadTestSimulatorView'; 
import { CodeSecurityScanView } from './components/CodeSecurityScanView';
import { AccessibilityCheckerView } from './components/AccessibilityCheckerView'; // New import
import { generateTestCases, simulateTestExecution, getGeneralTestAutomationTips } from './services/geminiService';
import { localStorageService } from './services/localStorageService';

export const App = (): JSX.Element | null => {
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(false);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [targetDescription, setTargetDescription] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [historicalReports, setHistoricalReports] = useState<Report[]>([]);
  const [automationTips, setAutomationTips] = useState<AutomationTip[]>([]);
  const [tipsLoading, setTipsLoading] = useState<boolean>(false);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = process.env.API_KEY;
    const isKeyAvailable = !!key && key.trim() !== '';
    setApiKeyAvailable(isKeyAvailable);
    setHistoricalReports(localStorageService.getReports());

    if (isKeyAvailable && automationTips.length === 0 && currentView === AppView.DASHBOARD) { 
      setTipsLoading(true);
      setTipsError(null);
      getGeneralTestAutomationTips()
        .then(tips => setAutomationTips(tips))
        .catch(err => {
          console.error("Failed to load automation tips:", err);
          setTipsError(err instanceof Error ? err.message : "Could not load AI tips.");
        })
        .finally(() => setTipsLoading(false));
    }
  }, [apiKeyAvailable, currentView, automationTips.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

   useEffect(() => {
    const nonApiKeySensitiveViews = [
        AppView.DASHBOARD, 
        AppView.REPORT_VIEW, 
    ];
    const conceptualViews = [
        AppView.INPUT_FORM,
        AppView.API_TEST_LAB,
        AppView.LOAD_TEST_SIMULATOR,
        AppView.CODE_SECURITY_SCAN,
        AppView.ACCESSIBILITY_CHECKER // Added
    ];

    if (!apiKeyAvailable && 
        !nonApiKeySensitiveViews.includes(currentView) &&
        !conceptualViews.includes(currentView) 
    ) {
      // Future: Consider forcing a redirect or showing a more prominent error for critical AI-dependent views.
    }
  }, [apiKeyAvailable, currentView]);

  const handleError = (errorMessage: string, returnToView: AppView = AppView.DASHBOARD) => {
    console.error(errorMessage);
    setError(errorMessage);
    setCurrentView(returnToView);
    setIsLoading(false);
  };

  const navigateToView = (view: AppView) => {
    setError(null); 
    setCurrentView(view);
    setIsMenuOpen(false); 
  };

  const handleUrlSubmit = useCallback(async (url: string, description: string) => {
    if (!apiKeyAvailable) {
      handleError("Gemini API Key is not configured. Please ensure it's set up.", AppView.INPUT_FORM);
      return;
    }
    setTargetUrl(url);
    setTargetDescription(description);
    setIsLoading(true);
    setError(null);
    setCurrentView(AppView.GENERATING_CASES);
    try {
      const cases = await generateTestCases(url, description);
      if (cases.length === 0) {
        handleError("The AI agent did not generate any UI test cases. Please try again with a more specific description or URL.", AppView.INPUT_FORM);
        return;
      }
      setTestCases(cases);
      setTestRuns([]); 
      navigateToView(AppView.CASES_REVIEW);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate UI test cases due to an unknown error.';
      handleError(message, AppView.INPUT_FORM);
    } finally {
      setIsLoading(false);
    }
  }, [apiKeyAvailable]);

  const executeTestSimulationInternal = useCallback(async () => {
    if (!apiKeyAvailable) {
      handleError("Gemini API Key is not configured. Cannot start testing.", AppView.CASES_REVIEW);
      return;
    }
    if (testCases.length === 0) {
      handleError("No UI test cases available to run.", AppView.CASES_REVIEW);
      return;
    }

    navigateToView(AppView.RUNNING_TESTS);
    setIsLoading(true); 
    
    const initialTestRuns: TestRun[] = testCases.map(tc => ({ ...tc, runStatus: 'pending' }));
    setTestRuns([...initialTestRuns]); 

    const currentTestRunsState = [...initialTestRuns]; 

    for (let i = 0; i < currentTestRunsState.length; i++) {
      const currentTestCase = currentTestRunsState[i];
      currentTestRunsState[i] = { ...currentTestCase, runStatus: 'running' };
      setTestRuns([...currentTestRunsState]); 

      try {
        const result = await simulateTestExecution(targetUrl, currentTestCase);
        currentTestRunsState[i] = { ...currentTestCase, runStatus: 'completed', simulatedResult: result };
      } catch (err) {
        console.error(`Error simulating UI test ${currentTestCase.id}:`, err);
        currentTestRunsState[i] = { 
          ...currentTestCase, 
          runStatus: 'completed', 
          errorDetails: err instanceof Error ? err.message : 'UI Test simulation failed unexpectedly.' 
        };
      }
      setTestRuns([...currentTestRunsState]); 
    }

    const passedCount = currentTestRunsState.filter(tr => tr.simulatedResult?.status === 'passed').length;
    const failedCount = currentTestRunsState.filter(tr => tr.simulatedResult?.status === 'failed' || tr.errorDetails).length;
    
    const finalReport: UiReport = {
      id: `report-ui-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`,
      reportType: ReportType.UI,
      summary: {
        totalTests: currentTestRunsState.length,
        passed: passedCount,
        failed: failedCount,
        pending: 0
      },
      testRuns: [...currentTestRunsState],
      generatedAt: new Date().toISOString(),
      targetUrl,
      targetDescription
    };
    setCurrentReport(finalReport);
    setHistoricalReports(localStorageService.saveReport(finalReport));
    navigateToView(AppView.REPORT_VIEW);
    setIsLoading(false);
  }, [testCases, targetUrl, targetDescription, apiKeyAvailable]);

  const handleFinalizeCasesAndStartSimulation = useCallback(async (finalizedTestCases: TestCase[]) => {
    setTestCases(finalizedTestCases);
    setTimeout(() => executeTestSimulationInternal(), 0);
  }, [executeTestSimulationInternal]);

  const handleResetToDashboard = () => { 
    setTargetUrl('');
    setTargetDescription('');
    setTestCases([]);
    setTestRuns([]);
    setCurrentReport(null);
    navigateToView(AppView.DASHBOARD);
    setIsLoading(false);
    setError(null);
  };
  
  const handleStartNewUiTestProject = () => {
    setTargetUrl('');
    setTargetDescription('');
    setTestCases([]);
    setTestRuns([]);
    setCurrentReport(null);
    navigateToView(AppView.INPUT_FORM); 
    setIsLoading(false);
  };

  const handleSaveNewConceptualReport = (report: ApiReport | LoadTestReport | AccessibilityReport) => {
    const updatedReports = localStorageService.saveReport(report);
    setHistoricalReports(updatedReports);
    setCurrentReport(report);
    setTargetUrl(report.targetUrl);
    setTargetDescription(report.targetDescription);
    // Conceptual reports (API, Load, Accessibility) do not have UI test runs.
    // The report parameter type ensures report.reportType cannot be ReportType.UI here.
    setTestRuns([]); 
    navigateToView(AppView.REPORT_VIEW);
    setIsLoading(false);
  };

  const handleViewHistoricalReport = (reportId: string) => {
    const reportToView = historicalReports.find(r => r.id === reportId);
    if (reportToView) {
      setCurrentReport(reportToView);
      setTargetUrl(reportToView.targetUrl); 
      setTargetDescription(reportToView.targetDescription);
      if (reportToView.reportType === ReportType.UI) {
         setTestRuns((reportToView as UiReport).testRuns);
      } else {
        setTestRuns([]); 
      }
      navigateToView(AppView.REPORT_VIEW);
    } else {
      handleError("Could not find the selected report.", AppView.DASHBOARD);
    }
  };

  const handleDeleteHistoricalReport = (reportId: string) => {
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      setHistoricalReports(localStorageService.deleteReport(reportId));
    }
  };
  
  const renderContent = (): JSX.Element | null => {
    if (error) { 
      return (
        <div className="p-6 md:p-8 bg-pink-900/20 backdrop-blur-md border border-pink-700/50 rounded-xl shadow-2xl max-w-2xl mx-auto my-8 text-center">
          <div className="flex flex-col items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-pink-400 mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h2 className="text-2xl font-semibold text-pink-300">An Error Occurred</h2>
          </div>
          <p className="text-pink-300/90 mb-6 whitespace-pre-wrap leading-relaxed">{error}</p>
          <button
            onClick={handleResetToDashboard}
            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    const viewsRequiringApiKeyInstruction = [AppView.INPUT_FORM, AppView.API_TEST_LAB, AppView.LOAD_TEST_SIMULATOR, AppView.CODE_SECURITY_SCAN, AppView.ACCESSIBILITY_CHECKER];

    if (!apiKeyAvailable && viewsRequiringApiKeyInstruction.includes(currentView)) {
        // Intentionally falling through: The specific views in the switch statement below
        // will handle displaying ApiKeyInstructions along with their primary UI.
    } else if (!apiKeyAvailable && currentView !== AppView.DASHBOARD && currentView !== AppView.REPORT_VIEW) { 
      return (
        <>
          <ApiKeyInstructions />
          <div className="text-center mt-6">
            <button
              onClick={handleResetToDashboard}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Go to Dashboard
            </button>
          </div>
        </>
      );
    }
    
    const specificLoadingMessages: Record<string, string> = {
        [AppView.GENERATING_CASES]: "TestPilot AI is crafting UI test scenarios...",
        [AppView.API_TEST_LAB]: "TestPilot AI is conceptualizing your API test...", // May be handled locally by view
        [AppView.LOAD_TEST_SIMULATOR]: "TestPilot AI is simulating your load test concept...", // May be handled locally by view
        [AppView.CODE_SECURITY_SCAN]: "TestPilot AI is scanning your code for security insights...", // May be handled locally by view
        [AppView.ACCESSIBILITY_CHECKER]: "TestPilot AI is checking for accessibility insights...", // May be handled locally by view
        [AppView.RUNNING_TESTS]: "UI Test Simulation in progress..."
    };
    const loadingMessage = specificLoadingMessages[currentView] || "TestPilot AI is working...";

    const viewsThatShowGlobalSpinner: AppView[] = [
      AppView.GENERATING_CASES,
      // AppView.API_TEST_LAB, // These views now manage their own isLoading state via props
      // AppView.LOAD_TEST_SIMULATOR,
      // AppView.CODE_SECURITY_SCAN,
      // AppView.ACCESSIBILITY_CHECKER
    ];

    if (isLoading && viewsThatShowGlobalSpinner.includes(currentView)) {
      return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-300px)] text-center">
          <LoadingSpinner />
          <p className="mt-6 text-xl text-slate-300/80 animate-pulse">{loadingMessage}</p>
        </div>
      );
    }
    
    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView 
                  reports={historicalReports} 
                  onViewReport={handleViewHistoricalReport} 
                  onDeleteReport={handleDeleteHistoricalReport} 
                  onStartNewUiTestProject={handleStartNewUiTestProject}
                  onNavigateToApiLab={() => navigateToView(AppView.API_TEST_LAB)}
                  onNavigateToLoadTest={() => navigateToView(AppView.LOAD_TEST_SIMULATOR)}
                  onNavigateToCodeSecurityScan={() => navigateToView(AppView.CODE_SECURITY_SCAN)}
                  onNavigateToAccessibilityChecker={() => navigateToView(AppView.ACCESSIBILITY_CHECKER)} // New prop
                  apiKeyAvailable={apiKeyAvailable}
                  automationTips={automationTips}
                  tipsLoading={tipsLoading}
                  tipsError={tipsError}
                />;
      case AppView.INPUT_FORM:
        return (
          <>
            {!apiKeyAvailable && <div className="mb-8"><ApiKeyInstructions /></div>}
            <UrlInputForm 
              onSubmit={handleUrlSubmit} 
              isLoading={isLoading} 
              onBackToDashboard={handleResetToDashboard} 
            />
          </>
        );
      case AppView.CASES_REVIEW:
        return <TestCaseDisplay 
                  initialTestCases={testCases} 
                  onSaveAndStartTesting={handleFinalizeCasesAndStartSimulation} 
                  onReset={handleResetToDashboard}
                />;
      case AppView.RUNNING_TESTS:
        return <TestExecutionView testRuns={testRuns} totalTests={testCases.length} />;
      case AppView.REPORT_VIEW:
        return currentReport ? 
               <ReportView report={currentReport} onReset={handleResetToDashboard} /> : 
               ( <div className="text-center p-10 text-slate-400/90 bg-slate-800/80 rounded-lg shadow-xl border border-slate-700">
                 <p className="text-lg mb-4">No report data available or report could not be loaded.</p>
                 <button onClick={handleResetToDashboard} className="text-purple-400 hover:text-purple-300 hover:underline font-semibold">
                   Return to Dashboard
                 </button>
               </div> );
      case AppView.API_TEST_LAB:
        return <ApiTestLabView 
                  onNavigate={navigateToView} 
                  apiKeyAvailable={apiKeyAvailable}
                  onSaveReport={handleSaveNewConceptualReport}
                  isLoading={isLoading && currentView === AppView.API_TEST_LAB} 
                  setIsLoading={setIsLoading}
                  handleError={handleError}
                />;
      case AppView.LOAD_TEST_SIMULATOR:
        return <LoadTestSimulatorView 
                  onNavigate={navigateToView} 
                  apiKeyAvailable={apiKeyAvailable} 
                  onSaveReport={handleSaveNewConceptualReport}
                  isLoading={isLoading && currentView === AppView.LOAD_TEST_SIMULATOR} 
                  setIsLoading={setIsLoading}
                  handleError={handleError}
                />;
      case AppView.CODE_SECURITY_SCAN:
        return <CodeSecurityScanView
                  onNavigate={navigateToView}
                  apiKeyAvailable={apiKeyAvailable}
                  isLoading={isLoading && currentView === AppView.CODE_SECURITY_SCAN} 
                  setIsLoading={setIsLoading}
                  handleError={handleError}
                />;
      case AppView.ACCESSIBILITY_CHECKER: // New case
        return <AccessibilityCheckerView
                  onNavigate={navigateToView}
                  apiKeyAvailable={apiKeyAvailable}
                  onSaveReport={handleSaveNewConceptualReport} // Reusing this handler for now
                  isLoadingGlobal={isLoading} // Pass global loading state
                  setIsLoadingGlobal={setIsLoading} // Pass setter for global loading state
                  handleError={handleError}
                />;
      default:
        navigateToView(AppView.DASHBOARD); 
        return null; 
    }
  };

  const menuItems = [
    { label: 'Dashboard', view: AppView.DASHBOARD, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity duration-150"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12A2.25 2.25 0 0 0 20.25 14.25V3M3.75 14.25v4.5A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25v-4.5M3.75 14.25H7.5v-4.5H3.75v4.5ZM7.5 14.25H12v-4.5H7.5v4.5ZM12 14.25h4.5v-4.5H12v4.5ZM16.5 14.25H20.25v-4.5H16.5v4.5Z" /></svg> },
    { label: 'UI Test Studio', view: AppView.INPUT_FORM, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity duration-150"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg> },
    { label: 'API Test Lab', view: AppView.API_TEST_LAB, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity duration-150"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg> },
    { label: 'Load Test Simulator', view: AppView.LOAD_TEST_SIMULATOR, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity duration-150"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
    { label: 'Code Security Scan', view: AppView.CODE_SECURITY_SCAN, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity duration-150"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg> },
    { label: 'Accessibility Checker', view: AppView.ACCESSIBILITY_CHECKER, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 opacity-80 group-hover:opacity-100 transition-opacity duration-150"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3M16.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75H3.75m0 0V8.25m1.5 1.5V8.25m0 0H3.75m0 0V5.25m1.5 3V5.25" /></svg> }
  ];

  const inlineStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
  `;

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-200 font-lexend">
      <header className="sticky top-0 z-50 text-center py-5 md:py-6 px-4 shadow-2xl bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          
          <div className="flex-1 text-left">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-pink-400 hover:bg-slate-700/70 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          <div className="flex-1 text-center">
            <h1 
              className="text-2xl md:text-3xl font-bold cursor-pointer text-gradient-purple-pink hover:opacity-80 transition-opacity duration-200"
              onClick={handleResetToDashboard}
              role="button"
              tabIndex={0}
              aria-label="TestPilot AI - Go to Dashboard"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleResetToDashboard();}}
            >
              TestPilot AI
            </h1>
          </div>
          <div className="flex-1 text-right"> 
             <span className="text-xs text-slate-500/80">v1.0 Conceptual</span>
          </div>
        </div>
        {isMenuOpen && (
          <div ref={menuRef} className="absolute top-full left-0 mt-1 w-64 md:w-72 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-slate-700/50 p-3 animate-fadeIn z-50">
            <nav>
              <ul className="space-y-1.5">
                {menuItems.map((item) => (
                  <li key={item.view}>
                    <button
                      onClick={() => navigateToView(item.view)}
                      className={`w-full flex items-center px-3.5 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ease-in-out group ${
                                  currentView === item.view 
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md scale-105' 
                                    : 'text-slate-300 hover:bg-slate-700/80 hover:text-pink-300 hover:shadow-sm hover:scale-[1.02] focus:bg-slate-700 focus:text-pink-300'
                                }`}
                      aria-current={currentView === item.view ? "page" : undefined}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        {renderContent()}
      </main>
      
      <footer className="text-center py-6 px-4 border-t border-slate-700/50 bg-slate-900/70 backdrop-blur-sm mt-auto">
        <p className="text-xs text-slate-400/70">
          TestPilot AI &copy; {new Date().getFullYear()}. For conceptual and demonstrative purposes only.
          <br/>Not for use with real production systems or sensitive data. 
          API Key for AI features is managed via <code>process.env.API_KEY</code>.
        </p>
      </footer>
      <style>{inlineStyles}</style>
    </div>
  );
};