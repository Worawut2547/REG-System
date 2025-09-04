import axios from "axios";

import { apiUrl } from "../../api";
import type { RegistrationInterface } from "../../../interfaces/Registration";

// Helper base URL for optional fallback when apiUrl ends with /api
const rootBase = apiUrl.startsWith("/")
  ? apiUrl
  : (apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl);

interface RegistrationStudentInterface {
    StudentID: string;
    FirstName: string;
    LastName: string;
    MajorName: string;
    FacultyName: string;
    SubjectID?: string;
}

export const getStudentBySubjectID = async (subj_id: string) => {
    try {
        const response = await axios.get(`${apiUrl}/registrations/subjects/${subj_id}`, { headers: { "Cache-Control": "no-cache" }, params: { _ts: Date.now() } });
        console.log("api get student by subject id",response);
        return response
    }
    catch (error) {
        console.error("Error fetching get student by subject id:", error);
        throw error;
    }
}

// ---------------- Student registration helpers (frontend only) ----------------

export type RegistrationCreateItem = { SubjectID: string; SectionID?: number };

export const createRegistration = async (payload: RegistrationInterface) => {
  // Match backend json tags defined in entity.Registration
  const body = {
    Date: payload.Date,
    StudentID: payload.StudentID,
    SubjectID: payload.SubjectID,
    SectionID: payload.SectionID ?? 0,
  };
  try {
    // Use trailing slash to avoid 301/307 redirect on POST
    return (await axios.post(`${apiUrl}/registrations/`, body)).data;
  } catch (e) {
    // fallback base when not using Vite proxy
    return (await axios.post(`${rootBase}/registrations/`, body)).data;
  }
};

export const createRegistrationBulk = async (
  studentId: string,
  items: RegistrationCreateItem[],
) => {
  for (const it of items) {
    const payload: RegistrationInterface = {
      Date: new Date().toISOString(),
      StudentID: studentId,
      SubjectID: it.SubjectID,
      SectionID: it.SectionID ?? 0,
    };
    await createRegistration(payload);
  }
  return true;
};

export const getMyRegistrations = async (studentId: string) => {
  const sid = (studentId || "").trim();
  // Use full list to obtain ID/RegistrationID, then filter by student
  try {
    // Trailing slash to avoid 301 from Gin RedirectTrailingSlash
    const all = (await axios.get(`${apiUrl}/registrations/`, { headers: { "Cache-Control": "no-cache" }, params: { _ts: Date.now() } })).data;
    const arr = Array.isArray(all) ? all : [];
    return arr.filter((r: any) => (r.StudentID ?? r.student_id) === sid);
  } catch (e: any) {
    // Treat 404 (no registrations) as empty list instead of throwing
    if (e?.response?.status === 404) {
      return [] as any[];
    }
    try {
      const all2 = (await axios.get(`${rootBase}/registrations/`, { headers: { "Cache-Control": "no-cache" }, params: { _ts: Date.now() } })).data;
      const arr2 = Array.isArray(all2) ? all2 : [];
      return arr2.filter((r: any) => (r.StudentID ?? r.student_id) === sid);
    } catch (e2: any) {
      if (e2?.response?.status === 404) return [] as any[];
      throw e2;
    }
  }
};

export const deleteRegistration = async (id: number | string) => {
  // Backend DeleteRegistration expects numeric primary key id
  const key = String(id);
  try {
    return (await axios.delete(`${apiUrl}/registrations/${encodeURIComponent(key)}`)).data;
  } catch (e) {
    return (await axios.delete(`${rootBase}/registrations/${encodeURIComponent(key)}`)).data;
  }
};

