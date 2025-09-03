import axios from "axios";
import { apiUrl } from "../../api";
import { type CurriculumInterface } from "../../../interfaces/Curriculum";

// ---------- API DTOs (ใช้ต่อได้ในไฟล์อื่น) ----------
export type CurriculumCreateDTO = {
  curriculum_id: string;
  curriculum_name: string;
  total_credit: number;
  start_year: number;
  faculty_id: string;
  major_id?: string;
  book_id?: string; // 🔁 ต้องเป็น string ตามที่ BE ต้องการ
  description?: string;
};

// สำหรับอัปเดต (เช่นหน้า CHANGE.tsx)
export type CurriculumUpdateDTO = Partial<{
  curriculum_name: string;
  total_credit: number;
  start_year: number;
  faculty_id: string;
  major_id: string;
  book_id: string; // 🔁 string เช่นกัน
  description: string;
}>;

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
};

// ฝั่ง BE อาจตอบ { message, data: {...} } หรือ {...} ตรง ๆ
type CreateRespShape =
  | { message?: string; data?: CurriculumAPI }
  | CurriculumAPI;

// ---------- Mappers ----------
const mapCurriculumFromAPI = (c: CurriculumAPI): CurriculumInterface => ({
  CurriculumID: c.curriculum_id ?? c.CurriculumID ?? "",
  CurriculumName: c.curriculum_name ?? c.CurriculumName ?? "",
  TotalCredit: Number(c.total_credit ?? 0),
  StartYear: Number(c.start_year ?? 0),
  FacultyID: c.faculty_id ?? c.FacultyID ?? "",
  MajorID: c.major_id ?? c.MajorID ?? "",
  BookID:
    c.book_id !== undefined &&
    c.book_id !== null &&
    String(c.book_id).trim() !== ""
      ? Number(c.book_id)
      : undefined,
  Description: c.description ?? "",
  FacultyName: c.faculty_name ?? "",
  MajorName: c.major_name ?? "",
  BookPath: c.book_path ?? "",
});

// ดึง payload ให้ได้ CurriculumAPI เสมอ ไม่ว่าจะห่อใน {data: ...} หรือไม่
function unwrapCurriculum(payload: CreateRespShape): CurriculumAPI {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    payload.data
  ) {
    return payload.data as CurriculumAPI;
  }
  return payload as CurriculumAPI;
}

// ---------- Services ----------
export const createCurriculum = async (
  data: CurriculumInterface
): Promise<CurriculumInterface> => {
  const { CurriculumID, CurriculumName, TotalCredit, StartYear, FacultyID } =
    data;
  if (
    !CurriculumID ||
    !CurriculumName ||
    TotalCredit == null ||
    StartYear == null ||
    !FacultyID
  ) {
    throw new Error("Missing required curriculum fields");
  }

  const payload: CurriculumCreateDTO = {
    curriculum_id: CurriculumID,
    curriculum_name: CurriculumName,
    total_credit: Number(TotalCredit),
    start_year: Number(StartYear),
    faculty_id: FacultyID,
    major_id: data.MajorID || undefined,
    // 🔁 แปลง BookID (number | undefined) -> string | undefined
    book_id:
      data.BookID !== undefined && data.BookID !== null
        ? String(data.BookID)
        : undefined,
    description: (data.Description ?? "").trim() || undefined,
  };

  const res = await axios.post<CreateRespShape>(
    `${apiUrl}/curriculums/`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  const body = unwrapCurriculum(res.data);
  return mapCurriculumFromAPI(body);
};

export const getCurriculumAll = async (): Promise<CurriculumInterface[]> => {
  const res = await axios.get<CurriculumAPI[] | { data?: CurriculumAPI[] }>(
    `${apiUrl}/curriculums/`
  );

  // รองรับทั้งแบบ array ตรง ๆ และแบบ { data: [...] }
  const arr: CurriculumAPI[] = Array.isArray(res.data)
    ? res.data
    : res.data?.data ?? [];

  return arr.map(mapCurriculumFromAPI);
};

// ใช้ในหน้า CHANGE.tsx: dto เป็นคีย์ snake_case ให้ตรงกับ BE
export const updateCurriculum = async (
  curriculumId: string,
  data: CurriculumUpdateDTO
): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required");

  // ถ้าโดนส่งมาเป็น number (เผื่อกรณีอื่น) ก็แปลงให้
  const payload: CurriculumUpdateDTO = {
    ...data,
    book_id:
      data.book_id !== undefined && data.book_id !== null
        ? String(data.book_id as unknown as string)
        : undefined,
  };

  await axios.put(`${apiUrl}/curriculums/${curriculumId}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteCurriculum = async (curriculumId: string): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required");
  await axios.delete(`${apiUrl}/curriculums/${curriculumId}`);
};
