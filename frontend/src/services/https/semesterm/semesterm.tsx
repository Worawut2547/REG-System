// services/https/semesterm/semesterm.ts
import axios from "axios";
import { apiUrl } from "../../api";
// ถ้าไฟล์ interfaces/Simesterm.ts export เป็น "SemestermInterface" ให้ alias มาเป็น SemesterInterface
import { type SemestermInterface as SemesterInterface } from "../../../interfaces/Semesterm";

/* ---------- รูปแบบข้อมูลที่อาจได้จาก backend ---------- */
type SemAPI = {
  semester_id?: number | string; SemesterID?: number | string; id?: number | string;
  term?: string; Term?: string;
  academic_year?: string; AcademicYear?: string;
};

type SubjectAPI = {
  semester_id?: number | string; SemesterID?: number | string;
  term?: string;
  academic_year?: string;
};

/* ---------- ตัวช่วย ---------- */
const toStr = (v: string | number | undefined | null): string =>
  v == null ? "" : String(v);

const mapSemFromAPI = (s: SemAPI): SemesterInterface => ({
  SemesterID:  toStr(s.semester_id ?? s.SemesterID ?? s.id),
  Term:        s.term ?? s.Term ?? "",
  AcademicYear: s.academic_year ?? s.AcademicYear ?? "",
});

const dedupe = (list: SemesterInterface[]): SemesterInterface[] => {
  const map = new Map<string, SemesterInterface>();
  for (const s of list) {
    const key = s.SemesterID && s.SemesterID !== ""
      ? s.SemesterID
      : `${s.Term || ""}|${s.AcademicYear || ""}`;
    if (!key || key === "|") continue;
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
};

/* ---------- ดึงรายการภาคการศึกษาทั้งหมด ----------
   1) พยายามเรียก /semesters/ ก่อน
   2) ถ้าไม่มี/ล้มเหลว -> fallback ไปดึงจาก /subjects/ แล้ว unique เอาเอง
----------------------------------------------------- */
export const getSemestermAll = async (): Promise<SemesterInterface[]> => {
  // ทางหลัก: /semesters/
  try {
    const res = await axios.get<SemAPI[]>(`${apiUrl}/semesters/`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      return dedupe(res.data.map(mapSemFromAPI));
    }
  } catch {
    // ปล่อยให้ fallback ต่อไป
  }

  // Fallback: ดึงจาก /subjects/ (ต้องที่ backend ส่ง term/academic_year และถ้าได้ semester_id จะยิ่งดี)
  try {
    const res = await axios.get<SubjectAPI[]>(`${apiUrl}/subjects/`);
    const arr = Array.isArray(res.data) ? res.data : [];
    const raw: SemesterInterface[] = arr.map((s) => ({
      SemesterID:  toStr(s.semester_id ?? s.SemesterID), // อาจว่างถ้า backend ไม่ส่ง
      Term:        s.term ?? "",
      AcademicYear: s.academic_year ?? "",
    }));
    return dedupe(raw);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("getSemestermAll error:", {
        url: `${apiUrl}/subjects/`,
        status: err.response?.status,
        data: err.response?.data,
      });
    } else {
      console.error("getSemestermAll error:", err);
    }
    throw err;
  }
};

/* ---------- ตัวช่วยทำ label สำหรับ dropdown ---------- */
export const formatSemesterLabel = (s: SemesterInterface): string => {
  const term = s.Term ?? "";
  const year = s.AcademicYear ?? "";
  return term && year ? `${term}/${year}` : s.SemesterID ?? "";
};
