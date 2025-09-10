import axios from "axios";
import type { CreateGraduationInput, GraduationInterface } from "../../../interfaces/Graduation";

import { apiUrl } from "../../api";

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
        const res = await axios.get(`${apiUrl}/graduations/`);
        console.log("api graduations", res.data)
        const items = res.data?.data ?? [];

        return items.map((item: any): GraduationInterface => ({
            id: item.GraduationID?.toString() || "",
            StudentID: item.StudentID || "",
            fullName: `${item.FirstName ?? ""} ${item.LastName ?? ""}`.trim(),
            curriculum: item.Curriculum ?? "",
            statusStudent: item.StatusStudent ?? "รอตรวจสอบ",
            reason: item.RejectReason ?? "",
            Date: item.Date ? new Date(item.Date) : null,

            totalCredits: item.TotalCredits ?? 0, // ✅ ดึงมาจาก backend
            GPAX: item.GPA ?? 0,
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
        const res = await axios.post(`${apiUrl}/graduations/`, data);
        console.log("api create graduation:", res.data);
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
        if (!studentID) return null;

        const res = await axios.get(`${apiUrl}/graduations/${studentID}`);
        const data = res.data?.data; // data ต้องเป็น object ไม่ใช่ array

        if (!data) return null;

        console.log("Graduation reason:", data.RejectReason);
        console.log("GPAX from backend:", data.GPA);
        console.log("TotalCredits from backend:", data.TotalCredits);

        return {
            id: data.GraduationID?.toString() || "",
            StudentID: data.StudentID || "",
            fullName: `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim(),
            curriculum: data.Curriculum ?? "",
            statusStudent: data.StatusStudent ?? "รอตรวจสอบ",
            GPAX: data.GPA ?? 0,
            reason: data.RejectReason ?? "",
            Date: data.Date ? new Date(data.Date) : null,
            totalCredits: data.TotalCredits ?? 0, // ✅ จะออก
        };
    } catch (err: any) {
        if (axios.isAxiosError(err)) {
            console.error("Axios error response:", err.response?.data);
        } else {
            console.error(err);
        }
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
            RejectReason: rejectReason ?? null, // ถ้าไม่มี rejectReason ให้เป็น null
        };

        const res = await axios.put(`${apiUrl}/graduations/${graduationID}`, payload, {
            withCredentials: true,
        });

        console.log("Graduation updated:", res.data);
    } catch (err: any) {
        console.error("Failed to update graduation:", err.response?.data || err.message);
        throw err;
    }
};
