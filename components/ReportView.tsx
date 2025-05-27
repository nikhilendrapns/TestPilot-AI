
import React from 'react';
import { Report, TestRun, ReportType, UiReport, ApiReport, LoadTestReport, AccessibilityReport, AccessibilityIssue, SecurityFlaw } from '../types'; 

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const StatusBadge = ({ status, size = 'md', className = '', children }: StatusBadgeProps): JSX.Element => {
  let bgColor = 'bg-slate-600/60';
  let textColor = 'text-slate-200';
  let ringColor = 'ring-slate-500/40';
  let statusText = status;

  switch (status?.toLowerCase()) {
    case 'passed':
      bgColor = 'bg-green-600/40'; textColor = 'text-green-300'; ringColor = 'ring-green-500/50';
      break;
    case 'failed':
      bgColor = 'bg-red-600/40'; textColor = 'text-red-300'; ringColor = 'ring-red-500/50';
      break;
    case 'error':
      bgColor = 'bg-red-700/50'; textColor = 'text-red-200'; ringColor = 'ring-red-600/60'; statusText = 'Error';
      break;
    case 'pending':
      bgColor = 'bg-yellow-600/40'; textColor = 'text-yellow-300'; ringColor = 'ring-yellow-500/50';
      break;
    case 'critical':
       bgColor = 'bg-red-700/50'; textColor = 'text-red-100'; ringColor = 'ring-red-600/60';
       break;
    case 'serious':
       bgColor = 'bg-orange-600/50'; textColor = 'text-orange-100'; ringColor = 'ring-orange-500/60';
       break;
    case 'moderate':
       bgColor = 'bg-yellow-600/40'; textColor = 'text-yellow-100'; ringColor = 'ring-yellow-500/50';
       break;
    case 'minor':
       bgColor = 'bg-sky-600/40'; textColor = 'text-sky-100'; ringColor = 'ring-sky-500/50';
       break;
    case 'mixed': // For accessibility report overall status
      bgColor = 'bg-yellow-600/40'; textColor = 'text-yellow-200'; ringColor = 'ring-yellow-500/50';
      break;
    case 'unknown':
    default:
      bgColor = 'bg-gray-600/40'; textColor = 'text-gray-300'; ringColor = 'ring-gray-500/50';
      break;
  }
  
  let padding = 'px-2.5 py-1 text-sm';
  if (size === 'sm') padding = 'px-2 py-0.5 text-xs';
  if (size === 'lg') padding = 'px-3 py-1.5 text-base';

  return (
    <span className={`${padding} font-semibold rounded-full ${bgColor} ${textColor} capitalize ring-1 ${ringColor} inline-flex items-center shadow-sm ${className}`}>
      {children || statusText}
    </span>
  );
};

interface StepItemProps {
  step: string;
  isPassed?: boolean; 
  isFailed?: boolean; 
  stepNumber?: number; 
  details?: string;
  iconElement?: JSX.Element; 
}

const StepItem = ({ step, isPassed, isFailed, stepNumber, details, iconElement }: StepItemProps): JSX.Element => {
  let icon: JSX.Element | null = iconElement || null;
  let textColor = 'text-slate-300/80';

  if (!icon) {
    if (isPassed) {
      icon = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-400 mr-2 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.06 0l4-5.5Z" clipRule="evenodd" /></svg>;
      textColor = 'text-green-300/80';
    } else if (isFailed) {
       icon = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400 mr-2 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>;
       textColor = 'text-red-300/80';
    } else if (stepNumber) { 
      icon = <span className="mr-2.5 text-purple-400/70 w-4 text-center flex-shrink-0 font-mono text-xs">{stepNumber}.</span>;
    } else {
      icon = <span className="mr-2.5 text-slate-500 w-4 text-center flex-shrink-0">&bull;</span>;
    }
  }

  return (
    <li className={`flex items-start py-1.5 ${textColor} hover:bg-slate-700/30 rounded px-2 -mx-2 transition-colors duration-150 ease-in-out`}>
      {icon}
      <span className="leading-relaxed">{step} {details && <span className="text-slate-500 text-xs italic">({details})</span>}</span>
    </li>
  );
};

interface CodeSnippetReportProps {
  title: string;
  code?: string;
  language: string;
  isDownloadable?: boolean;
  downloadFileName?: string;
}

const CodeSnippetReport = ({ title, code, language, isDownloadable = false, downloadFileName = "code.txt" }: CodeSnippetReportProps): JSX.Element | null => {
  if (!code || code.trim() === '' || code.startsWith("# AI did not provide") || code.toLowerCase() === "n/a") return null;
  
  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: language === 'xml' || language === 'jmx' ? 'application/xml;charset=utf-8;' : 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", downloadFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1.5">
        <strong className="text-slate-200/80 text-sm block tracking-wide font-medium">{title}:</strong>
        {isDownloadable && (
           <button 
            onClick={handleDownload} 
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-150 ease-in-out text-xs flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            aria-label={`Download ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Download
          </button>
        )}
      </div>
      <pre className="bg-slate-900/80 p-3.5 rounded-md text-xs text-cyan-300 overflow-x-auto custom-scrollbar max-w-full border border-slate-700/70 font-mono shadow-sm max-h-80">
        <code className={`language-${language}`}>{code.length > 2000 ? code.substring(0, 2000) + "\n\n... (content truncated for display) ..." : code}</code>
      </pre>
      { (title.toLowerCase().includes("pytest") || title.toLowerCase().includes("robot") || title.toLowerCase().includes("script")) &&
         !title.toLowerCase().includes("element") && !isDownloadable &&
         <p className="text-xs text-slate-500/70 mt-1 italic">Note: This is an AI-generated conceptual snippet and may require adjustments.</p>
      }
    </div>
  );
};

interface UiTestReportViewProps { report: UiReport }

const UiTestReportView = ({ report }: UiTestReportViewProps): JSX.Element => {
  const { summary, testRuns } = report;
  return (
    <>
      <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-slate-700/40 rounded-lg shadow-md border border-slate-600/40 hover:bg-slate-700/60 transition-colors duration-150 ease-in-out">
          <p className="text-3xl font-bold text-purple-300">{summary.totalTests}</p>
          <p className="text-sm text-slate-400/80 mt-1 uppercase tracking-wider">Total Tests</p>
        </div>
        <div className="p-4 bg-green-700/20 rounded-lg shadow-md border border-green-600/30 hover:bg-green-700/40 transition-colors duration-150 ease-in-out">
          <p className="text-3xl font-bold text-green-300">{summary.passed}</p>
          <p className="text-sm text-slate-400/80 mt-1 uppercase tracking-wider">Passed</p>
        </div>
        <div className="p-4 bg-red-700/20 rounded-lg shadow-md border border-red-600/30 hover:bg-red-700/40 transition-colors duration-150 ease-in-out">
          <p className="text-3xl font-bold text-red-300">{summary.failed}</p>
          <p className="text-sm text-slate-400/80 mt-1 uppercase tracking-wider">Failed / Errors</p>
        </div>
        <div className="p-4 bg-yellow-700/20 rounded-lg shadow-md border border-yellow-600/30 hover:bg-yellow-700/40 transition-colors duration-150 ease-in-out">
          <p className="text-3xl font-bold text-yellow-300">{summary.pending}</p>
          <p className="text-sm text-slate-400/80 mt-1 uppercase tracking-wider">Pending</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-100 mb-5">Detailed UI Test Case Results:</h3>
      <div className="space-y-5 max-h-[calc(100vh-500px)] min-h-[300px] overflow-y-auto p-0.5 custom-scrollbar -mr-1 pr-1">
        {testRuns.map((run: TestRun, index: number) => {
          const overallStatus = run.errorDetails ? 'error' : run.simulatedResult?.status || 'unknown';
          const isPassed = overallStatus === 'passed';
          const isFailed = overallStatus === 'failed' || overallStatus === 'error';
          let statusColorClass = 'border-slate-600/60 group-open:ring-slate-500/40 hover:border-slate-500/80';
          if (isPassed) statusColorClass = 'border-green-600/40 group-open:ring-green-500/30 hover:border-green-500/60';
          if (isFailed) statusColorClass = 'border-red-600/40 group-open:ring-red-500/30 hover:border-red-500/60';
          
          return (
            <details key={run.id || index} className={`bg-slate-700/40 rounded-lg shadow-lg transition-all duration-300 ease-in-out open:shadow-xl group border ${statusColorClass} open:ring-2`} open={testRuns.length === 1 || isFailed}>
              <summary className="font-semibold text-md text-slate-100 cursor-pointer flex justify-between items-center list-none -m-px p-4 rounded-t-lg group-hover:bg-slate-700/30 transition-colors duration-150 ease-in-out group-open:border-b group-open:border-slate-600/50">
                <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={overallStatus} size="sm" className="flex-shrink-0" />
                    <span className="truncate font-medium">{run.name || ('Test Case ' + (index + 1).toString())}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transform transition-transform duration-200 ease-in-out group-open:rotate-90 text-slate-400 group-hover:text-purple-400 flex-shrink-0 ml-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </summary>
              <div className="p-4 text-sm space-y-4">
                {run.description && <p className="text-slate-300/80"><strong className="text-slate-100 font-medium">Documentation:</strong> {run.description}</p>}
                <div>
                  <strong className="text-slate-100 font-medium block mb-2">Test Steps (Keywords):</strong>
                  <ul className="list-none pl-2 space-y-1 border-l-2 border-slate-600/40 ml-1">
                    {run.stepsToReproduce.map((step, i) => (
                      <StepItem key={`${run.id}-step-${i}`} step={step} isPassed={isPassed} isFailed={isFailed} />
                    ))}
                  </ul>
                </div>
                <div>
                  <strong className="text-slate-100 font-medium block mb-1">Expected Result:</strong>
                  <p className="text-slate-300/80 pl-3 border-l-2 border-slate-600/40 ml-1 py-1">{run.expectedResult}</p>
                </div>

                {run.simulatedResult && (
                  <div className="mt-3 pt-3 border-t border-slate-600/40">
                    <strong className="text-slate-100 font-medium block mb-1">Conceptual Execution Result:</strong>
                    <p className={`pl-3 border-l-2 ml-1 py-1 ${isPassed ? 'border-green-500/50 text-green-300/90' : 'border-red-500/50 text-red-300/90'}`}>
                      {run.simulatedResult.actualResult}
                    </p>
                    {run.simulatedResult.healingSuggestion && (
                       <div className="mt-2.5 p-2.5 bg-yellow-700/10 rounded-md border border-yellow-600/30">
                         <p className="text-xs text-yellow-200"><strong className="font-medium">AI Healing Suggestion:</strong> {run.simulatedResult.healingSuggestion}</p>
                       </div>
                    )}
                  </div>
                )}
                 {run.errorDetails && (
                  <div className="mt-3 pt-3 border-t border-slate-600/40">
                    <strong className="text-red-300 font-medium block mb-1">Error During Simulation:</strong>
                    <p className="text-red-300/80 text-xs bg-red-900/30 p-2 rounded-md">{run.errorDetails}</p>
                  </div>
                )}
                <CodeSnippetReport title="Conceptual Pytest Snippet" code={run.pytestSnippet} language="python" />
                <CodeSnippetReport title="Conceptual Robot Framework Snippet" code={run.robotSnippet} language="robotframework" />
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
};

interface ApiTestReportViewProps { report: ApiReport }

const ApiTestReportView = ({ report }: ApiTestReportViewProps): JSX.Element => {
  return (
    <>
      <div className="mb-8 p-4 bg-slate-700/40 rounded-lg shadow-md border border-slate-600/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p><strong className="text-slate-200/90">HTTP Method:</strong> <span className="font-mono text-purple-300">{report.apiMethod}</span></p>
            <p><strong className="text-slate-200/90">Simulated Status Code:</strong> 
                <StatusBadge 
                    status={report.simulatedStatusCode ? report.simulatedStatusCode.toString() : 'N/A'} 
                    className="ml-2" 
                    size="sm"
                />
            </p>
            <p className="col-span-full break-all"><strong className="text-slate-200/90">Endpoint URL:</strong> <span className="text-cyan-300">{report.targetUrl}</span></p>
            {report.targetDescription && <p className="col-span-full"><strong className="text-slate-200/90">Description:</strong> <span className="text-slate-300/80">{report.targetDescription}</span></p>}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-600/40">
             <strong className="text-slate-100 font-medium">Overall Conceptual Status:</strong>
            <StatusBadge status={report.overallStatus} size="md" className="ml-2" />
        </div>
      </div>
      
      <CodeSnippetReport title="Conceptual Test Script (e.g., Karate/Gherkin, Pseudocode)" code={report.conceptualScript} language="gherkin" />
      
      {report.requestHeadersPreview && report.requestHeadersPreview !== "None" && report.requestHeadersPreview.trim() !== "" && (
        <CodeSnippetReport title="Conceptual Request Headers Preview" code={report.requestHeadersPreview} language="text" />
      )}
      {report.requestBodyPreview && report.requestBodyPreview !== "N/A" && report.requestBodyPreview.trim() !== "" && (
        <CodeSnippetReport title="Conceptual Request Body Preview" code={report.requestBodyPreview} language="json" />
      )}
      <CodeSnippetReport title="Simulated Response Preview" code={report.simulatedResponsePreview} language="json" />

      {report.conceptualTestSteps && report.conceptualTestSteps.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-slate-100 mb-2">Conceptual Test Steps & Validation:</h4>
          <ul className="list-none pl-2 space-y-1 border-l-2 border-slate-600/50 ml-1">
            {report.conceptualTestSteps.map((step, i) => (
              <StepItem 
                key={`api-step-${i}`} 
                step={step.step} 
                isPassed={step.status === 'passed'}
                isFailed={step.status === 'failed'}
                details={step.details}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
};


interface LoadTestReportDisplayProps { report: LoadTestReport }

const LoadTestReportDisplay = ({ report }: LoadTestReportDisplayProps): JSX.Element => {
  return (
    <>
      <div className="mb-8 p-4 bg-slate-700/40 rounded-lg shadow-md border border-slate-600/40 text-sm">
        {report.inputFileName && <p className="mb-2"><strong className="text-slate-200/90">Input File:</strong> <span className="font-mono text-pink-300">{report.inputFileName}</span></p>}
        <p className="mb-2"><strong className="text-slate-200/90">Target URL Hint:</strong> <span className="text-cyan-300 break-all">{report.targetUrl}</span></p>
        {report.targetDescription && <p><strong className="text-slate-200/90">Description:</strong> <span className="text-slate-300/80">{report.targetDescription}</span></p>}
      </div>

      {report.summaryMessage && (
        <div className="mb-6 p-3 bg-slate-600/30 rounded-md border border-slate-500/50">
          <strong className="text-slate-100 block mb-1 text-sm font-medium">AI Summary of JMX Plan:</strong>
          <p className="text-slate-300/90 text-xs leading-relaxed">{report.summaryMessage}</p>
        </div>
      )}
      
      <CodeSnippetReport 
        title="Generated JMeter Test Plan (.jmx)" 
        code={report.jmxTestPlan} 
        language="xml" 
        isDownloadable={!!report.jmxTestPlan}
        downloadFileName={`${(report.inputFileName || 'test_plan').replace('.saz','').replace(/[^a-z0-9_.-]/gi, '_')}_${new Date(report.generatedAt).toISOString().split('T')[0]}.jmx`}
      />
      <p className="text-xs text-slate-400/70 mt-3 leading-relaxed">
        This is an AI-generated JMeter plan. Review and customize it in JMeter before execution. 
        It typically includes a TestPlan, ThreadGroup, and HTTPRequest samplers based on the conceptual analysis of the Fiddler file name and description.
      </p>
    </>
  );
};

interface AccessibilityReportDisplayProps { report: AccessibilityReport }

const AccessibilityReportDisplay = ({ report }: AccessibilityReportDisplayProps): JSX.Element => {
  
  const downloadCsvReport = () => {
    const headers = ["ID", "Severity", "WCAG Criteria", "Description", "Element Snippet (Conceptual)", "Suggestion"];
    const csvRows = [
      headers.join(','),
      ...report.issues.map(issue => [
        `"${issue.id}"`,
        `"${issue.severity}"`,
        `"${issue.wcagCriteria.replace(/"/g, '""')}"`,
        `"${issue.description.replace(/"/g, '""')}"`,
        `"${(issue.elementSnippet || 'N/A').replace(/"/g, '""')}"`,
        `"${issue.suggestion.replace(/"/g, '""')}"`
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeFileName = (report.targetUrl.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_') || 'accessibility_report');
    link.setAttribute("download", `${safeFileName}_${new Date(report.generatedAt).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <div className="mb-8 p-4 bg-slate-700/40 rounded-lg shadow-md border border-slate-600/40">
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p className="col-span-full break-all"><strong className="text-slate-200/90">Target URL:</strong> <span className="text-cyan-300">{report.targetUrl}</span></p>
            {report.targetDescription && <p className="col-span-full"><strong className="text-slate-200/90">Description/Focus:</strong> <span className="text-slate-300/80">{report.targetDescription}</span></p>}
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
        <div className="p-3 bg-slate-700/50 rounded-lg shadow-md border border-slate-600/50">
          <p className="text-2xl font-bold text-purple-300">{report.summary.totalIssues}</p>
          <p className="text-xs text-slate-400 mt-1">Total Issues</p>
        </div>
        <div className="p-3 bg-red-700/30 rounded-lg shadow-md border border-red-600/40">
          <p className="text-2xl font-bold text-red-300">{report.summary.critical}</p>
          <p className="text-xs text-slate-400 mt-1">Critical</p>
        </div>
        <div className="p-3 bg-orange-600/20 rounded-lg shadow-md border border-orange-500/30">
          <p className="text-2xl font-bold text-orange-300">{report.summary.serious}</p>
          <p className="text-xs text-slate-400 mt-1">Serious</p>
        </div>
        <div className="p-3 bg-yellow-700/20 rounded-lg shadow-md border border-yellow-600/30">
          <p className="text-2xl font-bold text-yellow-300">{report.summary.moderate}</p>
          <p className="text-xs text-slate-400 mt-1">Moderate</p>
        </div>
        <div className="p-3 bg-sky-700/20 rounded-lg shadow-md border border-sky-600/30">
          <p className="text-2xl font-bold text-sky-300">{report.summary.minor}</p>
          <p className="text-xs text-slate-400 mt-1">Minor</p>
        </div>
      </div>
      
      <div className="flex justify-end mb-5">
        <button
          onClick={downloadCsvReport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Download CSV Report
        </button>
      </div>

      <h3 className="text-xl font-semibold text-slate-100 mb-4">Identified Conceptual Accessibility Issues:</h3>
      <div className="space-y-5 max-h-[calc(100vh-550px)] min-h-[300px] overflow-y-auto p-0.5 custom-scrollbar -mr-1 pr-1">
        {report.issues.map((issue) => (
          <details key={issue.id} className="bg-slate-700/40 rounded-lg shadow-lg transition-all duration-300 ease-in-out open:shadow-xl group border border-slate-600/60 open:ring-2 open:ring-purple-500/40" open={issue.severity === 'Critical' || issue.severity === 'Serious' || report.issues.length <= 3}>
            <summary className="font-semibold text-md text-slate-100 cursor-pointer flex justify-between items-center list-none -m-px p-4 rounded-t-lg group-hover:bg-slate-700/30 transition-colors duration-150 ease-in-out group-open:border-b group-open:border-slate-600/50">
              <div className="flex items-center gap-3 min-w-0">
                <StatusBadge status={issue.severity} size="sm" className="flex-shrink-0"/>
                <span className="truncate font-medium">{issue.description}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transform transition-transform duration-200 ease-in-out group-open:rotate-90 text-slate-400 group-hover:text-purple-400 flex-shrink-0 ml-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </summary>
            <div className="p-4 text-sm space-y-3">
              <p><strong className="text-slate-200/90">WCAG Criteria:</strong> <span className="text-slate-300/80">{issue.wcagCriteria}</span></p>
              {issue.elementSnippet && issue.elementSnippet !== "N/A" && (
                <div>
                  <strong className="text-slate-200/90">Conceptual Element:</strong>
                  <pre className="bg-slate-900/70 p-2 mt-1 rounded-md text-xs text-cyan-300 overflow-x-auto custom-scrollbar border border-slate-600/70 font-mono">{issue.elementSnippet}</pre>
                </div>
              )}
              <div>
                <strong className="text-slate-200/90">Suggestion:</strong>
                <p className="text-slate-300/80 mt-1 bg-slate-600/30 p-2 rounded-md border border-slate-500/40 leading-relaxed">{issue.suggestion}</p>
              </div>
            </div>
          </details>
        ))}
         {report.issues.length === 0 && (
            <p className="text-green-300/90 text-center py-6">No specific accessibility issues were conceptually identified by the AI for this check. This does not guarantee full accessibility; always perform thorough manual and automated testing.</p>
         )}
      </div>
    </>
  );
};

interface ReportViewProps {
  report: Report;
  onReset: () => void;
}

export const ReportView = ({ report, onReset }: ReportViewProps): JSX.Element => {
  let reportSpecificContent: JSX.Element | null = null;
  let reportTitle = "Test Report";

  const downloadHtmlReport = () => {
    const reportContentElement = document.getElementById('report-content-area');
    if (!reportContentElement) {
        alert("Could not find report content to download.");
        return;
    }

    // Create a temporary, more printer-friendly style
    const printStyles = `
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; background-color: #fff; }
        .report-header, .report-details { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; }
        h1, h2, h3, h4 { color: #1a1a1a; }
        h1 { font-size: 24px; } h2 { font-size: 20px; } h3 { font-size: 16px; }
        pre { background-color: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 12px; }
        code { font-family: Consolas, monaco, monospace; }
        ul { padding-left: 20px; } li { margin-bottom: 5px; }
        .grid { display: block; } /* Simplify grid for printing */
        .status-badge { padding: 3px 8px; border-radius: 10px; font-size: 10px; display: inline-block; margin-left: 5px; }
        .status-passed { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status-failed { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .status-critical { background-color: #f5c6cb; color: #721c24; }
        .status-serious { background-color: #ffeeba; color: #856404; }
        .status-moderate { background-color: #bee5eb; color: #0c5460; }
        .status-minor { background-color: #cce5ff; color: #004085; }
        .no-print { display: none !important; } /* Class to hide elements from print */
        /* Add more styles as needed to approximate Tailwind, or use a more comprehensive approach */
    `;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>TestPilot AI Report - ${report.reportType} - ${new Date(report.generatedAt).toLocaleDateString()}</title>
            <style>${printStyles}</style>
        </head>
        <body>
            <h1>TestPilot AI - ${reportTitle}</h1>
            <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
            <p><strong>Target:</strong> ${report.targetUrl || 'N/A'}</p>
            ${report.targetDescription ? `<p><strong>Description:</strong> ${report.targetDescription}</p>` : ''}
            <hr style="margin: 20px 0;"/>
            ${reportContentElement.innerHTML}
            <script>
                // Remove interactive elements or simplify them for static viewing
                document.querySelectorAll('details').forEach(detail => detail.setAttribute('open', 'true'));
                document.querySelectorAll('button').forEach(button => button.style.display = 'none');
            </script>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeFileName = (report.targetUrl?.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_') || 'report_details');
    link.setAttribute("download", `TestPilotAI_${report.reportType}_${safeFileName}_${new Date(report.generatedAt).toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};


  switch (report.reportType) {
    case ReportType.UI:
      reportSpecificContent = <UiTestReportView report={report as UiReport} />;
      reportTitle = "UI Test Simulation Report";
      break;
    case ReportType.API:
      reportSpecificContent = <ApiTestReportView report={report as ApiReport} />;
      reportTitle = "Conceptual API Test Report";
      break;
    case ReportType.LOAD:
      reportSpecificContent = <LoadTestReportDisplay report={report as LoadTestReport} />;
      reportTitle = "Conceptual JMX Plan Report";
      break;
    case ReportType.ACCESSIBILITY:
      reportSpecificContent = <AccessibilityReportDisplay report={report as AccessibilityReport} />;
      reportTitle = "Conceptual Accessibility Check Report";
      break;
    default:
      reportSpecificContent = <p className="text-center text-red-400">Unknown report type. Cannot display details.</p>;
      reportTitle = "Unknown Report Type";
  }

  return (
    <div className="p-4 md:p-6 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-cyan-teal mb-3 sm:mb-0">
          {reportTitle}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
                onClick={downloadHtmlReport}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center justify-center gap-1.5"
                aria-label="Download report as HTML"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Download HTML
            </button>
            <button
                onClick={onReset}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-slate-600/70 hover:bg-slate-500/70 text-slate-100 hover:text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center gap-1.5"
                aria-label="Back to dashboard"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                Dashboard
            </button>
        </div>
      </div>
      
      <div id="report-content-area">
          <div className="report-details mb-6 p-3 bg-slate-700/30 rounded-md border border-slate-600/40 text-xs text-slate-300/80 space-y-1">
              <p><strong>Report ID:</strong> {report.id}</p>
              <p><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</p>
              <p><strong>Target URL:</strong> <span className="text-cyan-400 break-all">{report.targetUrl || "N/A"}</span></p>
              {report.targetDescription && <p><strong>Target Description:</strong> {report.targetDescription}</p>}
          </div>
          {reportSpecificContent}
      </div>
    </div>
  );
};
