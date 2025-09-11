import axios from "axios";
import { apiUrl } from "../../api";
import { type SubjectInterface } from "../../../interfaces/Subjects";

// ---------- DTO ตอนส่งขึ้น backend ----------
type SubjectCreateDTO = {
  subject_id: string;
  subject_name: string;
  credit: number;
  major_id: string;
  faculty_id: string;
  teacher_id?: string;
  semester_id?: number;
};

type SubjectUpdateDTO = {
  subject_name?: string;
  credit?: number;
  major_id?: string;
  faculty_id?: string;
  teacher_id?: string;
  semester_id?: number;   // <- ต้องเป็น number
  subject_id?: string;
  new_subject_id?: string;
};

// ---------- รองรับคีย์จาก backend ----------
type SubjectAPI = {
  subject_id?: string; SubjectID?: string; id?: string;
  subject_name?: string; SubjectName?: string; name?: string;
  credit?: number | string;

  major_id?: string | number;  MajorID?: string | number;
  faculty_id?: string | number; FacultyID?: string | number;

  teacher_id?: string | number; TeacherID?: string | number; teacherId?: string | number;
  semester_id?: number | string; SemesterID?: number | string; semesterId?: number | string;

  term?: string;
  academic_year?: string;
};

const toStr = (v: string | number | undefined | null): string =>
  v == null ? "" : String(v);
const toNum = (v: number | string | undefined | null): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// ---------- map -> SubjectInterface ----------
const mapSubjectFromAPI = (s: SubjectAPI): SubjectInterface => ({
  SubjectID:    s.subject_id   ?? s.SubjectID   ?? s.id ?? "",
  SubjectName:  s.subject_name ?? s.SubjectName ?? s.name ?? "",
  Credit:       Number(s.credit ?? 0),

  MajorID:      toStr(s.major_id   ?? s.MajorID),
  FacultyID:    toStr(s.faculty_id ?? s.FacultyID),

  TeacherID:    toStr(s.teacher_id ?? s.TeacherID ?? s.teacherId),

  // ✅ ให้เป็น number ตาม baseline ล่าสุด
  SemesterID:   toNum(s.semester_id ?? s.SemesterID ?? s.semesterId),

  Term:         s.term,
  AcademicYear: s.academic_year,
});

// ---------- สร้างรายวิชา ----------
export const createSubject = async (
  data: SubjectInterface
): Promise<SubjectInterface> => {
  const { SubjectID, SubjectName, MajorID, FacultyID, Credit } = data;

  if (!SubjectID)   throw new Error("SubjectID is required");
  if (!SubjectName) throw new Error("SubjectName is required");
  if (!MajorID)     throw new Error("MajorID is required");
  if (!FacultyID)   throw new Error("FacultyID is required");

  const creditNum = Number(Credit);
  if (!Number.isFinite(creditNum) || creditNum < 1 || creditNum > 5) {
    throw new Error("Credit must be a number between 1 and 5");
  }

  const payload: SubjectCreateDTO = {
    subject_id:   SubjectID,
    subject_name: SubjectName,
    credit:       creditNum,
    major_id:     String(MajorID),
    faculty_id:   String(FacultyID),
    teacher_id:   data.TeacherID ? String(data.TeacherID) : undefined,
    semester_id:  data.SemesterID != null ? Number(data.SemesterID) : undefined,
  };

  const res = await axios.post<SubjectAPI>(
    `${apiUrl}/subjects/`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  return mapSubjectFromAPI(res.data);
};

// ---------- ดึงรายวิชาทั้งหมด ----------
export const getSubjectAll = async (): Promise<SubjectInterface[]> => {
  const res = await axios.get<SubjectAPI[]>(`${apiUrl}/subjects/`);
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr.map(mapSubjectFromAPI);
};

// ✅ ดึงรายวิชา “อย่างเดียว” (ไม่เรียก /sections อีกต่อไป)
export const getSubjectById = async (subjectId: string): Promise<SubjectInterface | null> => {
  const sid = (subjectId || "").trim();
  if (!sid) return null;
  try {
    const res = await axios.get<SubjectAPI>(`${apiUrl}/subjects/${encodeURIComponent(sid)}`);
    return mapSubjectFromAPI(res.data || {});
  } catch (err) {
    console.error("getSubjectById error:", err);
    return null;
  }
};

export const updateSubject = async (
  subjectId: string,
  data: Partial<SubjectUpdateDTO & { semester_id?: string | number }>
): Promise<void> => {
  if (!subjectId) throw new Error("subjectId is required");

  const payload: SubjectUpdateDTO = {
    subject_name: data.subject_name,
    credit: data.credit,
    major_id: data.major_id,
    faculty_id: data.faculty_id,
    teacher_id: data.teacher_id,
    ...(data.semester_id !== undefined
      ? (() => {
          const n = Number(data.semester_id);
          return Number.isFinite(n) ? { semester_id: n } : {};
        })()
      : {}),
    subject_id: data.subject_id,
    new_subject_id: data.new_subject_id,
  };

  await axios.put(`${apiUrl}/subjects/${subjectId}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
  if (!subjectId) throw new Error("subjectId is required");
  await axios.delete(`${apiUrl}/subjects/${subjectId}`);
};
