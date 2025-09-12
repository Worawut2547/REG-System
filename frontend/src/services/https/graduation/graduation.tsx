import type { CreateGraduationInput, GraduationInterface } from "../../../interfaces/Graduation";

import { api } from "../api";

// --------------------------
// อัปเดตคำขอแจ้งจบ (Admin) รอแก้
// --------------------------

export const statusStudentMap: Record<string, string> = {
    "20": "รอตรวจสอบ",
    "30": "สำเร็จการศึกษา",
    "40": "ไม่อนุมัติให้จบการศึกษา",
};


// ดึงข้อมูลผู้แจ้งจบทั้งหมด
export const getAllGraduations = async (): Promise<GraduationInterface[]> => {
    try {

        const res = await api.get(`/graduations/`);
        const items = res.data?.data ?? [];

        return items.map((item: any): GraduationInterface => ({
            id: item.GraduationID?.toString() || "",
            StudentID: item.StudentID || "",
            fullName: `${item.FirstName ?? ""} ${item.LastName ?? ""}`.trim(),
            curriculum: item.Curriculum ?? item.Student?.Curriculum?.CurriculumName ?? "",
            statusStudent: item.StatusStudent ?? "รอตรวจสอบ",
            reason: item.RejectReason ?? "",
            Date: item.Date ? new Date(item.Date) : null,
            totalCredits: item.TotalCredits ?? 0,
            GPAX: item.GPAX ?? 0, // ✅ map จาก backend field GPA
        }));
    } catch (err) {
        console.error("Error fetching all graduations:", err);
        return [];
    }
};



// --------------------------
// สร้างคำขอแจ้งจบ (นักศึกษา)
// --------------------------
export const createGraduation = async (
    data: CreateGraduationInput
): Promise<GraduationInterface> => {
    try {

        const res = await api.post(`/graduations/`, data);
        const item = res.data?.data;

        if (!item) throw new Error("No data returned from backend");

        return {
            id: item.GraduationID?.toString() || "",
            StudentID: item.StudentID || "",
            fullName: `${item.FirstName ?? ""} ${item.LastName ?? ""}`.trim(),
            curriculum: item.Curriculum ?? "",
            statusStudent: item.StatusStudent ?? "รอตรวจสอบ",
            reason: item.RejectReason ?? "",
            Date: item.Date ? new Date(item.Date) : null,

            totalCredits: item.TotalCredits ?? 0, // ✅ ดึงมาจาก backend
            GPAX: item.Gpax ?? 0,
        };
    } catch (err: any) {
        console.error("Failed to create graduation:", err.response?.data || err.message);
        throw err;
    }
};

// --------------------------
// ดึงคำขอแจ้งจบของนักศึกษาปัจจุบัน
// --------------------------
export const getMyGraduation = async (): Promise<GraduationInterface | null> => {
    try {
        const studentID = localStorage.getItem("username");

        const res = await api.get(`/graduations/${studentID}`);

        const data = res.data?.data;
        if (!data) return null;

        return {
            id: data.GraduationID?.toString() || "",
            StudentID: data.StudentID || "",
            fullName: `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim(),
            curriculum: data.Curriculum ?? data.Student?.Curriculum?.CurriculumName ?? "",
            statusStudent: data.StatusStudent ?? "รอตรวจสอบ",
            GPAX: data.GPA ?? 0,
            reason: data.RejectReason ?? "",
            Date: data.Date ? new Date(data.Date) : null,
            totalCredits: data.TotalCredits ?? 0,
        };
    } catch (err) {
        console.error("Error fetching my graduation:", err);
        return null;
    }
};


export const updateGraduation = async (
    graduationID: string,
    statusStudentID: string,
    rejectReason?: string
): Promise<void> => {
    try {

        const payload = {
            StatusStudentID: statusStudentID,
            RejectReason: rejectReason ?? null,
        };

        const res = await api.put(`/graduations/${graduationID}`, payload);

        console.log("Graduation updated:", res.data);
        return res.data;

    } catch (err: any) {
        console.error("Failed to update graduation:", err.response?.data || err.message);
        throw err;
    }
};


/*
-----------------------------------------
Authorization / Authentication ในระบบนี้
-----------------------------------------

1. **ทำไมต้องใส่ Authorization header**
   - Backend ของเราใช้การตรวจสอบสิทธิ์ (Authorization) เพื่อป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
   - หากไม่มี header นี้หรือไม่มี token/credentials ที่ถูกต้อง ระบบจะตอบกลับ HTTP 401 Unauthorized
   - 401 หมายถึง "คุณไม่ได้เข้าสู่ระบบ หรือไม่มีสิทธิ์เข้าถึง resource นี้"

2. **วิธีการส่งข้อมูล Authorization**
   - ใช้ JWT Token: ส่งผ่าน header
        Authorization: Bearer <access_token>
   - หรือใช้ session cookie (ถ้า backend ตั้งค่า cookie ไว้) ต้องตั้ง `withCredentials: true` ใน axios/fetch
   - ตัวอย่าง axios:
        axios.put(url, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

3. **เหตุผลที่ทุก request บางอย่างต้องมี**
   - การสร้าง หรืออัปเดตข้อมูลสำคัญ เช่น การแจ้งจบการศึกษา ต้องรู้ว่า request มาจากใคร
   - ป้องกันคนอื่นส่ง request ปลอม (ไม่ใช่เจ้าของบัญชี)
   - รักษาความปลอดภัยข้อมูลของนักศึกษาและระบบ

4. **Flow การทำงาน**
   - ผู้ใช้ login → backend ส่ง access token หรือ session cookie
   - Frontend เก็บ token (localStorage/sessionStorage) หรือ cookie
   - ทุก request ที่ต้องการสิทธิ์ → แนบ token/cookie
   - Backend ตรวจสอบ token/cookie → อนุญาตหรือปฏิเสธ

5. **สัญญาณข้อผิดพลาด**
   - HTTP 401 → Unauthorized → token/credentials หายหรือไม่ถูกต้อง
   - HTTP 403 → Forbidden → รู้จักผู้ใช้แล้ว แต่ไม่มีสิทธิ์ทำ action นั้น

สรุป: การใส่ Authorization header หรือ `withCredentials: true` เป็นวิธีบอก server ว่า “นี่คือผู้ใช้ที่ถูกต้อง มีสิทธิ์ทำ action นี้”
*/