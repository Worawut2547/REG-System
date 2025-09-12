
// src/services/https/registration/registration.tsx
import { api } from "../api";
import type { RegistrationInterface } from "../../../interfaces/Registration";

// ดึงรายการลงทะเบียนของนักศึกษาแต่ละคน
export const getMyRegistrations = async (studentId: string) => {
  if (!studentId) throw new Error("studentId is required");
  try {
    const res = await api.get(`/registrations/${encodeURIComponent(studentId)}`);
    return res.data;
  } catch (error: any) {
    // ถ้าไม่มีรายการและ backend ตอบ 404 ให้คืน [] เพื่อเคลียร์ตารางในหน้า drop
    const status = error?.response?.status;
    if (status === 404) {
      return [] as any[];
    }
    console.error("Error fetching registrations:", error);
    throw error;
  }
};

// สร้างข้อมูลลงทะเบียนแบบรายการเดียว
export const createRegistration = async (data: RegistrationInterface) => {
  try {
    const res = await api.post(`/registrations/`, data);
    return res.data;
  } catch (error) {
    console.error("Error creating registration:", error);
    throw error;
  }
};

// สร้างข้อมูลลงทะเบียนแบบหลายรายการ (อาจไม่รองรับที่ backend ปัจจุบัน)
// หน้า UI มี fallback เรียก createRegistration ทีละรายการอยู่แล้ว
export const createRegistrationBulk = async (
  studentId: string,
  items: Array<{ SubjectID: string }>
) => {
  if (!studentId) throw new Error("studentId is required");
  if (!items || items.length === 0) throw new Error("items is required");
  try {
    const payload = { student_id: studentId, items };
    const res = await api.post(`/registrations/bulk`, payload);
    return res.data;
  } catch (error) {
    // ให้ throw ต่อเพื่อให้หน้า UI ทำ fallback เอง
    console.error("Error creating registrations (bulk):", error);
    throw error;
  }
};

// ลบรายการลงทะเบียนตาม id ภายใน (ตัวเลข) หรือรหัส REGxxx ถ้ารองรับ
export const deleteRegistration = async (id: number | string) => {
  if (id === undefined || id === null || id === "") throw new Error("id is required");
  try {
    const res = await api.delete(`/registrations/${encodeURIComponent(String(id))}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting registration:", error);
    throw error;
  }
};

// สำหรับอาจารย์: ดึงรายชื่อนักศึกษาที่ลงทะเบียนในวิชาตามรหัสวิชา
// หมายเหตุ: รวมเป็นฟังก์ชันเดียว คืนค่าเป็น data (array)
export const getStudentBySubjectID = async <T = any>(subjectId: string): Promise<T[]> => {
  if (!subjectId) throw new Error("subjectId is required");
  try {
    const res = await api.get(`/registrations/subjects/${encodeURIComponent(subjectId)}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching students by subject:", error);
    throw error;
  }
};

