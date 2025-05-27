
import React, { useEffect, useRef } from 'react';
import { TestRun, SimulatedTestResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface TestExecutionViewProps {
  testRuns: TestRun[];
  totalTests: number;
}

interface StatusIconProps {
  status: TestRun['runStatus'] | SimulatedTestResult['status'] | 'error';
}

const StatusIcon = ({ status }: StatusIconProps): JSX.Element | null => {
  switch (status) {
    case 'pending':
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 hero-icon" aria-label="Pending"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    case 'running':
      return <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-400 hero-icon" aria-label="Running"></div>;
    case 'passed':
    case 'completed': 
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-400 hero-icon" aria-label="Passed"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    case 'failed':
    case 'error':
      return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 hero-icon" aria-label="Failed"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    default:
      return null;
  }
};

export const TestExecutionView = ({ testRuns, totalTests }: TestExecutionViewProps): JSX.Element => {
  const runningTestRef = useRef<HTMLDivElement>(null);
  const completedCount = testRuns.filter(tr => tr.runStatus === 'completed').length;
  const progress = totalTests > 0 ? (completedCount / totalTests) * 100 : 0;
  const currentRunningTestIndex = testRuns.findIndex(tr => tr.runStatus === 'running');

  useEffect(() => {
    if (runningTestRef.current) {
      runningTestRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentRunningTestIndex]);
  
  if (testRuns.length === 0 && totalTests === 0) {
    return (
      <div className="p-6 md:p-8 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl text-center border border-slate-700/50">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-cyan-teal mb-4">Preparing UI Test Simulation...</h2>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50">
      <h2 className="text-2xl md:text-3xl font-semibold text-gradient-cyan-teal mb-6 text-center">UI Test Simulation in Progress</h2>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-300/80 mb-1.5">
          <span>Overall Progress</span>
          <span>{completedCount} / {totalTests} Simulated</span>
        </div>
        <div className="w-full bg-slate-700/70 rounded-full h-5 shadow-inner overflow-hidden border border-slate-600/50">
          <div
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-fuchsia-500 h-5 rounded-full transition-all duration-500 ease-out flex items-center justify-end text-xs text-white pr-2 shadow-md"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="UI test simulation progress"
          >
           {progress > 10 && `${Math.round(progress)}%`}
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-400px)] min-h-[200px] overflow-y-auto p-1 custom-scrollbar -mr-2 pr-2">
        {testRuns.map((run, index) => {
          let statusLabel: TestRun['runStatus'] | SimulatedTestResult['status'] | 'error' = run.runStatus;
          if (run.runStatus === 'completed') {
            if (run.errorDetails) statusLabel = 'error';
            else if (run.simulatedResult) statusLabel = run.simulatedResult.status;
          }
          const isRunning = run.runStatus === 'running';

          return (
            <div
              key={run.id || index}
              ref={isRunning ? runningTestRef : null}
              className={`p-3.5 rounded-lg shadow-md flex items-center justify-between transition-all duration-300 border ${
                isRunning ? 'bg-pink-700/30 border-pink-500/70 ring-2 ring-pink-500/50 animate-pulseFast' : 
                'bg-slate-700/50 border-slate-600/70 hover:bg-slate-700/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={statusLabel} />
                <span className={`font-medium text-sm ${isRunning ? 'text-pink-200' : 'text-slate-200'}`}>{run.name || `Test Case ${index + 1}`}</span>
              </div>
              <span className={`text-xs font-medium capitalize px-2.5 py-1 rounded-full shadow-sm ${
                statusLabel === 'passed' ? 'text-green-200 bg-green-600/50 ring-1 ring-green-500/60' : 
                statusLabel === 'failed' || statusLabel === 'error' ? 'text-red-200 bg-red-600/50 ring-1 ring-red-500/60' : 
                statusLabel === 'running' ? 'text-pink-100 bg-pink-600/60 ring-1 ring-pink-500/70' : 
                statusLabel === 'completed' ? 'text-green-200 bg-green-600/50 ring-1 ring-green-500/60' : 
                'text-slate-300 bg-slate-600/50 ring-1 ring-slate-500/60'
              }`}>
                {statusLabel.replace(/_/g, ' ')}
              </span>
            </div>
          );
        })}
      </div>
      {completedCount === totalTests && totalTests > 0 && (
         <div className="mt-8 text-center">
            <p className="text-xl text-green-300 font-semibold animate-bounce">Simulation Complete!</p>
            <p className="text-slate-300/80 mt-2">Generating your UI test report...</p>
            <div className="mt-4 inline-block">
              <LoadingSpinner />
            </div>
         </div>
      )}
      <style>{`
        @keyframes pulseFast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulseFast { animation: pulseFast 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
};