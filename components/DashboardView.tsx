

import React, { useMemo } from 'react';
import { Report, AutomationTip, ReportType, UiReport, ApiReport, LoadTestReport, AppView, BaseReport, AccessibilityReport } from '../types'; 
import { ApiKeyInstructions } from './ApiKeyInstructions';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardViewProps {
  reports: Report[];
  onViewReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onStartNewUiTestProject: () => void;
  onNavigateToApiLab: () => void;
  onNavigateToLoadTest: () => void;
  onNavigateToCodeSecurityScan: () => void;
  onNavigateToAccessibilityChecker: () => void; 
  apiKeyAvailable: boolean;
  automationTips: AutomationTip[];
  tipsLoading: boolean;
  tipsError: string | null;
}

interface ReportCardProps {
  report: Report;
  onView: () => void;
  onDelete: () => void;
}

const ReportCard = ({ report, onView, onDelete }: ReportCardProps): JSX.Element => {
  let overallStatus: 'passed' | 'failed' | 'unknown' | 'error' | 'mixed' = 'unknown'; 
  let title = report.targetUrl || "Untitled Project";
  let description = report.targetDescription || "No description provided.";
  let stats: { total: number, passed?: number, failed?: number, critical?: number, serious?: number, moderate?: number, minor?: number } | null = null;
  
  let typeSpecificIcon: JSX.Element = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>;
  let typeLabel: string = "Unknown Report";
  let cardSpecificDetails: JSX.Element | null = null;

  switch (report.reportType) {
    case ReportType.UI:
      const uiRep = report as UiReport;
      overallStatus = uiRep.summary.failed > 0 ? 'failed' : (uiRep.summary.passed > 0 || uiRep.summary.totalTests > 0) ? 'passed' : 'unknown';
      stats = { total: uiRep.summary.totalTests, passed: uiRep.summary.passed, failed: uiRep.summary.failed };
      typeLabel = "UI Test Report";
      typeSpecificIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>;
      break;
    case ReportType.API:
      const apiRep = report as ApiReport;
      overallStatus = apiRep.overallStatus;
      title = apiRep.targetUrl; 
      description = apiRep.targetDescription || `API Test: ${apiRep.apiMethod} ${apiRep.targetUrl.split('?')[0]}`;
      typeLabel = "API Test (Conceptual)";
      typeSpecificIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>;
      cardSpecificDetails = (
        <div className="mb-3 text-xs space-y-1">
            <span className={`inline-block px-2 py-0.5 rounded-full font-semibold mr-2 ${ apiRep.apiMethod === 'GET' ? 'bg-sky-600/40 text-sky-200' : apiRep.apiMethod === 'POST' ? 'bg-green-600/40 text-green-200' : apiRep.apiMethod === 'PUT' ? 'bg-yellow-600/40 text-yellow-200' : apiRep.apiMethod === 'DELETE' ? 'bg-red-600/40 text-red-200' : 'bg-slate-600/40 text-slate-200'}`}>
                {apiRep.apiMethod}
            </span>
            {apiRep.simulatedStatusCode && 
             <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${ apiRep.simulatedStatusCode >= 200 && apiRep.simulatedStatusCode < 300 ? 'bg-green-600/30 text-green-300' : apiRep.simulatedStatusCode >= 400 ? 'bg-red-600/30 text-red-300' : 'bg-slate-600/30 text-slate-300' }`}>
                Status: {apiRep.simulatedStatusCode}
             </span>}
        </div>
      );
      break;
    case ReportType.LOAD:
       const loadRep = report as LoadTestReport;
       overallStatus = 'unknown'; // JMX plan generation doesn't have a simple pass/fail status.
       title = loadRep.targetUrl;
       description = loadRep.targetDescription || `JMX Plan for ${loadRep.inputFileName || loadRep.targetUrl.split('?')[0]}`;
       typeLabel = "JMeter Plan Report";
       typeSpecificIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
       cardSpecificDetails = (
        <div className="mb-3 text-xs text-slate-300/80">
            {loadRep.inputFileName && <p>Input: <span className="font-medium text-pink-300">{loadRep.inputFileName}</span></p>}
            <p>Status: <span className="font-medium text-pink-300">{loadRep.jmxTestPlan ? "JMX Generated" : "Pending"}</span></p>
        </div>
      );
      break;
    case ReportType.ACCESSIBILITY:
      const accRep = report as AccessibilityReport;
      if (accRep.summary.critical > 0 || accRep.summary.serious > 0) {
        overallStatus = 'failed';
      } else if (accRep.summary.moderate > 0 || accRep.summary.minor > 0) {
        overallStatus = 'mixed'; 
      } else if (accRep.summary.totalIssues === 0) {
        overallStatus = 'passed';
      } else {
        overallStatus = 'unknown';
      }
      stats = { 
        total: accRep.summary.totalIssues, 
        critical: accRep.summary.critical, 
        serious: accRep.summary.serious,
        moderate: accRep.summary.moderate,
        minor: accRep.summary.minor
      };
      typeLabel = "Accessibility Check";
      typeSpecificIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3M16.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75H3.75m0 0V8.25m1.5 1.5V8.25m0 0H3.75m0 0V5.25m1.5 3V5.25" /></svg>;
      cardSpecificDetails = (
        <div className="mb-3 text-xs text-slate-300/80">
          <p>Total Issues: <span className="font-medium text-blue-300">{accRep.summary.totalIssues}</span></p>
          {accRep.summary.critical > 0 && <p>Critical: <span className="font-medium text-red-400">{accRep.summary.critical}</span></p>}
        </div>
      );
      break;
    default:
      const baseReport = report as BaseReport;
      console.warn("Unknown report type encountered in ReportCard:", baseReport.reportType);
      return ( // Fallback for unknown report types
        <div className="group bg-slate-700/70 rounded-xl shadow-lg p-5 border border-slate-600/60 transition-all duration-200 ease-in-out hover:shadow-xl hover:border-slate-500">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
              <h3 className="text-lg font-semibold text-red-300 group-hover:text-red-200 transition-colors truncate pr-2" title="Unknown Report">
                Unknown Report Type
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-400/80 mb-1">Report ID: {baseReport.id}</p>
          <p className="text-xs text-slate-500/80 mb-4">
            Type: {String(baseReport.reportType) || 'N/A'} - Date: {new Date(baseReport.generatedAt).toLocaleString()}
          </p>
          <p className="text-sm text-slate-300 mb-4">Could not display details for this report type.</p>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2.5 mt-auto pt-4 border-t border-slate-700/60">
             <button
                onClick={onView}
                className="w-full sm:w-auto px-5 py-2 text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-md transition-all duration-150 ease-in-out"
                aria-label="View details for unknown report"
             >View Details</button>
          </div>
        </div>
      );
  }
  
  let statusBorderColor = 'border-slate-700/80 group-hover:border-slate-600/80';
  let statusDotColor = 'bg-slate-500';

  if (overallStatus === 'passed') {
    statusBorderColor = 'border-green-500/50 group-hover:border-green-500/80';
    statusDotColor = 'bg-green-400';
  } else if (overallStatus === 'failed' || overallStatus === 'error') {
    statusBorderColor = 'border-red-500/50 group-hover:border-red-500/80';
    statusDotColor = 'bg-red-400';
  } else if (overallStatus === 'mixed') {
    statusBorderColor = 'border-yellow-500/50 group-hover:border-yellow-500/80';
    statusDotColor = 'bg-yellow-400';
  }


  return (
    <div className={`group bg-slate-800/70 rounded-xl shadow-lg hover:shadow-purple-500/10 p-5 transition-all duration-300 ease-in-out border ${statusBorderColor} flex flex-col justify-between transform hover:-translate-y-1`}>
      <div>
        <div className="flex justify-between items-start mb-2">
           <div className="flex items-center gap-2 min-w-0">
            {React.cloneElement(typeSpecificIcon, { className: "w-5 h-5 flex-shrink-0"})}
            <h3 className="text-lg font-semibold text-purple-300 group-hover:text-purple-200 transition-colors duration-150 truncate pr-2" title={title}>
              {title.length > 40 ? title.substring(0,37) + "..." : title}
            </h3>
          </div>
          <span className={`w-3 h-3 rounded-full ${statusDotColor} flex-shrink-0 ml-2 mt-1.5 border-2 border-slate-800/70 shadow-sm`} title={`Overall Status: ${overallStatus}`}></span>
        </div>
        <p className="text-xs text-slate-400/80 mb-1 leading-relaxed min-h-[2.25rem] line-clamp-2" title={description}>
          {description}
        </p>
        <p className="text-xs text-slate-500/80 mb-4">
          Run on: {new Date(report.generatedAt).toLocaleString()} ({typeLabel})
        </p>
        
        {cardSpecificDetails}

        {stats && report.reportType === ReportType.UI && (
          <div className="grid grid-cols-3 gap-2.5 text-center mb-5 text-sm">
            <div className="bg-slate-700/60 p-2.5 rounded-md shadow-sm">
              <p className="font-bold text-slate-100 text-lg">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="bg-green-700/30 p-2.5 rounded-md shadow-sm">
              <p className="font-bold text-green-300 text-lg">{stats.passed ?? 0}</p>
              <p className="text-xs text-slate-400">Passed</p>
            </div>
            <div className="bg-red-700/30 p-2.5 rounded-md shadow-sm">
              <p className="font-bold text-red-300 text-lg">{stats.failed ?? 0}</p>
              <p className="text-xs text-slate-400">Failed</p>
            </div>
          </div>
        )}
        {stats && report.reportType === ReportType.ACCESSIBILITY && (
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center mb-5 text-sm">
            <div className="bg-slate-700/60 p-2.5 rounded-md shadow-sm sm:col-span-1">
              <p className="font-bold text-slate-100 text-lg">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Issues</p>
            </div>
             <div className="bg-red-700/30 p-2.5 rounded-md shadow-sm">
              <p className="font-bold text-red-300 text-lg">{stats.critical ?? 0}</p>
              <p className="text-xs text-slate-400">Critical</p>
            </div>
             <div className="bg-yellow-700/30 p-2.5 rounded-md shadow-sm">
              <p className="font-bold text-yellow-300 text-lg">{stats.serious ?? 0}</p>
              <p className="text-xs text-slate-400">Serious</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2.5 mt-auto pt-4 border-t border-slate-700/60">
        <button
          onClick={onDelete}
          className="w-full sm:w-auto px-4 py-2 text-xs bg-red-700/70 hover:bg-red-600/90 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-70 flex items-center justify-center gap-1.5"
          aria-label={`Delete report ${title}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
          Delete
        </button>
        <button
          onClick={onView}
          className="w-full sm:w-auto px-5 py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-md shadow-sm hover:shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-70 flex items-center justify-center gap-1.5"
          aria-label={`View full report for ${title}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
          View Report
        </button>
      </div>
    </div>
  );
};

interface AnalyticsItemProps {
  value: string | number;
  label: string;
  icon: JSX.Element;
  colorClass?: string;
  iconBgClass?: string;
}

const AnalyticsItem = ({value, label, icon, colorClass = 'text-purple-300', iconBgClass = 'bg-slate-700'}: AnalyticsItemProps): JSX.Element => (
  <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg hover:bg-slate-700/80 transition-all duration-200 ease-in-out hover:shadow-xl transform hover:scale-105">
    <div className={`mx-auto w-10 h-10 mb-2.5 flex items-center justify-center rounded-full ${iconBgClass} shadow-md`}>
      {React.cloneElement(icon, { className: "w-5 h-5 text-pink-400"})}
    </div>
    <p className={`text-2xl md:text-3xl font-bold ${colorClass}`}>{value}</p>
    <p className="text-xs text-slate-400/90 mt-1 uppercase tracking-wider">{label}</p>
  </div>
);

interface AnalyticsDisplayProps {
  reports: Report[];
}

const AnalyticsDisplay = ({ reports }: AnalyticsDisplayProps): JSX.Element | null => {
  const analytics = useMemo(() => {
    if (!reports || reports.length === 0) {
      return { totalProjects: 0, totalUiTestCases: 0, overallUiPassRate: 0, overallUiFailRate: 0, avgUiTestsPerProject: 0, totalAccessibilityIssues: 0 };
    }
    const uiReports = reports.filter(r => r.reportType === ReportType.UI) as UiReport[];
    const accessibilityReports = reports.filter(r => r.reportType === ReportType.ACCESSIBILITY) as AccessibilityReport[];

    const totalProjects = reports.length; 
    const totalUiTestCases = uiReports.reduce((sum, report) => sum + report.summary.totalTests, 0);
    const totalUiPassed = uiReports.reduce((sum, report) => sum + report.summary.passed, 0);
    const totalUiFailed = uiReports.reduce((sum, report) => sum + report.summary.failed, 0);
    
    const overallUiPassRate = totalUiTestCases > 0 ? (totalUiPassed / totalUiTestCases) * 100 : 0;
    const overallUiFailRate = totalUiTestCases > 0 ? (totalUiFailed / totalUiTestCases) * 100 : 0;
    const avgUiTestsPerProject = uiReports.length > 0 ? totalUiTestCases / uiReports.length : 0;
    const totalAccessibilityIssues = accessibilityReports.reduce((sum, report) => sum + report.summary.totalIssues, 0);


    return { totalProjects, totalUiTestCases, overallUiPassRate, overallUiFailRate, avgUiTestsPerProject, totalAccessibilityIssues };
  }, [reports]);

  if (analytics.totalProjects === 0) return null; 

  return (
    <div className="mb-10 p-6 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700/50">
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient-cyan-teal mb-6 flex items-center gap-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
        Overall Test Pilot Analytics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 text-center"> 
        <AnalyticsItem value={analytics.totalProjects} label="Total Reports" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6m-6 9h6m-6-6h6m-6 3h6m0 0h6m-6 0H9" /></svg>} colorClass="text-purple-300" iconBgClass="bg-purple-900/60"/>
        <AnalyticsItem value={analytics.totalUiTestCases} label="Total UI Tests" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} colorClass="text-cyan-300" iconBgClass="bg-cyan-900/60"/>
        <AnalyticsItem value={`${analytics.overallUiPassRate.toFixed(1)}%`} label="UI Pass Rate" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} colorClass="text-green-400" iconBgClass="bg-green-900/60"/>
        <AnalyticsItem value={`${analytics.overallUiFailRate.toFixed(1)}%`} label="UI Fail Rate" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} colorClass="text-red-400" iconBgClass="bg-red-900/60"/>
        <AnalyticsItem value={analytics.avgUiTestsPerProject.toFixed(1)} label="Avg. UI Tests/Proj" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>} colorClass="text-pink-300" iconBgClass="bg-pink-900/60"/>
        <AnalyticsItem value={analytics.totalAccessibilityIssues} label="A11Y Issues Logged" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3M16.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75H3.75m0 0V8.25m1.5 1.5V8.25m0 0H3.75m0 0V5.25m1.5 3V5.25" /></svg>} colorClass="text-blue-300" iconBgClass="bg-blue-900/60"/>

      </div>
    </div>
  );
};

interface AiTipsDisplayProps {
  tips: AutomationTip[];
  loading: boolean;
  error: string | null;
  apiKeyAvailable: boolean;
}

const AiTipsDisplay = ({tips, loading, error, apiKeyAvailable}: AiTipsDisplayProps): JSX.Element | null => {
  if (!apiKeyAvailable && tips.length === 0 && !loading && !error) return null;

  return (
    <div className="mb-10 p-6 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700/50">
      <h2 className="text-xl sm:text-2xl font-semibold text-gradient-purple-pink mb-6 flex items-center gap-2.5">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846-.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
        AI Test Automation Insights
      </h2>
      {!apiKeyAvailable && <p className="text-xs text-yellow-400/70 mb-3 text-center p-2 bg-yellow-800/20 rounded-md">API Key not found. These tips are general. AI-powered features are limited.</p>}
      {loading && <div className="flex justify-center items-center p-4"><LoadingSpinner size="md"/></div>}
      {error && <p className="text-red-400/90 text-center bg-red-900/20 p-4 rounded-md">{error}</p>}
      {!loading && !error && tips.length === 0 && <p className="text-slate-400/80 text-center">No AI tips available at the moment.</p>}
      {!loading && !error && tips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map(tip => (
            <div key={tip.id} className="bg-slate-700/50 p-4 rounded-lg shadow-lg hover:shadow-pink-500/10 transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
              {tip.category && <span className="inline-block bg-pink-600/70 text-pink-100 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 shadow-sm">{tip.category}</span>}
              <p className="text-slate-200/90 text-sm leading-relaxed">{tip.tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface LabCardProps {
  title: string;
  description: string;
  icon: JSX.Element;
  onClick: () => void;
  disabled?: boolean;
  isTutorial?: boolean;
}

const LabCard = ({ title, description, icon, onClick, disabled, isTutorial = false }: LabCardProps): JSX.Element => (
    <button
        onClick={onClick}
        disabled={disabled && !isTutorial}
        className={`group bg-slate-800/70 hover:bg-slate-700/90 p-6 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300 ease-in-out border border-slate-700/80 hover:border-purple-500/50 text-left w-full flex flex-col justify-between items-start transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${(disabled && !isTutorial) ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
        <div>
            <div className="flex items-center mb-3">
                <div className={`p-2.5 rounded-lg shadow-md mr-4 transition-all duration-200 ease-in-out group-hover:scale-110 ${isTutorial ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-purple-600 to-pink-600'}`}>
                    {React.cloneElement(icon, { className: "w-6 h-6 text-white"})}
                </div>
                <h3 className={`text-xl font-semibold group-hover:text-purple-300 transition-colors duration-150 ease-in-out ${isTutorial ? 'text-emerald-300' : 'text-slate-100'}`}>{title}</h3>
            </div>
            <p className="text-sm text-slate-400/90 mb-4 leading-relaxed line-clamp-3">{description}</p>
        </div>
        <span className={`mt-auto text-xs font-medium py-1 px-2.5 rounded-full transition-all duration-150 ease-in-out 
            ${(disabled && !isTutorial) ? 'text-yellow-300 bg-yellow-700/40' 
            : isTutorial ? 'text-emerald-200 group-hover:text-emerald-100 group-hover:bg-emerald-600/40 bg-emerald-700/50' 
            : 'text-pink-300 group-hover:text-pink-200 group-hover:bg-pink-600/30 bg-pink-700/40'}`}>
            {(disabled && !isTutorial) ? "API Key Needed" : isTutorial ? "Start Learning" : "Explore Lab"}
            {!(disabled && !isTutorial) && <span aria-hidden="true" className="group-hover:animate-ping-sm once"> &rarr;</span>}
        </span>
    </button>
);


export const DashboardView = ({ 
  reports, 
  onViewReport, 
  onDeleteReport, 
  onStartNewUiTestProject,
  onNavigateToApiLab,
  onNavigateToLoadTest,
  onNavigateToCodeSecurityScan,
  onNavigateToAccessibilityChecker, 
  apiKeyAvailable,
  automationTips,
  tipsLoading,
  tipsError 
}: DashboardViewProps): JSX.Element | null => {

  const labs = [
    { 
      title: "UI Test Studio", 
      description: "Craft and simulate end-to-end UI test cases with AI assistance. Ideal for validating user interface flows and interactions.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>,
      onClick: onStartNewUiTestProject,
      disabled: !apiKeyAvailable
    },
    { 
      title: "API Test Lab", 
      description: "Conceptualize API tests. Define endpoints, generate example scripts (Karate, Rest Assured), and simulate API call outcomes.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
      onClick: onNavigateToApiLab,
      disabled: !apiKeyAvailable 
    },
    { 
      title: "JMeter Plan Generator", 
      description: "Upload a Fiddler trace (.saz) and get an AI-generated JMeter Test Plan (.jmx) for load testing.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
      onClick: onNavigateToLoadTest,
      disabled: !apiKeyAvailable 
    },
    { 
      title: "Code Security Scan", 
      description: "Submit your code snippets for an AI-powered security analysis. Get conceptual feedback on vulnerabilities and best practice suggestions.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
      onClick: onNavigateToCodeSecurityScan,
      disabled: !apiKeyAvailable
    },
    { 
      title: "Accessibility Checker", 
      description: "Perform a conceptual accessibility check on a URL. AI identifies common WCAG issues and provides remediation suggestions.",
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3M16.5 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75H3.75m0 0V8.25m1.5 1.5V8.25m0 0H3.75m0 0V5.25m1.5 3V5.25" /></svg>,
      onClick: onNavigateToAccessibilityChecker,
      disabled: !apiKeyAvailable
    }
  ];


  return (
    <div className="space-y-10">
      {!apiKeyAvailable && <ApiKeyInstructions />}
      
      <div className="p-6 md:p-8 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50">
        <h2 className="text-xl sm:text-2xl font-semibold text-gradient-purple-pink mb-6 flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
          Explore TestPilot AI Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {labs.map(lab => <LabCard key={lab.title} {...lab} />)}
        </div>
      </div>

      <AnalyticsDisplay reports={reports} />
      <AiTipsDisplay tips={automationTips} loading={tipsLoading} error={tipsError} apiKeyAvailable={apiKeyAvailable}/>

      {reports.length > 0 && (
        <div className="p-6 md:p-8 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700/50">
          <h2 className="text-xl sm:text-2xl font-semibold text-gradient-cyan-teal mb-6 flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
            Test Run History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {reports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onView={() => onViewReport(report.id)}
                onDelete={() => onDeleteReport(report.id)}
              />
            ))}
          </div>
        </div>
      )}

      {reports.length === 0 && (
         <div className="text-center py-12 px-4 bg-slate-800/40 rounded-lg shadow-md border border-slate-700/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-500 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v10.5m0 0L9.196 10.5m2.804 3L14.804 10.5m-2.804 3V12m0 1.5V12m0-9v1.5m0 0V3m0 0V1.5m0 0V0" />
          </svg>
          <h3 className="text-xl font-semibold text-slate-300/90 mb-2">No Test Reports Yet</h3>
          <p className="text-slate-400/80 max-w-md mx-auto">
            Start a new test project or explore other features to see your simulation reports here.
          </p>
        </div>
      )}
      <style>{`
        @keyframes ping-sm {
          75%, 100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        .animate-ping-sm {
          animation: ping-sm 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};