import { api } from "../api";
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
  semester_id?: number;   
  subject_id?: string;
  new_subject_id?: string; // ตรงนี้ไว้รองรับ use case "เปลี่ยนรหัสวิชา"
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

// helper แปลงให้ชัวร์เป็น string (กัน undefined/null โผล่)
const toStr = (v: string | number | undefined | null): string =>
  v == null ? "" : String(v);

// helper แปลงเป็น number ถ้าไม่ใช่ก็คืน undefined (เอาไว้ map optional number)
const toNum = (v: number | string | undefined | null): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// ---------- map -> SubjectInterface ----------
// ตรงนี้รวม normalized field จาก backend หลายรูปแบบ ให้เป็น interface กลางของเรา
const mapSubjectFromAPI = (s: SubjectAPI): SubjectInterface => ({
  SubjectID:    s.subject_id   ?? s.SubjectID   ?? s.id ?? "",          // เอา id ให้ไม่ว่างไว้ก่อน
  SubjectName:  s.subject_name ?? s.SubjectName ?? s.name ?? "",         // ชื่อวิชา normalize
  Credit:       Number(s.credit ?? 0),                                   // credit บางทีมาเป็น string -> บังคับเป็น number

  MajorID:      toStr(s.major_id   ?? s.MajorID),                        // แปะเป็น string ชัวร์
  FacultyID:    toStr(s.faculty_id ?? s.FacultyID),

  TeacherID:    toStr(s.teacher_id ?? s.TeacherID ?? s.teacherId),       // รองรับหลายคีย์

  SemesterID:   toNum(s.semester_id ?? s.SemesterID ?? s.semesterId),
  Term:         s.term,                                                  // term/academic_year ให้ผ่านตรง ๆ
  AcademicYear: s.academic_year,
});

// ---------- สร้างรายวิชา ----------
// ฟังก์ชันนี้ยิง POST ไปสร้างวิชาใหม่ + validate ฝั่งหน้าเว็บก่อน
export const createSubject = async (
  data: SubjectInterface
): Promise<SubjectInterface> => {
  const { SubjectID, SubjectName, MajorID, FacultyID, Credit } = data;

  if (!SubjectID)   throw new Error("SubjectID is required");    // กันพลาด: id ห้ามว่าง
  if (!SubjectName) throw new Error("SubjectName is required");  // กันพลาด: ชื่อห้ามว่าง
  if (!MajorID)     throw new Error("MajorID is required");      // ต้องมี major
  if (!FacultyID)   throw new Error("FacultyID is required");    // ต้องมี faculty

  const creditNum = Number(Credit);
  if (!Number.isFinite(creditNum) || creditNum < 1 || creditNum > 5) {
    throw new Error("Credit must be a number between 1 and 5");  // rule ธรรมดา 1–5
  }

  // payload ที่หลังบ้านต้องการ (snake case)
  const payload: SubjectCreateDTO = {
    subject_id:   SubjectID,
    subject_name: SubjectName,
    credit:       creditNum,
    major_id:     String(MajorID),
    faculty_id:   String(FacultyID),
    teacher_id:   data.TeacherID ? String(data.TeacherID) : undefined,           // ส่งเฉพาะถ้ามี
    semester_id:  data.SemesterID != null ? Number(data.SemesterID) : undefined, // ถ้าไม่กรอกไม่ต้องส่ง
  };

  const res = await api.post<SubjectAPI>(
    `/subjects/`,                                        // endpoint สร้างรายวิชา
    payload,
    { headers: { "Content-Type": "application/json" } }  // บอกว่าเป็น JSON ชัด ๆ
  );
  return mapSubjectFromAPI(res.data);                    // map กลับเป็นรูปแบบกลางของฝั่งเรา
};

// ---------- ดึงรายวิชาทั้งหมด ----------
// list รายวิชาทั้งหมด (ใช้ในหน้า table)
export const getSubjectAll = async (): Promise<SubjectInterface[]> => {
  const res = await api.get<SubjectAPI[]>(`/subjects/`); // GET ทั้งหมด
  const arr = Array.isArray(res.data) ? res.data : [];   // เผื่อ backend คืนอย่างอื่นมา
  return arr.map(mapSubjectFromAPI);                     // normalize ทีเดียว
};

// ฟังก์ชันนี้อ่านรายละเอียดรายวิชาตาม id เดียว (เอาไว้เปิด detail หรือ preload form)
export const getSubjectById = async (subjectId: string): Promise<SubjectInterface | null> => {
  const sid = (subjectId || "").trim();
  if (!sid) return null;                                                   // ถ้าไม่มี id ก็ไม่ต้องยิง
  try {
    const res = await api.get<SubjectAPI>(`/subjects/${encodeURIComponent(sid)}`); // encode กันอักษรพิเศษพัง path
    return mapSubjectFromAPI(res.data || {});
  } catch (err) {
    console.error("getSubjectById error:", err);                           // เผื่อเช็ค log เวลา api ล้ม
    return null;                                                           // ล้มก็คืน null ให้คนเรียกเช็คเอง
  }
};

// อัปเดตรายวิชา (partial) — ส่งเฉพาะ field ที่เปลี่ยนจริง ๆ
export const updateSubject = async (
  subjectId: string,
  data: Partial<SubjectUpdateDTO & { semester_id?: string | number }>
): Promise<void> => {
  if (!subjectId) throw new Error("subjectId is required");                // กัน call ผิด

  // สร้าง payload แบบค่อย ๆ เก็บเฉพาะที่มีค่า
  const payload: SubjectUpdateDTO = {
    subject_name: data.subject_name,
    credit: data.credit,
    major_id: data.major_id,
    faculty_id: data.faculty_id,
    teacher_id: data.teacher_id,
    ...(data.semester_id !== undefined
      ? (() => {
          // แปลง semester_id ให้เป็น number เสมอ (ถ้าแปลงไม่ได้ก็ไม่ส่ง)
          const n = Number(data.semester_id);
          return Number.isFinite(n) ? { semester_id: n } : {};
        })()
      : {}),
    subject_id: data.subject_id,            // ถ้าหลังบ้านใช้เป็น filter เพิ่มเติมก็มีรองรับไว้
    new_subject_id: data.new_subject_id,    // ใช้กรณีต้องการ rename รหัสวิชา
  };

  await api.put(`/subjects/${subjectId}`, payload, {
    headers: { "Content-Type": "application/json" },
  }); // ไม่ต้องคืนค่าอะไร คนเรียกไป refresh เอง
};

// ลบรายวิชา (ถ้าไม่มี id จะ throw ขึ้นไปให้คนเรียก handle เอง)
export const deleteSubject = async (subjectId: string): Promise<void> => {
  if (!subjectId) throw new Error("subjectId is required"); // ต้องมี id
  await api.delete(`/subjects/${subjectId}`);               // ลบที่ endpoint เดิม
};
