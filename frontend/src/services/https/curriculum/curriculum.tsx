import { api , apiUrl } from "../api";
import { type CurriculumInterface } from "../../../interfaces/Curriculum";

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

// รูปแบบจาก BE (รองรับได้ทั้ง snake/camel + books array)
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
  book_id?: number | string; // อาจไม่มีในรุ่นล่าสุด
  description?: string;
  faculty_name?: string;
  major_name?: string;
  book_path?: string; // อาจแนบมาบ้าง
  books?: Array<{ id: number; book_path: string }>; // ✅ สำคัญ
};

// BE อาจตอบ { message, data: {...} } หรือ {...} ตรง ๆ
type CreateRespShape =
  | { message?: string; data?: CurriculumAPI }
  | CurriculumAPI;

// ---------- Helpers ----------
function toNum(v: unknown, def = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return def;
}

function unwrapCurriculum(payload: CreateRespShape): CurriculumAPI {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const d = (payload as { data?: CurriculumAPI }).data;
    if (d) return d;
  }
  return payload as CurriculumAPI;
}

// ---------- Mapper (รองรับ books) ----------
const mapCurriculumFromAPI = (c: CurriculumAPI): CurriculumInterface => {
  // ดึงจาก books[0] เป็นค่าเริ่มต้น (ถ้าไม่มี book_id ตรง ๆ)
  const firstBook = Array.isArray(c.books) && c.books.length > 0 ? c.books[0] : undefined;
  const bookIdFromList = firstBook?.id;
  const bookPathFromList = firstBook?.book_path;

  // ใช้ book_id จากฟิลด์ (ถ้ามี) > ไม่มีก็ fallback books[0].id
  const rawBookId = c.book_id !== undefined && c.book_id !== null ? String(c.book_id) : "";
  const mappedBookId =
    rawBookId.trim() !== "" ? toNum(rawBookId) : (bookIdFromList ?? undefined);

  // ใช้ book_path ตรง ๆ ถ้ามี > ไม่มีก็ fallback books[0].book_path
  const mappedBookPath = c.book_path ?? bookPathFromList ?? "";

  return {
    CurriculumID: c.curriculum_id ?? c.CurriculumID ?? "",
    CurriculumName: c.curriculum_name ?? c.CurriculumName ?? "",
    TotalCredit: toNum(c.total_credit, 0),
    StartYear: toNum(c.start_year, 0),
    FacultyID: c.faculty_id ?? c.FacultyID ?? "",
    MajorID: c.major_id ?? c.MajorID ?? "",
    BookID: mappedBookId,           // ✅ คีย์เดิมของ FE — ได้ค่าจาก books[0] ถ้าไม่มี book_id
    Description: c.description ?? "",
    FacultyName: c.faculty_name ?? "",
    MajorName: c.major_name ?? "",
    BookPath: mappedBookPath,       // เผื่อใช้ในอนาคต/แสดงผล
  };
};

// ---------- Services ----------
export const createCurriculum = async (
  data: CurriculumInterface
): Promise<CurriculumInterface> => {
  const { CurriculumID, CurriculumName, TotalCredit, StartYear, FacultyID } = data;
  if (!CurriculumID || !CurriculumName || TotalCredit == null || StartYear == null || !FacultyID) {
    throw new Error("Missing required curriculum fields");
  }

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
    headers: { "Content-Type": "application/json" },
  });

  const body = unwrapCurriculum(res.data);
  return mapCurriculumFromAPI(body);
};

export const getCurriculumAll = async (): Promise<CurriculumInterface[]> => {
  const res = await api.get<CurriculumAPI[] | { data?: CurriculumAPI[] }>(`/curriculums/`);
  const arr: CurriculumAPI[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  return arr.map(mapCurriculumFromAPI);
};

export const updateCurriculum = async (
  curriculumId: string,
  data: CurriculumUpdateDTO
): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required");

  const payload: CurriculumUpdateDTO = {
    ...data,
    // ถ้าวันหน้าจะเปิดให้แก้หนังสือผ่านตัวนี้ ค่อยใส่ book_id
  };

  await api.put(`/curriculums/${curriculumId}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteCurriculum = async (curriculumId: string): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required");
  await api.delete(`${apiUrl}/curriculums/${curriculumId}`);
};
