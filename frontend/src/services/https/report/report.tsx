// src/services/https/report/report.tsx
import axios from "axios";
import { apiUrl } from "../../api";
import type { ReportInterface } from "../../../interfaces/Report";
import type { ReportTypeInterface } from "../../../interfaces/ReportType";

// -------- Report Types --------
export const getReportTypes = async (): Promise<ReportTypeInterface[]> => {
  try {
    const res = await axios.get(`${apiUrl}/report-types`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching report types:", error);
    throw error;
  }
};

// -------- Reports (lists) --------
export const getReportsAll = async (): Promise<ReportInterface[]> => {
  try {
    const res = await axios.get(`${apiUrl}/reports/`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

export const getReportsByStudent = async (studentId: string): Promise<ReportInterface[]> => {
  if (!studentId) throw new Error("studentId is required");
  try {
    const res = await axios.get(`${apiUrl}/students/reports/${encodeURIComponent(studentId)}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching student reports:", error);
    throw error;
  }
};

export const getReportsByReviewer = async (reviewerId: string): Promise<ReportInterface[]> => {
  if (!reviewerId) throw new Error("reviewerId is required");
  try {
    const res = await axios.get(`${apiUrl}/reviewers/${encodeURIComponent(reviewerId)}/reports`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error fetching reviewer reports:", error);
    throw error;
  }
};

export const getReportById = async (reportId: string): Promise<ReportInterface | null> => {
  if (!reportId) return null;
  try {
    const res = await axios.get(`${apiUrl}/reports/${encodeURIComponent(reportId)}`);
    return res.data as ReportInterface;
  } catch (error) {
    console.error("Error fetching report by id:", error);
    throw error;
  }
};

// -------- Reports (create / update) --------
export type CreateReportPayload = {
  Report_id?: string;
  StudentID: string;
  Reviewer_id: string;
  ReportType_id: string;
  Report_details: string;
  ReportSubmission_date?: string; // ISO
  file?: File | Blob | null;      // optional single file
};

// Always submit multipart form because backend expects PostForm fields
export const createReport = async (payload: CreateReportPayload): Promise<ReportInterface> => {
  try {
    const form = new FormData();
    form.append("student_id", payload.StudentID);
    form.append("report_type_id", payload.ReportType_id);
    form.append("reviewer_id", payload.Reviewer_id);
    form.append("details", payload.Report_details);
    if (payload.ReportSubmission_date) form.append("submittion_date", payload.ReportSubmission_date);
    if (payload.file) form.append("file", payload.file);
    const res = await axios.post(`${apiUrl}/reports/`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return res.data as ReportInterface;
  } catch (error) {
    console.error("Error creating report:", error);
    throw error;
  }
};

export const updateReportStatus = async (reportId: string, status: string): Promise<void> => {
  if (!reportId) throw new Error("reportId is required");
  try {
    await axios.put(`${apiUrl}/reports/${encodeURIComponent(reportId)}/status`, { status });
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
};

// -------- Reviewer helpers --------
export const findReviewerIdByUsername = async (username: string): Promise<string | null> => {
  if (!username) return null;
  try {
    const res = await axios.get(`${apiUrl}/reviewers/by-username/${encodeURIComponent(username)}`);
    const id = res?.data?.reviewer_id ?? res?.data?.Reviewer_id ?? res?.data?.id;
    return id ?? null;
  } catch (error) {
    console.error("Error finding reviewer id by username:", error);
    throw error;
  }
};

export type ReviewerOption = { value: string; label: string };
export const listReviewerOptions = async (): Promise<ReviewerOption[]> => {
  try {
    // Use trailing slash to avoid backend redirect that drops the /api prefix
    const res = await axios.get(`${apiUrl}/reviewers/`);
    const arr = Array.isArray(res.data) ? res.data : [];
    return arr.map((x: any) => ({ value: x.value ?? x.Value ?? x.reviewer_id ?? x.Reviewer_id, label: x.label ?? x.Label ?? x.username ?? "" }));
  } catch (error) {
    console.error("Error listing reviewer options:", error);
    throw error;
  }
};
