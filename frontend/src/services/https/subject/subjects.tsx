// src/services/https/subject/subjects.tsx
import axios, { AxiosError } from "axios";
import { apiUrl } from "../../api";
import type { SubjectInterface, SectionInterface, StudyTimeInterface } from "../../../interfaces/Subjects";

// คืน base แบบไม่มี /api (ไว้ fallback)
const rootBase = apiUrl.startsWith("/")
  ? apiUrl // when using Vite proxy ('/api'), keep same
  : (apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl);

/** helper: ลองเรียก primary → ถ้าพังลอง fallback */
async function tryBoth<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e: any) {
    const err = e as AxiosError;
    // ลอง fallback เมื่อ 404/Network/หรือ 5xx
    if (!err.response || err.response.status >= 400) {
      return await fallback();
    }
    throw e;
  }
}

// ---------- CRUD / Query ----------

// ดึงรายวิชาทั้งหมด
export const getSubjectAll = async (): Promise<SubjectInterface[]> => {
  const normalizeRow = (raw: any): SubjectInterface => {
    const id = raw.SubjectID ?? raw.subject_id ?? raw.id ?? "";
    const name = raw.SubjectName ?? raw.subject_name ?? raw.name ?? "";
    const credit = Number(raw.Credit ?? raw.credit ?? 0);
    return {
      SubjectID: String(id),
      SubjectName: String(name),
      Credit: Number.isFinite(credit) ? credit : 0,
      MajorID: raw.MajorID ?? raw.major_id,
      FacultyID: raw.FacultyID ?? raw.faculty_id,
    } as SubjectInterface;
  };

  const normalizeList = (data: any): SubjectInterface[] => {
    const arr = Array.isArray(data) ? data : [];
    return arr.map(normalizeRow);
  };

  return tryBoth(
    async () => normalizeList((await axios.get(`${apiUrl}/subjects`)).data),
    async () => normalizeList((await axios.get(`${rootBase}/subjects`)).data)
  );
};

// ดึงรายวิชาตามรหัส (รวม Sections + StudyTimes)
export const getSubjectById = async (subjectId: string): Promise<SubjectInterface | null> => {
  const code = (subjectId || "").trim().toUpperCase();
  if (!code) return null;

  // ตัวช่วยแปลง key จาก backend (snake_case) -> interface ที่ frontend ใช้
  const normalize = (raw: any): SubjectInterface => {
    if (!raw || typeof raw !== "object") return raw as SubjectInterface;
    const subjectId = raw.SubjectID ?? raw.subject_id ?? raw.id ?? code;
    const subjectName = raw.SubjectName ?? raw.subject_name ?? raw.name ?? "";
    const credit = Number(raw.Credit ?? raw.credit ?? 0);

    const studyTimesSrc: any[] = raw.StudyTimes ?? raw.study_times ?? raw.schedule ?? [];
    const studyTimes: StudyTimeInterface[] = studyTimesSrc.map((t: any) => ({
      day: t.day ?? t.Day,
      start_at: t.start_at ?? t.start_time ?? t.StartAt ?? t.start ?? "",
      end_at: t.end_at ?? t.end_time ?? t.EndAt ?? t.end ?? "",
    }));

    const sectionsSrc: any[] = raw.Sections ?? raw.sections ?? [];
    const sections: SectionInterface[] = sectionsSrc.map((s: any) => ({
      SectionID: Number(s.SectionID ?? s.section_id ?? s.id ?? 0),
      Group: Number(s.Group ?? s.group ?? 0),
      DateTeaching: String(s.DateTeaching ?? s.date_teaching ?? ""),
      SubjectID: subjectId,
    }));

    return {
      SubjectID: String(subjectId ?? ""),
      SubjectName: String(subjectName ?? ""),
      Credit: Number.isFinite(credit) ? credit : 0,
      MajorID: raw.MajorID ?? raw.major_id,
      FacultyID: raw.FacultyID ?? raw.faculty_id,
      StudyTimes: studyTimes,
      Sections: sections,
    } as SubjectInterface;
  };

  try {
    const res = await axios.get(`${apiUrl}/subjects/${encodeURIComponent(code)}`);
    return normalize(res.data);
  } catch (e: any) {
    const err = e as AxiosError;
    // ถ้า 404 ให้คืน null เพื่อให้หน้าแสดง "ไม่พบวิชา"
    if (err.response && err.response.status === 404) return null;
    // ลอง fallback อีกฐาน
    try {
      const res2 = await axios.get(`${rootBase}/subjects/${encodeURIComponent(code)}`);
      return normalize(res2.data);
    } catch (e2: any) {
      const err2 = e2 as AxiosError;
      if (err2.response && err2.response.status === 404) return null;
      throw e2;
    }
  }
};

// สร้างรายวิชา (ถ้าคุณใช้หน้า add)
export type SubjectCreatePayload = {
  SubjectID: string;
  SubjectName: string;
  Credit: number;
  MajorID: string;
  FacultyID: string;
};
export const createSubject = async (payload: SubjectCreatePayload) => {
  const body = {
    subject_id: payload.SubjectID,
    subject_name: payload.SubjectName,
    credit: payload.Credit,
    major_id: payload.MajorID,
    faculty_id: payload.FacultyID,
  };
  return tryBoth(
    async () => (await axios.post(`${apiUrl}/subjects`, body)).data,
    async () => (await axios.post(`${rootBase}/subjects`, body)).data,
  );
};

// อัปเดตรายวิชา (รองรับหลาย key ชื่อ)
export type SubjectUpdatePayload = {
  subject_name?: string;
  credit?: number;
  major_id?: string;
  faculty_id?: string;
  // สำหรับกรณีเปลี่ยนรหัสวิชา
  subject_id?: string; // บาง backend อาจใช้ key นี้
  new_subject_id?: string; // บาง backend อาจใช้ key นี้
};
export const updateSubject = async (
  subjectId: string,
  payload: SubjectUpdatePayload
) => {
  const sid = (subjectId || "").trim();
  return tryBoth(
    async () => (await axios.put(`${apiUrl}/subjects/${encodeURIComponent(sid)}`, payload)).data,
    async () => (await axios.put(`${rootBase}/subjects/${encodeURIComponent(sid)}`, payload)).data,
  );
};

// ลบรายวิชา
export const deleteSubject = async (subjectId: string) => {
  const sid = (subjectId || "").trim();
  return tryBoth(
    async () => (await axios.delete(`${apiUrl}/subjects/${encodeURIComponent(sid)}`)).data,
    async () => (await axios.delete(`${rootBase}/subjects/${encodeURIComponent(sid)}`)).data,
  );
};
