import axios from "axios";
import { apiUrl } from "../../api";
import { type BookPathInterface } from "../../../interfaces/BookPath";

/* -----------------------------------------
 * รูปแบบข้อมูลจาก Back-End (ยืดหยุ่นเรื่องชื่อคีย์)
 * ----------------------------------------- */
type BookAPI = {
  id?: number | string;
  original_name?: string;
  stored_name?: string;
  path?: string;
  public_path?: string;
  mime_type?: string;
  size?: number | string;
  checksum?: string;
  note?: string;
};

/* -----------------------------------------
 * รูปแบบ Response ที่พบได้
 * - Upload: อาจเป็น { message, data: {...} } หรือ { message, book: {...} } หรือ {...} ตรง ๆ
 * - List: อาจเป็น [...]/ { data: [...] }
 * ----------------------------------------- */
type UploadRespShape =
  | { message?: string; data?: BookAPI; book?: BookAPI }
  | BookAPI;

type ListRespShape = BookAPI[] | { data?: BookAPI[] };

/* -----------------------------------------
 * Mapper: BookAPI -> BookPathInterface (ฝั่ง FE)
 * ----------------------------------------- */
const mapBookFromAPI = (b: BookAPI): BookPathInterface => ({
  ID:           b.id !== undefined ? Number(b.id) : undefined,
  OriginalName: b.original_name ?? "",
  StoredName:   b.stored_name ?? "",
  Path:         b.path ?? "",
  PublicPath:   b.public_path ?? "",
  MimeType:     b.mime_type ?? "",
  Size:         b.size !== undefined ? Number(b.size) : undefined,
  Checksum:     b.checksum ?? "",
  Note:         b.note ?? "",
});

/* -----------------------------------------
 * Unwrap: ดึง BookAPI ออกจาก response upload ให้ได้เสมอ
 * ----------------------------------------- */
function unwrapBook(payload: UploadRespShape): BookAPI {
  if (typeof payload === "object" && payload !== null) {
    if ("data" in payload && payload.data) return payload.data;
    if ("book" in payload && payload.book) return payload.book;
  }
  return payload as BookAPI;
}

/* -----------------------------------------
 * Service: อัปโหลดไฟล์เอกสารหลักสูตร
 * - default fieldName = "file" (ถ้าหลังบ้านใช้ชื่ออื่น เช่น "currBook" สามารถส่ง args เพิ่ม)
 * - คืนค่าเป็น BookPathInterface (มี ID/ชื่อ/ลิงก์)
 * ----------------------------------------- */
// services/https/book/books.ts
export const uploadBook = async (
  file: File,
  fieldName: string = "currBook"   // ✅ ใช้ currBook เป็นค่าเริ่มต้น
): Promise<BookPathInterface> => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await axios.post<UploadRespShape>(
    `${apiUrl}/books/upload`,
    formData,
  );

  const body = unwrapBook(res.data);
  return mapBookFromAPI(body);
};


/* -----------------------------------------
 * Service: ดึงรายการไฟล์เอกสารทั้งหมด
 * ----------------------------------------- */
export const getBookAll = async (): Promise<BookPathInterface[]> => {
  const res = await axios.get<ListRespShape>(`${apiUrl}/books/`);
  const list: BookAPI[] = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  return list.map(mapBookFromAPI);
};

/* -----------------------------------------
 * Service: ดึงไฟล์เอกสารตาม ID
 * ----------------------------------------- */
export const getBookByID = async (id: number): Promise<BookPathInterface> => {
  const res = await axios.get<BookAPI>(`${apiUrl}/books/${id}`);
  return mapBookFromAPI(res.data);
};

/* -----------------------------------------
 * Service: ลบไฟล์เอกสารตาม ID
 * ----------------------------------------- */
export const deleteBook = async (id: number): Promise<void> => {
  await axios.delete(`${apiUrl}/books/${id}`);
};
