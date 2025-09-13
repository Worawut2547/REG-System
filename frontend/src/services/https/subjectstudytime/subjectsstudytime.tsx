import { type SubjectStudyTimeInterface } from "../../../interfaces/SubjectsStudyTime";
import { api } from "../api";

// (ฉัน) service จัดการ "เวลาเรียน" ของรายวิชา — ยิงหลังบ้านตรง ๆ ชุดเดียว

type StudyTimeAPI = {
  id?: number | string;
  ID?: number | string;

  subjectId?: string;
  subject_id?: string;
  SubjectID?: string;

  start?: string;
  start_at?: string;
  StartAt?: string;

  end?: string;
  end_at?: string;
  EndAt?: string;
}; // รองรับหลายคีย์จาก BE เผื่อเวอร์ชัน/เคสต่างกัน

// map ปลอดภัยขึ้น: กัน NaN และเติมค่าเริ่มต้นเป็น ""
const mapStudyTime = (data: StudyTimeAPI): SubjectStudyTimeInterface => ({
  ID: Number(data.id ?? data.ID ?? 0),                    // << กัน NaN
  SubjectID: data.subjectId ?? data.subject_id ?? data.SubjectID ?? "", //  รวม alias ให้เหลืออันเดียว
  StartAt:   data.start ?? data.start_at ?? data.StartAt ?? "",         //  เลือกคีย์แรกที่มีค่า
  EndAt:     data.end   ?? data.end_at   ?? data.EndAt   ?? "",         //  ค่า default เป็น "" กัน UI crash
});

//ดึงช่วงเวลาเรียนทั้งหมดของรายวิชา
// ใช้ตอน list ในตาราง — ต้องมี subjectId เสมอ
export const getStudyTimesBySubject = async (
  subjectId: string
): Promise<SubjectStudyTimeInterface[]> => {
  if (!subjectId) throw new Error("subjectId is required"); // กัน call ว่าง

  try {
    const response = await api.get<StudyTimeAPI[]>(
      `/subjects/${subjectId}/times`
    ); // path ตรง spec แล้ว
    return (Array.isArray(response.data) ? response.data : []).map(mapStudyTime); // normalize ก่อนปล่อยออก
  } catch (error) {
    console.error("Error fetching study times:", error); // แค็ป log ไว้ trace ง่าย
    throw error; //โยนต่อให้ UI ตัดสินใจ
  }
};


// ใช้เปิด modal แก้ไขทีละรายการ
export const getStudyTimeOne = async (
  subjectId: string,
  timeId: number | string
): Promise<SubjectStudyTimeInterface> => {
  if (!subjectId) throw new Error("subjectId is required");
  if (timeId === null || timeId === undefined) throw new Error("timeId is required"); // (ฉัน) กัน undefined หลุด

  try {
    const response = await api.get<StudyTimeAPI>(
      `/subjects/${subjectId}/times/${timeId}`
    ); // composite key ชัดเจน
    return mapStudyTime(response.data); // คืนรูปแบบกลางของเรา
  } catch (error) {
    console.error("Error fetching study time:", error);
    throw error;
  }
};


// ใช้ตอนกด เพิ่มช่วงเวลา — ส่งแค่ช่วงเวลา
export const addStudyTime = async (
  subjectId: string,
  data: { start: string; end: string }
): Promise<SubjectStudyTimeInterface> => {
  if (!subjectId) throw new Error("subjectId is required");
  try {
    const response = await api.post<StudyTimeAPI>(
      `/subjects/${subjectId}/times`,
      data,
      { headers: { "Content-Type": "application/json" } } // (ฉัน) ย้ำ header JSON ให้ชัวร์
    );
    return mapStudyTime(response.data); // (ฉัน) คืนของที่ BE สร้างจริง ๆ
  } catch (error) {
    console.error("Error creating study time:", error);
    throw error;
  }
};


// partial update — ส่งเฉพาะฟิลด์ที่เปลี่ยน
export const updateStudyTime = async (
  subjectId: string,
  timeId: number | string,
  data: Partial<{ start: string; end: string }>
): Promise<SubjectStudyTimeInterface> => {
  if (!subjectId) throw new Error("subjectId is required");
  if (timeId === null || timeId === undefined) throw new Error("timeId is required");

  try {
    const response = await api.put<StudyTimeAPI>(
      `/subjects/${subjectId}/times/${timeId}`,
      data,
      { headers: { "Content-Type": "application/json" } } // (ฉัน) ให้ BE อ่าน body ได้แน่ ๆ
    );
    return mapStudyTime(response.data); // (ฉัน) กลับเข้า format กลาง
  } catch (error) {
    console.error("Error updating study time:", error);
    throw error;
  }
};

// ปุ่ม ลบ ใน modal — ไม่มี body ส่งแค่ path ก็พอ
export const deleteStudyTime = async (
  subjectId: string,
  timeId: number | string
): Promise<void> => {
  if (!subjectId) throw new Error("subjectId is required");
  if (timeId === null || timeId === undefined) throw new Error("timeId is required");

  try {
    // เดิมลืม "/" คั่น -> /times${timeId}
    await api.delete(`/subjects/${subjectId}/times/${timeId}`); // (ฉัน) 200/204 โอเคถือว่าจบ
  } catch (error) {
    console.error("Error deleting study time:", error);
    throw error;
  }
};