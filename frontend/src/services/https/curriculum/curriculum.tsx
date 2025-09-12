import { api } from "../api";
import { type CurriculumInterface } from "../../../interfaces/Curriculum";

// service หลักสูตร: สร้าง/อ่าน/แก้/ลบ + map ฟอร์แมต BE → FE ให้พร้อมใช้

// ---------- API DTOs ----------
export type CurriculumCreateDTO = {
  curriculum_id: string;
  curriculum_name: string;
  total_credit: number;
  start_year: number;
  faculty_id: string;
  major_id?: string;
  // หมายเหตุ: BE รุ่นใหม่ไม่รับ book_id ใน create แล้ว
  description?: string;
};

export type CurriculumUpdateDTO = Partial<{
  curriculum_name: string;
  total_credit: number;
  start_year: number;
  faculty_id: string;
  major_id: string;
  // ถ้าต้องการเก็บ book_id ในอนาคต ค่อยเปิดฟิลด์นี้
  book_id: string;
  description: string;
}>;

// รูปแบบจาก BE รองรับได้ทั้ง snake/camel
export type CurriculumAPI = {
  curriculum_id?: string;
  CurriculumID?: string;
  curriculum_name?: string;
  CurriculumName?: string;
  total_credit?: number | string;
  start_year?: number | string;
  faculty_id?: string;
  FacultyID?: string;
  major_id?: string;
  MajorID?: string;
  book_id?: number | string; 
  description?: string;
  faculty_name?: string;
  major_name?: string;
  book_path?: string; 
  books?: Array<{ id: number; book_path: string }>; //สำคัญ
};

// BE อาจตอบ { message, data: {...} } หรือ {...} ตรง ๆ
type CreateRespShape =
  | { message?: string; data?: CurriculumAPI }
  | CurriculumAPI;

// ---------- Helpers ----------
// แปลงเป็น number แบบกัน NaN — ถ้าไม่ชัวร์ใช้ค่า def
function toNum(v: unknown, def = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return def;
}

// ถ้า BE ห่อใน { data } ให้แกะออกก่อน map
function unwrapCurriculum(payload: CreateRespShape): CurriculumAPI {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const d = (payload as { data?: CurriculumAPI }).data;
    if (d) return d;
  }
  return payload as CurriculumAPI;
}

// ---------- Mapper (รองรับ books) ----------
// ตรงนี้รวม logic เลือก book_id/book_path: ฟิลด์ตรงก่อน → fallback books[0]
const mapCurriculumFromAPI = (c: CurriculumAPI): CurriculumInterface => {
  const firstBook = Array.isArray(c.books) && c.books.length > 0 ? c.books[0] : undefined;
  const bookIdFromList = firstBook?.id;
  const bookPathFromList = firstBook?.book_path;

  const rawBookId = c.book_id !== undefined && c.book_id !== null ? String(c.book_id) : "";
  const mappedBookId = rawBookId.trim() !== "" ? toNum(rawBookId) : (bookIdFromList ?? undefined);
  const mappedBookPath = c.book_path ?? bookPathFromList ?? "";

  return {
    CurriculumID: c.curriculum_id ?? c.CurriculumID ?? "",
    CurriculumName: c.curriculum_name ?? c.CurriculumName ?? "",
    TotalCredit: toNum(c.total_credit, 0),   // กันเคสส่งมาเป็น string
    StartYear: toNum(c.start_year, 0),
    FacultyID: c.faculty_id ?? c.FacultyID ?? "",
    MajorID: c.major_id ?? c.MajorID ?? "",
    BookID: mappedBookId,                    // ได้ค่าจาก books[0] ถ้าไม่ส่งตรง
    Description: c.description ?? "",
    FacultyName: c.faculty_name ?? "",
    MajorName: c.major_name ?? "",
    BookPath: mappedBookPath,                // เผื่อแสดง/ต่อยอด
  };
};

// ---------- Services ----------
export const createCurriculum = async (
  data: CurriculumInterface
): Promise<CurriculumInterface> => {
  // เช็คฟิลด์บังคับก่อนยิง — กัน payload ว่าง
  const { CurriculumID, CurriculumName, TotalCredit, StartYear, FacultyID } = data;
  if (!CurriculumID || !CurriculumName || TotalCredit == null || StartYear == null || !FacultyID) {
    throw new Error("Missing required curriculum fields");
  }

  // map เป็น snake_case ให้ตรง BE
  const payload: CurriculumCreateDTO = {
    curriculum_id: CurriculumID,
    curriculum_name: CurriculumName,
    total_credit: Number(TotalCredit),
    start_year: Number(StartYear),
    faculty_id: FacultyID,
    major_id: data.MajorID || undefined,
    description: (data.Description ?? "").trim() || undefined,
  };

  const res = await api.post<CreateRespShape>(`/curriculums/`, payload, {
    headers: { "Content-Type": "application/json" }, // ย้ำ header JSON
  });

  const body = unwrapCurriculum(res.data); // รองรับทั้ง {data:{}}/object ตรง
  return mapCurriculumFromAPI(body);       // คืนฟอร์แมตกลางฝั่ง FE
};

export const getCurriculumAll = async (): Promise<CurriculumInterface[]> => {
  // รองรับทั้ง array ตรง ๆ หรือ { data: [...] }
  const res = await api.get<CurriculumAPI[] | { data?: CurriculumAPI[] }>(`/curriculums/`);
  const arr: CurriculumAPI[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  return arr.map(mapCurriculumFromAPI); // map ให้ UI ใช้ได้ทันที
};

export const updateCurriculum = async (
  curriculumId: string,
  data: CurriculumUpdateDTO
): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required"); // ต้องมี id ชัดเจน

  const payload: CurriculumUpdateDTO = {
    ...data,
  };

  await api.put(`/curriculums/${curriculumId}`, payload, {
    headers: { "Content-Type": "application/json" }, // ส่งเป็น JSON ปลอดภัยสุด
  });
};

export const deleteCurriculum = async (curriculumId: string): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required"); // กันลบผิด
  await api.delete(`/curriculums/${curriculumId}`); // 200/204 ถือว่าจบ
};
