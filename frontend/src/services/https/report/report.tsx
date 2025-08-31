import axios from "axios";
import type { ReportInterface } from "../../../interfaces/Report";
import type { ReportTypeInterface } from "../../../interfaces/ReportType";
import type { ReviewerOption } from "../../../interfaces/Reviewer";

const apiUrl = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";


/** ---------- Master lists ---------- */
export const listReportTypes = async (): Promise<ReportTypeInterface[]> => {
  const { data } = await axios.get(`${apiUrl}/report-types`);
  return data;
};

export const listAssignableReviewers = async (): Promise<ReviewerOption[]> => {
  // คืน value=reviewer_id, label=ชื่อ (Teacher/Admin)
  const { data } = await axios.get(`${apiUrl}/reviewers`);
  return data;
};

/** ---------- Reports ---------- */
export const getReports = async (): Promise<ReportInterface[]> => {
  const { data } = await axios.get(`${apiUrl}/reports/`);
  return data;
};

export const getReportById = async (id: string): Promise<ReportInterface> => {
  const { data } = await axios.get(`${apiUrl}/reports/${id}`);
  return data;
};

export const getReportsByStudent = async (sid: string): Promise<ReportInterface[]> => {
  // main.go กำหนด /students/reports/:sid
  const { data } = await axios.get(`${apiUrl}/students/reports/${encodeURIComponent(sid)}`);
  return data;
};

export const getReviewerIdByUsername = async (username: string): Promise<string | null> => {
  if (!username) return null;
  try {
    const { data } = await axios.get<{ reviewer_id: string }>(
      `${apiUrl}/reviewers/by-username/${encodeURIComponent(username)}`
    );
    return data?.reviewer_id ?? null;
  } catch {
    return null;
  }
};

export const getReportsByReviewer = async (rid: string): Promise<ReportInterface[]> => {
  const { data } = await axios.get(`${apiUrl}/reviewers/${encodeURIComponent(rid)}/reports`);
  return data;
};

export const createReport = async (formData: FormData, onProgress?: (p: number) => void) => {
  const { data } = await axios.post(`${apiUrl}/reports`, formData, {
    // อย่าใส่ Content-Type เอง ให้ axios จัดการ boundary
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      onProgress(Math.round((e.loaded * 100) / e.total));
    },
    // ถ้าใช้ cookie auth:
    // withCredentials: true,
  });
  return data;
};

export const updateReport = async (id: string, patch: Partial<ReportInterface>) => {
  const { data } = await axios.put(`${apiUrl}/reports/${id}`, patch);
  return data;
};

export const updateReportStatus = async (id: string, status: string) => {
  // body: { status: "อนุมัติ" | "ไม่อนุมัติ" | "รอดำเนินการ" }
  const { data } = await axios.put(`${apiUrl}/reports/${id}/status`, { status });
  return data;
};

export const deleteReport = async (id: string) => {
  const { data } = await axios.delete(`${apiUrl}/reports/${id}`);
  return data;
};

/** ---------- Helper: path -> public link (/uploads) ---------- */
export const toPublicHref = (pathOrUrl: string): string => {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  if (!pathOrUrl.startsWith("/")) return `${apiUrl}/${pathOrUrl}`;
  return `${apiUrl}${pathOrUrl}`;
};

export async function listReviewers() {
  const res = await fetch(`${apiUrl}/reviewers`);
  if (!res.ok) throw new Error("load reviewers failed");
  return (await res.json()) as { value: string; label: string }[];
}

export async function listMyReports(studentId: string) {
  const res = await fetch(`${apiUrl}/students/reports/${studentId}`);
  if (!res.ok) throw new Error("load student reports failed");
  return await res.json();
}

export async function listAdminReports(reviewerId: string) {
  const res = await fetch(`${apiUrl}/reviewers/${reviewerId}/reports?only=admin`);
  if (!res.ok) throw new Error("load admin reports failed");
  return await res.json();
}
