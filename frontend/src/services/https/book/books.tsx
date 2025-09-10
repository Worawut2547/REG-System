// services/https/book/books.ts
import axios from "axios";
import { type BookPathInterface } from "../../../interfaces/BookPath";
import { apiUrl } from "../../api";

// -------------------------------------------------------------
// รูปแบบข้อมูลจาก Backend (snake_case)
// -------------------------------------------------------------
type RawBook = {
  id: number;
  book_path: string;
  curriculum_id: string;
};

// รายการทั้งหมด
type ListResponse = RawBook[];

// อ่านทีละตัว: อาจมาแบบตรง ๆ หรือห่อใน { book: {...} }
type GetByIdResponse = RawBook | { book: RawBook };

// สมัคร (register) เอกสารด้วย path: อาจมี message หรือห่อใน { book: ... }
type RegisterResponse =
  | RawBook
  | { book: RawBook }
  | ({ message: string } & RawBook);

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
const baseUrl = `${apiUrl}/curriculum-books`;

const mapBookFromAPI = (b: RawBook): BookPathInterface => ({
  ID: b.id,
  BookPath: b.book_path,
  CurriculumID: b.curriculum_id,
});

const unwrapGetById = (data: GetByIdResponse): RawBook =>
  "book" in data ? data.book : data;

const unwrapRegister = (data: RegisterResponse): RawBook =>
  "book" in data ? data.book : data;

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
      ? `${baseUrl}/?curriculum_id=${encodeURIComponent(curriculumId.trim())}`
      : `${baseUrl}/`;

  const { data } = await axios.get<ListResponse>(url);
  return (Array.isArray(data) ? data : []).map(mapBookFromAPI);
};

/**
 * อ่านหนังสือจาก ID
 * GET /curriculum-books/:id
 */
export const getBookByID = async (id: number): Promise<BookPathInterface> => {
  const { data } = await axios.get<GetByIdResponse>(`${baseUrl}/${id}`);
  return mapBookFromAPI(unwrapGetById(data));
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
  const payload = { book_path: bookPath, curriculum_id: curriculumId };
  const { data } = await axios.post<RegisterResponse>(
    `${baseUrl}/register`,
    payload
  );
  return mapBookFromAPI(unwrapRegister(data));
};

/**
 * ลบ row เอกสาร (ฝั่ง BE จะไม่ลบไฟล์จริง)
 * DELETE /curriculum-books/:id
 */
export const deleteBook = async (id: number): Promise<void> => {
  await axios.delete(`${apiUrl}/curriculum-books/${id}`);
};

/**
 * Helper URLs สำหรับแสดง/ดาวน์โหลดไฟล์
 */
export const getBookPreviewUrl = (id: number): string =>
  `${baseUrl}/preview/${id}`;

export const getBookDownloadUrl = (id: number): string =>
  `${baseUrl}/download/${id}`;

// ลบหนังสือ (และเคลียร์ book_id ในตารางหลักสูตรฝั่ง BE)
export async function deleteBookById(id: number): Promise<void> {
  await axios.delete(`${apiUrl}/curriculum-books/${id}`);
}
