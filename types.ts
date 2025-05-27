

export interface TestCase {
  id: string;
  name: string;
  description: string;
  stepsToReproduce: string[];
  expectedResult: string;
  pytestSnippet?: string;
  robotSnippet?: string;
}

export interface SimulatedTestResult {
  testCaseId: string;
  status: 'passed' | 'failed';
  actualResult: string;
  healingSuggestion?: string | null;
}

export interface TestRun extends TestCase {
  runStatus: 'pending' | 'running' | 'completed';
  simulatedResult?: SimulatedTestResult;
  errorDetails?: string;
}

export enum ReportType {
  UI = 'UI_TEST',
  API = 'API_TEST_CONCEPTUAL',
  LOAD = 'LOAD_TEST_CONCEPTUAL',
  ACCESSIBILITY = 'ACCESSIBILITY_CONCEPTUAL' 
}

export interface BaseReport {
  id: string; 
  generatedAt: string;
  targetUrl: string; 
  targetDescription: string;
  reportType: ReportType;
}

export interface UiReport extends BaseReport {
  reportType: ReportType.UI;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    pending: number;
  };
  testRuns: TestRun[];
}

export interface ApiReport extends BaseReport {
  reportType: ReportType.API;
  apiMethod: string; 
  requestHeadersPreview?: string; 
  requestBodyPreview?: string; 
  simulatedStatusCode?: number;
  simulatedResponsePreview?: string; 
  conceptualScript?: string; 
  conceptualTestSteps?: { step: string, status: 'passed' | 'failed', details?: string }[];
  overallStatus: 'passed' | 'failed' | 'error';
}

export interface LoadTestReport extends BaseReport {
  reportType: ReportType.LOAD;
  inputFileName?: string; // Name of the uploaded Fiddler .saz file
  jmxTestPlan?: string; // Content of the generated JMX file
  summaryMessage?: string; // AI's summary of the generated plan or conceptual outcome
}

export interface AccessibilityIssue {
  id: string; 
  description: string; 
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor'; 
  wcagCriteria: string; 
  elementSnippet?: string; 
  suggestion: string; 
}

export interface AccessibilityReport extends BaseReport {
  reportType: ReportType.ACCESSIBILITY;
  summary: {
    totalIssues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  issues: AccessibilityIssue[];
}


export type Report = UiReport | ApiReport | LoadTestReport | AccessibilityReport; 


export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INPUT_FORM = 'INPUT_FORM', 
  GENERATING_CASES = 'GENERATING_CASES',
  CASES_REVIEW = 'CASES_REVIEW',
  RUNNING_TESTS = 'RUNNING_TESTS',
  REPORT_VIEW = 'REPORT_VIEW', 
  API_TEST_LAB = 'API_TEST_LAB', 
  LOAD_TEST_SIMULATOR = 'LOAD_TEST_SIMULATOR', 
  CODE_SECURITY_SCAN = 'CODE_SECURITY_SCAN',
  ACCESSIBILITY_CHECKER = 'ACCESSIBILITY_CHECKER' 
}

export interface AutomationTip {
  id: string;
  tip: string;
  category?: string;
}

export interface SecurityFlaw {
  id: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low' | 'Informational' | 'Unknown';
  codeSnippet?: string; 
  lineNumber?: string; 
  explanation: string;
  suggestion: string; 
  bestPractices?: string[]; 
}

export interface CodeScanResult {
  summary: string;
  flaws: SecurityFlaw[];
  fileName?: string; 
  scannedAt: string; 
  languageDetected?: string; 
}