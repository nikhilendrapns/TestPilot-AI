
import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { TestCase, SimulatedTestResult, AutomationTip, ApiReport, LoadTestReport, ReportType, CodeScanResult, SecurityFlaw, AccessibilityReport, AccessibilityIssue } from '../types';

if (!process.env.API_KEY) {
  console.error("Gemini API Key (process.env.API_KEY) is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const modelName = 'gemini-2.5-flash-preview-04-17';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
];

const parseJsonFromText = <T>(text: string, context: string): T => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error(`Failed to parse JSON response for ${context}:`, e, "Original text:", text);
    throw new Error(`AI returned an invalid JSON format for ${context}. Please check the console for details. The AI said: "${text}"`);
  }
};

export const generateTestCases = async (url: string, description: string): Promise<TestCase[]> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");
  
  const prompt = `
    You are an expert QA Engineer AI specializing in web application testing.
    Your task is to interpret the user's natural language description of a website and key features/user journeys to generate a concise list of 3 to 5 critical and diverse end-to-end UI test cases.

    Target Website URL: ${url}
    User's Description of Website and Features/Journeys to Test: "${description}"

    Based on the user's description, generate test cases that cover the core functionalities and user flows mentioned.
    For each test case, please provide:
    1.  "id": A unique identifier string (e.g., "E2E-LOGIN-001").
    2.  "name": A short, descriptive name for the test case (e.g., "Successful User Login and Dashboard Verification").
    3.  "description": A brief explanation of what this end-to-end test case covers.
    4.  "stepsToReproduce": An array of strings, where each string is a clear, sequential step to perform the test. These steps should form a complete user journey.
    5.  "expectedResult": A string describing the expected outcome after completing all steps of the journey.
    6.  "pytestSnippet": A brief, illustrative Pytest code snippet (using Playwright for browser interaction) for this test case. This is a conceptual example.
    7.  "robotSnippet": A brief, illustrative Robot Framework code snippet (using SeleniumLibrary) for this test case. This is a conceptual example.

    Return your response as a single JSON array of these test case objects. Do not include any introductory text, explanations, or markdown formatting outside of the JSON array itself.
    Focus on the core logic for the snippets. Assume necessary imports and setup are handled elsewhere.
    Ensure the test cases are truly end-to-end based on the user's input if possible. If the description is vague, create reasonable, common end-to-end scenarios.
  `;

  try {
    const finalResponse: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
        topP: 0.95,
        topK: 40
      }
    });

    const rawTestCases = parseJsonFromText<Partial<TestCase>[]>(finalResponse.text, "UI test case generation");
    
    return rawTestCases.map((tc, index) => ({
        id: tc.id || `tc-ui-${crypto.randomUUID()}`,
        name: tc.name || `Generated UI Test Case ${index + 1}`,
        description: tc.description || 'No description provided.',
        stepsToReproduce: Array.isArray(tc.stepsToReproduce) && tc.stepsToReproduce.every(s => typeof s === 'string') ? tc.stepsToReproduce : ['No steps provided.'],
        expectedResult: tc.expectedResult || 'No expected result provided.',
        pytestSnippet: tc.pytestSnippet || "# AI did not provide a Pytest snippet.",
        robotSnippet: tc.robotSnippet || "# AI did not provide a Robot Framework snippet."
    })).slice(0, 10);

  } catch (error) {
    console.error('Error generating UI test cases:', error);
    if (error instanceof Error) throw new Error(`Failed to generate UI test cases via AI: ${error.message}`);
    throw new Error('An unknown error occurred while generating UI test cases.');
  }
};

export const simulateTestExecution = async (targetUrl: string, testCase: TestCase): Promise<SimulatedTestResult> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");

  const prompt = `
    You are an AI Test Execution Simulator for UI tests.
    Your task is to simulate the execution of a given UI test case on a conceptual website and determine its likely outcome.
    Do not refer to or try to execute the pytestSnippet or robotSnippet. Base your simulation SOLELY on the test case name, description, steps, and expected result.

    Website URL (for context): ${targetUrl}
    Test Case to Simulate:
    - ID: ${testCase.id}
    - Name: "${testCase.name}"
    - Description: "${testCase.description}"
    - Steps to Reproduce: ${JSON.stringify(testCase.stepsToReproduce)}
    - Expected Result: "${testCase.expectedResult}"

    Based on general web development best practices and common issues, simulate this test.
    Provide your response as a single JSON object with the following keys:
    - "testCaseId": (string) The ID of the test case being simulated (use "${testCase.id}").
    - "status": (string) Either "passed" or "failed".
    - "actualResult": (string) A brief, plausible description of what might have happened during the simulation (e.g., "User was logged in successfully and saw the dashboard." or "Login button was unresponsive."). Be descriptive, as if providing a log.
    - "healingSuggestion": (string, optional) If the status is "failed", provide a concise, actionable suggestion for a developer on what might be wrong or how to fix the issue related to the test. If "passed", this can be null or an empty string.

    Return ONLY the JSON object. No extra text or markdown.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
        topP: 0.9,
        topK: 40
      }
    });

    const result = parseJsonFromText<Partial<SimulatedTestResult>>(response.text, `UI test simulation for ${testCase.id}`);
    
    return {
        testCaseId: result.testCaseId || testCase.id,
        status: (result.status === 'passed' || result.status === 'failed') ? result.status : 'failed',
        actualResult: result.actualResult || 'Simulation did not provide an actual result.',
        healingSuggestion: result.healingSuggestion || null
    };

  } catch (error) {
    console.error(`Error simulating UI test case ${testCase.id}:`, error);
     if (error instanceof Error) throw new Error(`AI simulation failed for UI test ${testCase.name}: ${error.message}`);
    throw new Error(`An unknown error occurred during AI simulation for UI test ${testCase.name}.`);
  }
};

export const getGeneralTestAutomationTips = async (): Promise<AutomationTip[]> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");
  const prompt = `
    You are an AI QA Automation Expert.
    Your task is to provide EXACTLY 3 general, actionable best practice tips for web test automation.
    For EACH of the 3 tips, you MUST provide the following JSON structure, ensuring EACH tip object is complete, valid, and contains all specified fields:
    {
      "id": "A unique identifier string (e.g., TIP-001)",
      "tip": "The best practice tip itself (a concise sentence or two).",
      "category": "A short category for the tip (e.g., Selectors, Test Design, CI/CD, Architecture)."
    }
    
    Return your response as a single, valid JSON array containing these 3 tip objects. 
    Critical JSON Formatting Rules:
    1. The entire response MUST be a single JSON array, starting with '[' and ending with ']'.
    2. The array MUST contain EXACTLY 3 JSON objects.
    3. Each object MUST start with '{' and end with '}', and contain ALL THREE fields: "id", "tip", and "category".
    4. All string values (keys and values like "id", "TIP-001", "tip", "Selectors", etc.) MUST be enclosed in double quotes.
    5. Key-value pairs within each object MUST be separated by commas (e.g., "id": "value", "tip": "value").
    6. The 3 objects within the array MUST be separated by commas. For example: [ {object1}, {object2}, {object3} ].
    7. There should be NO trailing commas after the last key-value pair in an object, NOR after the last object in the array.
    8. NO other text, explanations, or markdown formatting (like \`\`\`json) should be included ANYWHERE in the response. The response must be ONLY the JSON array.
    9. Double-check for missing commas between objects or unclosed quotes/braces. A common error is forgetting the comma between the first and second, or second and third objects. Another common error is extraneous text appearing between objects. Each object must immediately follow a comma (if not the first object) or the opening bracket.
    The entire response MUST be parsable by JSON.parse().
  `;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.9,
        topK: 50,
        // Ensure thinking is enabled for higher quality, if not already default for this model
        // thinkingConfig: { thinkingBudget: undefined } // Or omit if default is sufficient
      }
    });
    const rawTips = parseJsonFromText<Partial<AutomationTip>[]>(response.text, "general automation tips");
    
    // Validate and ensure exactly 3 tips are processed correctly
    const validatedTips: AutomationTip[] = [];
    if (Array.isArray(rawTips)) {
        for (let i = 0; i < Math.min(rawTips.length, 3); i++) {
            const rt = rawTips[i];
            if (rt && typeof rt.tip === 'string') { // Basic validation
                 validatedTips.push({
                    id: rt.id || `tip-${crypto.randomUUID()}-${i}`,
                    tip: rt.tip,
                    category: rt.category || 'General'
                });
            }
        }
    }
    // If AI didn't provide enough valid tips, fill with placeholders if necessary, though the prompt requests exactly 3.
    // For now, we rely on the AI adhering to "EXACTLY 3".
    return validatedTips.slice(0,3); // Ensure we only take up to 3.

  } catch (error) {
    console.error('Error fetching general automation tips:', error);
    if (error instanceof Error) throw new Error(`Failed to fetch automation tips via AI: ${error.message}`);
    throw new Error('An unknown error occurred while fetching automation tips.');
  }
};

export const conceptualizeApiTest = async (
  apiUrl: string,
  method: string,
  headers: string,
  body: string,
  description: string
): Promise<Omit<ApiReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType' | 'apiMethod' | 'requestHeadersPreview' | 'requestBodyPreview'>> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");

  const prompt = `
    You are an AI API Testing Specialist. Your task is to conceptualize an API test based on user inputs.
    This is for conceptual generation and is separate from any live API calls the user might perform.
    
    User Inputs for Conceptualization:
    - API Endpoint URL: ${apiUrl}
    - HTTP Method: ${method}
    - Headers (as JSON string or "None provided"): ${headers}
    - Request Body (as string or "Not applicable..."): ${body}
    - Test Description/Focus: ${description || "Test the API endpoint conceptually."}

    Based on these inputs, provide a conceptual API test. Return your response as a single JSON object.
    You MUST return ALL of the following keys in the JSON object. If you cannot determine a value, use a placeholder string like "AI could not determine", an empty array [], or a default status like 500. DO NOT OMIT ANY KEYS.
    Ensure all string values are properly escaped for JSON.
    - "conceptualScript": (string) A brief, illustrative API test script snippet. If the user's description implies a BDD style, use Karate-like Gherkin syntax. Otherwise, a generic script or pseudocode for Rest Assured/Requests is fine. Example: "Feature: API Test\\nScenario: Get user data\\nGiven url '${apiUrl}'\\nWhen method ${method}\\nThen status 200". This script is purely conceptual. Make it plausible for the given method and URL.
    - "simulatedStatusCode": (number) A plausible HTTP status code for this *conceptual* request (e.g., 200, 201, 400, 404, 500). Default to 500 if unsure. Base this on the method (e.g. POST might be 201).
    - "simulatedResponsePreview": (string) A brief, mock JSON response preview (around 3-5 lines of JSON) that aligns with the simulated status code and typical API responses. If status suggests an error, make the response reflect that. This is a *mock* response. If unsure, return a generic error JSON like '{"error": "conceptual error", "message": "AI could not simulate specific response."}'. Ensure this is a valid JSON string.
    - "conceptualTestSteps": (array of objects) An array of 2-4 conceptual test steps (Cucumber-like) with their simulated status. Each object should have "step" (string), "status" (string: "passed" or "failed"), and optionally "details" (string). Example: [{ "step": "Conceptual request prepared for endpoint", "status": "passed" }, { "step": "Simulated response status code is 200", "status": "passed" }]. These are *simulated* steps. If unsure, return an empty array or a single step indicating uncertainty.
    - "overallStatus": (string) The overall *conceptual* status of this test, either "passed", "failed", or "error". If the simulatedStatusCode is >= 400, it should generally be "failed". Default to "error" if unsure.

    Return ONLY the JSON object. No extra text, no markdown formatting, just the raw JSON. Be concise but ensure all keys are present and the JSON is valid.
  `;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
        topP: 0.95,
        topK: 40
      }
    });
    const result = parseJsonFromText<Partial<Omit<ApiReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType' | 'apiMethod' | 'requestHeadersPreview' | 'requestBodyPreview'>>>(response.text, "conceptual API test");
    
    const defaultSteps = [{step: "AI did not provide specific conceptual steps.", status: 'failed' as 'passed' | 'failed'}];
    const defaultOverallStatus = (result.simulatedStatusCode !== undefined && result.simulatedStatusCode >= 400 ? 'failed' : 'error') as 'passed' | 'failed' | 'error';


    return {
      simulatedStatusCode: result.simulatedStatusCode !== undefined ? result.simulatedStatusCode : 500,
      simulatedResponsePreview: result.simulatedResponsePreview || '{ "message": "AI did not provide a specific conceptual response preview." }',
      conceptualScript: result.conceptualScript || "# AI did not provide a specific conceptual script for the API test.",
      conceptualTestSteps: Array.isArray(result.conceptualTestSteps) && result.conceptualTestSteps.length > 0 ? 
                           result.conceptualTestSteps.map(s => ({step: s.step || "Unknown conceptual step by AI", status: (s.status === 'passed' || s.status === 'failed') ? s.status : 'failed', details: s.details })) : 
                           defaultSteps,
      overallStatus: (result.overallStatus === 'passed' || result.overallStatus === 'failed' || result.overallStatus === 'error') ? result.overallStatus : defaultOverallStatus
    };
  } catch (error) {
    console.error('Error conceptualizing API test:', error);
    if (error instanceof Error) throw new Error(`Failed to conceptualize API test via AI: ${error.message}`);
    throw new Error('An unknown error occurred while conceptualizing API test.');
  }
};

export const generateJmeterTestPlanFromFiddler = async (
  targetUrl: string,
  fiddlerFileName: string,
  userDescription: string
): Promise<Omit<LoadTestReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType' | 'inputFileName'>> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");

  const prompt = `
    You are an AI Performance Engineering Specialist experienced with JMeter and Fiddler.
    Your task is to generate a conceptual JMeter Test Plan (.jmx file content as an XML string) based on an imagined Fiddler capture.
    
    The user has provided:
    - Target Application URL (general hint): ${targetUrl}
    - Fiddler File Name (for context, imagine its contents, e.g., if it's 'login_flow.saz', imagine login requests): ${fiddlerFileName}
    - User Description of Application/Flows to test: "${userDescription}"

    Based on this information, imagine the typical HTTP requests (endpoints, methods, common parameters for the described application flow) that would be captured in such a Fiddler file.
    Then, generate the XML content for a JMeter Test Plan (.jmx) that would simulate these requests.
    The JMX should include:
    1.  A TestPlan element (version="1.2", propertiesVersion="5.0", jmeter="5.x").
    2.  A ThreadGroup (e.g., name="User Group 1") with reasonable default values: num_threads="10", ramp_time="5", scheduler="false", duration="", delay="", LoopController.loops="1".
    3.  Multiple HTTPRequest samplers ( guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="E.g., HTTP Request - Login Page") corresponding to the imagined requests.
        - For each sampler, set the domain (extracted from targetUrl or common subdomains like 'api.' if applicable), path, method (GET, POST etc.).
        - If POST/PUT, include a conceptual <boolProp name="HTTPSampler.postBodyRaw">true</boolProp> and Arguments with a JSON body in <elementProp name="HTTPsampler.Arguments" elementType="Arguments"> <collectionProp name="Arguments.arguments"> <elementProp name="body" elementType="HTTPArgument"> <stringProp name="Argument.value">{ "exampleParam": "exampleValue" }</stringProp> ... </elementProp> </collectionProp> </elementProp>.
        - Include a HeaderManager ( guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager") for common headers like User-Agent.
    4.  (Recommended) A ViewResultsFullVisualizer (View Results Tree - guiclass="ViewResultsFullVisualizer" testclass="ViewResultsFullVisualizer" testname="View Results Tree").

    Provide your response as a single JSON object with the following keys:
    - "jmxTestPlan": (string) The complete XML content of the .jmx file. This XML MUST be well-formed and valid for JMeter. Ensure proper XML escaping within the JSON string (e.g., use &lt; for <, &gt; for >, &amp; for &). It must start with <?xml version="1.0" encoding="UTF-8"?> and be wrapped in <jmeterTestPlan>.
    - "summaryMessage": (string) A brief summary of what the generated JMX plan conceptually covers (e.g., "Generated JMX plan for login and product search flow with 10 users, targeting ${targetUrl}.").

    Return ONLY the JSON object. No extra text or markdown. Be concise. Ensure the XML for jmxTestPlan is a single, continuous string.
    Focus on creating a structurally valid and plausible JMX.
  `;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6, 
        topP: 0.95,
        topK: 50 
      }
    });
    const result = parseJsonFromText<Partial<Omit<LoadTestReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType' | 'inputFileName'>>>(response.text, "JMeter test plan generation");
    
    const defaultJMXPlan = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.2">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="AI Conceptual Test Plan for ${targetUrl}" enabled="true">
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Conceptual User Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">10</stringProp>
        <stringProp name="ThreadGroup.ramp_time">5</stringProp>
        <boolProp name="ThreadGroup.delayedStart">false</boolProp>
        <boolProp name="ThreadGroup.scheduler">false</boolProp>
        <stringProp name="ThreadGroup.duration"></stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="HTTP Request - Imagined from ${fiddlerFileName}" enabled="true">
          <stringProp name="HTTPSampler.domain">${targetUrl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0]}</stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol">${targetUrl.startsWith('https') ? 'https' : 'http'}</stringProp>
          <stringProp name="HTTPSampler.path">${targetUrl.replace(/^(?:https?:\/\/)?(?:www\.)?[^/]+/i, '') || '/'}</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <boolProp name="HTTPSampler.BROWSER_COMPATIBLE_MULTIPART">false</boolProp>
          <boolProp name="HTTPSampler.image_parser">false</boolProp>
          <boolProp name="HTTPSampler.concurrentDwn">false</boolProp>
          <stringProp name="HTTPSampler.concurrentPool">6</stringProp>
          <boolProp name="HTTPSampler.md5">false</boolProp>
          <intProp name="HTTPSampler.connect_timeout"></intProp>
          <intProp name="HTTPSampler.response_timeout"></intProp>
        </HTTPSamplerProxy>
        <hashTree/>
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

    return {
      jmxTestPlan: result.jmxTestPlan || defaultJMXPlan,
      summaryMessage: result.summaryMessage || `AI generated a conceptual JMX plan for ${fiddlerFileName} targeting ${targetUrl}. Please review and customize.`
    };
  } catch (error) {
    console.error('Error generating JMX test plan:', error);
    if (error instanceof Error) throw new Error(`Failed to generate JMX test plan via AI: ${error.message}`);
    throw new Error('An unknown error occurred while generating JMX test plan.');
  }
};


export const scanCodeForSecurityFlaws = async (codeContent: string, fileName?: string): Promise<Omit<CodeScanResult, 'fileName' | 'scannedAt'>> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");

  const languageHint = fileName ? `The code is likely from a file named '${fileName}'. Please infer the language if possible.` : "The language of the code is unknown, please attempt to identify it or analyze generically.";

  const prompt = `
    You are an expert Code Security Analyst AI.
    Your task is to analyze the provided code snippet for potential security vulnerabilities and suggest improvements based on best practices. This is a conceptual static analysis.

    ${languageHint}
    
    Code to Analyze:
    \`\`\`
    ${codeContent}
    \`\`\`

    Please perform the following:
    1.  Identify potential security flaws (e.g., OWASP Top 10 vulnerabilities like XSS, SQL Injection, Insecure Deserialization, Path Traversal, Command Injection, Broken Authentication, Sensitive Data Exposure, Security Misconfiguration, etc., or other common coding vulnerabilities).
    2.  For each flaw, provide:
        a.  "id": A unique identifier string for the flaw (e.g., "FLAW-001").
        b.  "description": A clear, concise description of the security flaw.
        c.  "severity": Assign a severity level: "High", "Medium", "Low", "Informational", or "Unknown".
        d.  "codeSnippet": (Optional) The specific problematic code snippet if identifiable. If it's a general flaw, this can be omitted or refer to a broader section.
        e.  "lineNumber": (Optional) An approximate line number or range where the flaw occurs if you can determine it. This might be difficult, so provide your best estimate or omit.
        f.  "explanation": A detailed explanation of why this code is a vulnerability and the potential impact.
        g.  "suggestion": A clear, actionable suggestion on how to fix the flaw. Include improved code examples where appropriate.
        h.  "bestPractices": (Optional) An array of strings listing relevant security best practices (e.g., "Input Validation", "Output Encoding", "Parameterized Queries", "Principle of Least Privilege", "Use HTTPS", "Secure Error Handling").
    3.  Provide an overall "summary" of the code's security posture based on your conceptual analysis.
    4.  (Optional) "languageDetected": If you can confidently identify the programming language, include it.

    Return your response as a single JSON object structured like this:
    {
      "summary": "Overall assessment...",
      "languageDetected": "e.g., Python", 
      "flaws": [
        {
          "id": "FLAW-001",
          "description": "...",
          "severity": "High",
          "codeSnippet": "...", 
          "lineNumber": "10-12", 
          "explanation": "...",
          "suggestion": "...",
          "bestPractices": ["Input Validation"] 
        }
      ]
    }

    If no obvious flaws are found, return an empty "flaws" array and a summary indicating that.
    Focus on providing practical and actionable advice. Ensure the entire output is a valid JSON object.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3, 
        topP: 0.95,
        topK: 40,
        safetySettings: safetySettings
      }
    });

    const result = parseJsonFromText<Partial<Omit<CodeScanResult, 'fileName' | 'scannedAt'>>>(response.text, "code security scan");
    
    const validatedFlaws: SecurityFlaw[] = (result.flaws || []).map((flaw) => ({
      id: flaw.id || `flaw-${crypto.randomUUID()}`,
      description: flaw.description || "No description provided by AI.",
      severity: flaw.severity || 'Unknown',
      codeSnippet: flaw.codeSnippet,
      lineNumber: flaw.lineNumber,
      explanation: flaw.explanation || "No explanation provided by AI.",
      suggestion: flaw.suggestion || "No specific suggestion provided by AI.",
      bestPractices: Array.isArray(flaw.bestPractices) ? flaw.bestPractices : []
    }));

    return {
      summary: result.summary || "AI did not provide an overall summary.",
      languageDetected: result.languageDetected,
      flaws: validatedFlaws
    };

  } catch (error) {
    console.error('Error scanning code for security flaws:', error);
    if (error instanceof Error) throw new Error(`Failed to scan code via AI: ${error.message}`);
    throw new Error('An unknown error occurred while scanning code for security flaws.');
  }
};

export const conceptualizeAccessibilityCheck = async (
  url: string, 
  description?: string
): Promise<Omit<AccessibilityReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType'>> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured for Gemini service.");

  const focusArea = description ? `User has specified a focus area: "${description}". Prioritize issues related to this area if applicable, but also perform a general conceptual check.` : "Perform a general conceptual accessibility check of the page.";

  const prompt = `
    You are an AI Web Accessibility Specialist (QA).
    Your task is to conceptually analyze a given URL for common web accessibility issues based on WCAG 2.1/2.2 guidelines. This is a conceptual analysis, not a live page crawl.
    When identifying issues, consider how they would impact users with various disabilities (e.g., visual, auditory, motor, cognitive).

    Target URL (for context): ${url}
    ${focusArea}

    Please identify 5 to 10 distinct, common accessibility issues that might be present on a typical webpage with this URL structure or description.
    For each identified issue, provide:
    1.  "id": A unique identifier (e.g., "A11Y-IMG-001").
    2.  "description": A clear, concise description of the accessibility issue.
    3.  "severity": Assign a severity: "Critical", "Serious", "Moderate", or "Minor".
    4.  "wcagCriteria": The primary WCAG 2.1/2.2 Success Criterion this issue relates to (e.g., "1.1.1 Non-text Content (Level A)", "2.4.4 Link Purpose (In Context) (Level A)", "4.1.2 Name, Role, Value (Level A)"). Include the level (A, AA, AAA).
    5.  "elementSnippet": (Optional) A short, conceptual HTML snippet of what a problematic element *might* look like. E.g., "<img src='icon.png'>", "<button>Click</button>". Keep it very brief. If not applicable, omit or use "N/A".
    6.  "suggestion": A clear, actionable suggestion on how to remediate this type of issue.

    After detailing the issues, provide an overall "summary" object with counts of issues by severity:
    - "totalIssues": (number) Total number of issues identified.
    - "critical": (number) Count of 'Critical' issues.
    - "serious": (number) Count of 'Serious' issues.
    - "moderate": (number) Count of 'Moderate' issues.
    - "minor": (number) Count of 'Minor' issues.

    Return your response as a single JSON object structured like this:
    {
      "summary": { "totalIssues": ..., "critical": ..., "serious": ..., "moderate": ..., "minor": ... },
      "issues": [
        { "id": "...", "description": "...", "severity": "...", "wcagCriteria": "...", "elementSnippet": "...", "suggestion": "..." }
      ]
    }

    Return ONLY the JSON object. No extra text, no markdown formatting, just the raw JSON. Ensure the JSON is valid and all specified keys are present. Be concise and focus on common, impactful issues.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
        topP: 0.95,
        topK: 50,
        safetySettings: safetySettings,
      }
    });

    const result = parseJsonFromText<Partial<Omit<AccessibilityReport, 'id' | 'generatedAt' | 'targetUrl' | 'targetDescription' | 'reportType'>>>(response.text, "conceptual accessibility check");
    
    const validatedIssues: AccessibilityIssue[] = (result.issues || []).map((issue, index) => ({
      id: issue.id || `A11Y-${Date.now()}-${index}`,
      description: issue.description || "No description provided.",
      severity: issue.severity && ['Critical', 'Serious', 'Moderate', 'Minor'].includes(issue.severity) ? issue.severity : 'Moderate',
      wcagCriteria: issue.wcagCriteria || "N/A",
      elementSnippet: issue.elementSnippet,
      suggestion: issue.suggestion || "No specific suggestion provided."
    }));

    const summary = {
      totalIssues: validatedIssues.length,
      critical: validatedIssues.filter(i => i.severity === 'Critical').length,
      serious: validatedIssues.filter(i => i.severity === 'Serious').length,
      moderate: validatedIssues.filter(i => i.severity === 'Moderate').length,
      minor: validatedIssues.filter(i => i.severity === 'Minor').length,
    };
    
    const finalSummary = result.summary && typeof result.summary.totalIssues === 'number' ? result.summary : summary;


    return {
      summary: finalSummary as AccessibilityReport['summary'], 
      issues: validatedIssues,
    };

  } catch (error) {
    console.error('Error conceptualizing accessibility check:', error);
    if (error instanceof Error) throw new Error(`Failed to conceptualize accessibility via AI: ${error.message}`);
    throw new Error('An unknown error occurred while conceptualizing accessibility.');
  }
};
