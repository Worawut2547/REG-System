import axios from "axios";
import { type BookPathInterface } from "../../../interfaces/BookPath";
import { api , apiUrl } from "../api";

// -------------------------------------------------------------
// รูปแบบข้อมูลจาก Backend (snake_case)
// -------------------------------------------------------------
type RawBook = {
  id: number;
  book_path: string;
  curriculum_id: string;
};

type ListResponse = RawBook[];                         // list ตรง ๆ
type GetByIdResponse = RawBook | { book: RawBook };    // บางรุ่นห่อ { book }
type RegisterResponse =
  | RawBook
  | { book: RawBook }
  | ({ message: string } & RawBook);                   // บางทีแนบ message มาด้วย

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
const baseUrl = `/curriculum-books`;                   // เส้นหลักฝั่งไฟล์ (relative path ให้ FE ยิงตรง)

const mapBookFromAPI = (b: RawBook): BookPathInterface => ({
  ID: b.id,                                            // เอาไว้โยง preview/download
  BookPath: b.book_path,                               // path จริงบนเครื่อง server (ไม่ใช่ URL)
  CurriculumID: b.curriculum_id,                       // ผูกกับหลักสูตรไหน
});

const unwrapGetById = (data: GetByIdResponse): RawBook =>
  "book" in data ? data.book : data;                   // บางรุ่นห่อ → แกะก่อน map

const unwrapRegister = (data: RegisterResponse): RawBook =>
  "book" in data ? data.book : data;                   // register ก็เจอเคสห่อเหมือนกัน

// -------------------------------------------------------------
// APIs
// -------------------------------------------------------------

/**
 * ดึงรายการหนังสือทั้งหมด
 * (ถ้ามี curriculumId จะ filter ด้วย ?curriculum_id=...)
 * GET /curriculum-books/?curriculum_id=...
 */
export const getBookAll = async (
  curriculumId?: string
): Promise<BookPathInterface[]> => {
  const url =
    curriculumId && curriculumId.trim().length > 0
      ? `${baseUrl}/?curriculum_id=${encodeURIComponent(curriculumId.trim())}` // มี filter ก็ยิงแบบนี้
      : `${baseUrl}/`;                                                          // ไม่มีก็เอาทั้งหมด

  const { data } = await axios.get<ListResponse>(url);  // เรียกตรง (ไม่ผ่าน apiUrl) → อาศัย same origin
  return (Array.isArray(data) ? data : []).map(mapBookFromAPI); // กัน null แล้วค่อย map
};

/**
 * อ่านหนังสือจาก ID
 * GET /curriculum-books/:id
 */
export const getBookByID = async (id: number): Promise<BookPathInterface> => {
  const { data } = await axios.get<GetByIdResponse>(`${baseUrl}/${id}`); // ขอชิ้นเดียว
  return mapBookFromAPI(unwrapGetById(data));                            // เผื่อมี {book:...}
};

/**
 * สมัคร (register) เอกสารด้วย path ตรงๆ (ไม่อัปโหลดไฟล์)
 * POST /curriculum-books/register
 * body: { book_path, curriculum_id }
 */
export const registerBookByPath = async (
  bookPath: string,
  curriculumId: string
): Promise<BookPathInterface> => {
  const payload = { book_path: bookPath, curriculum_id: curriculumId }; // ส่ง path ฝั่ง server เข้ามาเลย
  const { data } = await api.post<RegisterResponse>(
    `${baseUrl}/register`,
    payload
  );
  return mapBookFromAPI(unwrapRegister(data));                           // รองรับทั้งตอบตรง/ห่อ
};

/**
 * ลบ row เอกสาร (ฝั่ง BE จะไม่ลบไฟล์จริง)
 * DELETE /curriculum-books/:id
 */
export const deleteBook = async (id: number): Promise<void> => {
  await axios.delete(`${apiUrl}/curriculum-books/${id}`);                // อันนี้ใช้ apiUrl ชัด ๆ
};

/**
 * Helper URLs สำหรับแสดง/ดาวน์โหลดไฟล์
 */
export const getBookPreviewUrl = (id: number): string =>
  `${baseUrl}/preview/${id}`;                                           // เปิดดู inline (Content-Disposition:inline)

export const getBookDownloadUrl = (id: number): string =>
  `${baseUrl}/download/${id}`;                                          // ดาวน์โหลดเป็นไฟล์ (attachment)

// ลบหนังสือ (และเคลียร์ book_id ในตารางหลักสูตรฝั่ง BE)
export async function deleteBookById(id: number): Promise<void> {
  await axios.delete(`${apiUrl}/curriculum-books/${id}`);                // same endpoint กับ deleteBook ข้างบน
}
