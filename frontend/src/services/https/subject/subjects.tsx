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
  teacher_id?: string;   // ใส่เพิ่ม
  semester_id?: number;  // ใส่เพิ่ม (ถ้า backend เป็น int)
};

// ถ้ามีเคสเปลี่ยนรหัสวิชา และ backend รองรับคีย์พวกนี้
type SubjectUpdateDTO = {
  subject_name?: string;
  credit?: number;
  major_id?: string;
  faculty_id?: string;
  teacher_id?: string;
  semester_id?: number;      // <- backend ต้องการเป็น number
  // ถ้ามีเคสเปลี่ยนรหัสวิชา และ backend รองรับคีย์พวกนี้
  subject_id?: string;
  new_subject_id?: string;
};

// ---------- รองรับคีย์จาก backend ----------
type SubjectAPI = {
  subject_id?: string; SubjectID?: string; id?: string;
  subject_name?: string; SubjectName?: string; name?: string;
  credit?: number | string;

  major_id?: string | number; MajorID?: string | number;
  faculty_id?: string | number; FacultyID?: string | number;

  // เพิ่มให้ครบ
  teacher_id?: string | number; TeacherID?: string | number; teacherId?: string | number;
  semester_id?: number | string; SemesterID?: number | string; semesterId?: number | string;
  term?: string;
  academic_year?: string;
};

const toStr = (v: string | number | undefined | null): string =>
  v == null ? "" : String(v);

// ---------- map -> SubjectInterface ----------
const mapSubjectFromAPI = (s: SubjectAPI): SubjectInterface => ({
  SubjectID:    s.subject_id   ?? s.SubjectID   ?? s.id ?? "",
  SubjectName:  s.subject_name ?? s.SubjectName ?? s.name ?? "",
  Credit:       Number(s.credit ?? 0),

  MajorID:      toStr(s.major_id   ?? s.MajorID),
  FacultyID:    toStr(s.faculty_id ?? s.FacultyID),

  // สำคัญ: ให้ตารางรู้ว่าแต่ละวิชาผูกอาจารย์คนไหน
  TeacherID:    toStr(s.teacher_id ?? s.TeacherID ?? s.teacherId),

  // สำหรับโชว์เทอม/ปี หรือใช้ fallback จากตาราง semester ได้
  SemesterID:   toStr(s.semester_id ?? s.SemesterID ?? s.semesterId),
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
    teacher_id:   data.TeacherID ? String(data.TeacherID) : undefined, // ส่งอาจารย์
    semester_id:  data.SemesterID ? Number(data.SemesterID) : undefined, // ส่งภาคเรียน
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

// GET one subject with sections (backend returns `sections` array)
export const getSubjectById = async (subjectId: string): Promise<(SubjectInterface & { Sections?: any[]; StudyTimes?: any[] }) | null> => {
  const sid = (subjectId || "").trim();
  if (!sid) return null;
  try {
    // Backend /subjects/:id does NOT include sections; fetch them explicitly
    const [resSub, resSecs] = await Promise.all([
      axios.get(`${apiUrl}/subjects/${encodeURIComponent(sid)}`),
      axios.get(`${apiUrl}/subjects/${encodeURIComponent(sid)}/sections`),
    ]);

    const raw = resSub.data || {};
    const base: SubjectInterface = {
      SubjectID: raw.subject_id ?? raw.SubjectID ?? sid,
      SubjectName: raw.subject_name ?? raw.SubjectName ?? "",
      Credit: typeof raw.credit === "number" ? raw.credit : Number(raw.credit ?? 0),
      MajorID: raw.major_id ?? raw.MajorID,
      FacultyID: raw.faculty_id ?? raw.FacultyID,
      Term: raw.term ?? raw.Term,
      AcademicYear: raw.academic_year ?? raw.AcademicYear,
    };

    const Sections = Array.isArray(resSecs.data) ? resSecs.data : undefined;
    // study times are served under /subjects/:id/times; keep undefined here
    return { ...base, Sections } as any;
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
    // แปลง semester_id ให้เป็น number เท่านั้น
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
