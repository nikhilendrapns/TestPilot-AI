
import React, { useState, useEffect } from 'react';
import { TestCase } from '../types';

export interface TestCaseDisplayProps {
  initialTestCases: TestCase[];
  onSaveAndStartTesting: (updatedTestCases: TestCase[]) => Promise<void>;
  onReset: () => void; 
}

interface EditableCodeSnippetProps {
  title: string;
  code?: string;
  language: string;
  onChange: (newCode: string) => void;
}

const EditableCodeSnippet = ({ title, code, language, onChange }: EditableCodeSnippetProps): JSX.Element => {
  return (
    <div className="mt-4">
      <label htmlFor={`${language}-snippet-${title.replace(/\s+/g, '-')}`} className="text-slate-300/80 text-xs block mb-1.5 font-medium tracking-wide">{title}:</label>
      <textarea
        id={`${language}-snippet-${title.replace(/\s+/g, '-')}`}
        value={code || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full bg-slate-900/70 p-3 rounded-md text-xs text-cyan-300 border border-slate-600/80 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none custom-scrollbar font-mono transition-colors shadow-sm placeholder-slate-500/70"
        placeholder={`Enter conceptual ${language} snippet here...`}
      />
      <p className="text-xs text-slate-500/70 mt-1 italic">Note: This is an AI-generated conceptual snippet and may require adjustments.</p>
    </div>
  );
};

export const TestCaseDisplay = ({ initialTestCases, onSaveAndStartTesting, onReset }: TestCaseDisplayProps): JSX.Element => {
  const [editableTestCases, setEditableTestCases] = useState<TestCase[]>([]);

  useEffect(() => {
    setEditableTestCases(JSON.parse(JSON.stringify(initialTestCases))); 
  }, [initialTestCases]);

  const handleInputChange = (testCaseId: string, field: keyof TestCase, value: string) => {
    setEditableTestCases(prevCases =>
      prevCases.map(tc =>
        tc.id === testCaseId ? { ...tc, [field]: value } : tc
      )
    );
  };

  const handleStepChange = (testCaseId: string, stepIndex: number, value: string) => {
    setEditableTestCases(prevCases =>
      prevCases.map(tc =>
        tc.id === testCaseId
          ? {
              ...tc,
              stepsToReproduce: tc.stepsToReproduce.map((step, i) =>
                i === stepIndex ? value : step
              )
            }
          : tc
      )
    );
  };
  
  const handleSnippetChange = (testCaseId: string, snippetType: 'pytestSnippet' | 'robotSnippet', value: string) => {
    setEditableTestCases(prevCases =>
      prevCases.map(tc =>
        tc.id === testCaseId ? { ...tc, [snippetType]: value } : tc
      )
    );
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    if (window.confirm("Are you sure you want to delete this test case? This action cannot be undone from this screen.")) {
        setEditableTestCases(prevCases => prevCases.filter(tc => tc.id !== testCaseId));
    }
  };
  
  const handleAddNewTestCase = () => {
    const newTestCase: TestCase = {
      id: `tc-ui-${crypto.randomUUID()}`,
      name: 'New Custom UI Test Case',
      description: 'A new UI test case added by the user.',
      stepsToReproduce: ['Step 1: Navigate to homepage.', 'Step 2: Click on a specific button.', 'Step 3: Verify the expected outcome.'],
      expectedResult: 'The expected outcome is observed.',
      pytestSnippet: '# Pytest snippet for new custom UI test\\npage.goto("your_url_here")\\n# Add more playwright actions and assertions\\n# expect(page.locator("some_element")).to_be_visible()',
      robotSnippet: '# Robot Framework snippet for new custom UI test\\nOpen Browser    your_url_here    chrome\\n# Add more SeleniumLibrary keywords\\n# Page Should Contain Element    some_element\\n[Teardown]    Close Browser'
    };
    setEditableTestCases(prevCases => [...prevCases, newTestCase]);
  };

  const handleAddStep = (testCaseId: string) => {
    setEditableTestCases(prevCases =>
      prevCases.map(tc =>
        tc.id === testCaseId
          ? { ...tc, stepsToReproduce: [...tc.stepsToReproduce, `New Step ${tc.stepsToReproduce.length + 1}`] }
          : tc
      )
    );
  };

  const handleDeleteStep = (testCaseId: string, stepIndex: number) => {
     setEditableTestCases(prevCases =>
      prevCases.map(tc =>
        tc.id === testCaseId && tc.stepsToReproduce.length > 1 
          ? { ...tc, stepsToReproduce: tc.stepsToReproduce.filter((_, i) => i !== stepIndex) }
          : tc
      )
    );
  }

  if (!initialTestCases || initialTestCases.length === 0 && editableTestCases.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700/50">
        <p className="text-slate-300/90 text-lg">No UI test cases have been generated or added yet.</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <button
              onClick={onReset} 
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800"
              aria-label="Go back to dashboard"
          >
              Back to Dashboard
          </button>
          <button
              onClick={handleAddNewTestCase}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center gap-2"
              aria-label="Add new custom UI test case"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Custom UI Test Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-5 border-b border-slate-700/70">
        <h2 className="text-2xl md:text-3xl font-semibold text-gradient-cyan-teal mb-2 sm:mb-0">Edit & Review UI Test Cases</h2>
         <button
          onClick={onReset}
          className="px-4 py-2 text-sm bg-slate-600/70 hover:bg-slate-500/70 text-slate-100 hover:text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center gap-1.5"
          aria-label="Cancel and go to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
          Dashboard
        </button>
      </div>
      <div className="space-y-5 mb-8 max-h-[calc(100vh-380px)] min-h-[300px] overflow-y-auto p-1 custom-scrollbar -mr-2 pr-2">
        {editableTestCases.map((tc, index) => (
          <details key={tc.id} className="bg-slate-700/50 rounded-lg shadow-lg transition-all duration-300 open:ring-2 open:ring-purple-500/50 open:shadow-purple-500/10 group border border-slate-600/60" open={editableTestCases.length < 3 || index === editableTestCases.length -1 || tc.name.includes('New Custom') }>
            <summary className="font-semibold text-lg text-slate-100 cursor-pointer hover:bg-slate-700/30 flex justify-between items-center list-none -m-px p-4 rounded-t-lg transition-colors group-open:border-b group-open:border-slate-600/70">
              <input 
                type="text"
                value={tc.name}
                onChange={(e) => handleInputChange(tc.id, 'name', e.target.value)}
                className="font-semibold text-lg text-slate-100 bg-transparent border-none focus:ring-0 focus:outline-none p-0 mr-2 flex-grow min-w-0 placeholder-slate-400/80 focus:text-purple-300"
                onClick={(e) => e.stopPropagation()} 
                placeholder="Test Case Name"
                aria-label={`Test case name for ${tc.id}`}
              />
              <div className="flex items-center flex-shrink-0">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTestCase(tc.id); }}
                    className="p-1.5 text-red-400/70 hover:text-red-300 hover:bg-red-600/30 rounded-full transition-colors"
                    aria-label={`Delete test case ${tc.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
                 <span className="transform transition-transform duration-200 group-open:rotate-90 ml-1 text-slate-400 group-hover:text-purple-400" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                 </span>
              </div>
            </summary>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor={`desc-${tc.id}`} className="block text-sm font-medium text-slate-300/80 mb-1.5">Description:</label>
                <textarea
                  id={`desc-${tc.id}`}
                  value={tc.description}
                  onChange={(e) => handleInputChange(tc.id, 'description', e.target.value)}
                  rows={3}
                  placeholder="Detailed description of the test case..."
                  className="w-full p-2.5 bg-slate-600/40 border border-slate-500/60 rounded-md text-slate-100 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none custom-scrollbar transition-colors shadow-sm placeholder-slate-400/70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300/80 mb-1.5">Steps to Reproduce:</label>
                {tc.stepsToReproduce.map((step, i) => (
                  <div key={`${tc.id}-step-${i}`} className="flex items-center space-x-2 mb-2 group">
                    <span className="text-slate-400/70 text-sm select-none flex-shrink-0 w-6 text-right">{i + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(tc.id, i, e.target.value)}
                      placeholder="Enter test step"
                      className="flex-grow p-2.5 bg-slate-600/40 border border-slate-500/60 rounded-md text-slate-100 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors shadow-sm placeholder-slate-400/70"
                      aria-label={`Step ${i + 1} for test case ${tc.name}`}
                    />
                    <button 
                        onClick={() => handleDeleteStep(tc.id, i)}
                        disabled={tc.stepsToReproduce.length <= 1}
                        className="p-1.5 text-red-400/60 hover:text-red-300 hover:bg-red-600/20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        aria-label={`Delete step ${i + 1} for test case ${tc.name}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                 <button 
                    onClick={() => handleAddStep(tc.id)}
                    className="mt-1 px-3 py-1.5 text-xs bg-purple-700/70 hover:bg-purple-600/70 text-white rounded-md shadow hover:shadow-md transition-all flex items-center gap-1.5"
                    aria-label={`Add step to test case ${tc.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Step
                </button>
              </div>
              <div>
                <label htmlFor={`expected-${tc.id}`} className="block text-sm font-medium text-slate-300/80 mb-1.5">Expected Result:</label>
                <textarea
                  id={`expected-${tc.id}`}
                  value={tc.expectedResult}
                  onChange={(e) => handleInputChange(tc.id, 'expectedResult', e.target.value)}
                  rows={2}
                  placeholder="Define the expected outcome..."
                  className="w-full p-2.5 bg-slate-600/40 border border-slate-500/60 rounded-md text-slate-100 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none custom-scrollbar transition-colors shadow-sm placeholder-slate-400/70"
                />
              </div>
              
              <EditableCodeSnippet title="Suggested Pytest Snippet (Conceptual)" code={tc.pytestSnippet} language="python" onChange={(newCode) => handleSnippetChange(tc.id, 'pytestSnippet', newCode)} />
              <EditableCodeSnippet title="Suggested Robot Framework Snippet (Conceptual)" code={tc.robotSnippet} language="robotframework" onChange={(newCode) => handleSnippetChange(tc.id, 'robotSnippet', newCode)} />
            </div>
          </details>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t border-slate-700/70">
        <button
            onClick={handleAddNewTestCase}
            className="w-full sm:w-auto px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-800 text-md flex items-center justify-center gap-2 transform hover:scale-105"
            aria-label="Add new custom UI test case"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Custom UI Test Case
        </button>
        <button
          onClick={() => onSaveAndStartTesting(editableTestCases)}
          disabled={editableTestCases.length === 0}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 via-emerald-600 to-green-500 hover:from-green-600 hover:via-emerald-700 hover:to-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-500/50 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg transform hover:scale-105"
          aria-label="Save changes and start simulating UI tests"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
          </svg>
          {editableTestCases.length === 0 ? "Add Tests to Start" : "Save & Start UI Simulation"}
        </button>
      </div>
    </div>
  );
};