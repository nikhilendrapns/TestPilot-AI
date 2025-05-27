
import { Report } from '../types';

const REPORTS_STORAGE_KEY = 'testPilotAiReports';

export const localStorageService = {
  getReports: (): Report[] => {
    const reportsJson = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (reportsJson) {
      try {
        const parsedReports = JSON.parse(reportsJson) as Report[];
        return parsedReports.filter(r => r && r.id && r.reportType && r.generatedAt);
      } catch (e) {
        console.error("Error parsing reports from localStorage:", e);
        localStorage.removeItem(REPORTS_STORAGE_KEY); 
        return [];
      }
    }
    return [];
  },

  saveReport: (report: Report): Report[] => {
    const reports = localStorageService.getReports();
    const existingIndex = reports.findIndex(r => r.id === report.id);
    if (existingIndex > -1) {
      reports[existingIndex] = report; 
    } else {
      reports.unshift(report); 
    }
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return reports;
  },

  deleteReport: (reportId: string): Report[] => {
    let reports = localStorageService.getReports();
    reports = reports.filter(report => report.id !== reportId);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    return reports;
  },

  getReportById: (reportId: string): Report | undefined => {
    const reports = localStorageService.getReports();
    const foundReport = reports.find(report => report.id === reportId);
    if (foundReport) {
        return foundReport;
    }
    return undefined; // Explicitly return undefined if not found
  }
};