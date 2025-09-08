import axios from "axios";
import type { GraduationInterface , UpdateGraduationInput } from "../../../interfaces/Graduation";

import { apiUrl } from "../../api";

//const apiUrl = "/graduations";
//const apiUrl = "http://localhost:8080/graduations";


// --------------------------
// ดึงข้อมูลผู้แจ้งจบทั้งหมด (Admin)
// --------------------------
/*export const getAllGraduations = async (): Promise<GraduationInterface[]> => {
    try {
        const res = await axios.get(apiUrl, { withCredentials: true });
        const items = res.data?.data ?? [];

        if (!Array.isArray(items)) {
            console.error("Unexpected response format:", res.data);
            return [];
        }

        return items.map((item: any): GraduationInterface => ({
            id: item.GraduationID?.toString() || "",
            StudentID: item.StudentID || "",
            fullName: `${item.FirstName ?? ""} ${item.LastName ?? ""}`.trim(),
            curriculum: item.Curriculum ?? "",
            statusStudent: item.StatusStudent ?? "รอตรวจสอบ",
            reason: item.RejectReason ?? "",
            Date: item.Date ? new Date(item.Date) : null,
        }));
    } catch (err) {
        console.error("Error fetching all graduations:", err);
        return [];
    }
};*/

// Mapping รหัส status เป็นข้อความ
/*const statusMap: Record<string, string> = {
    "30": "อนุมัติ",
    "40": "ปฏิเสธ",
};*/

// --------------------------
// อัปเดตคำขอแจ้งจบ (Admin) รอแก้
// --------------------------
export const updateGraduations = async (id: string, data: UpdateGraduationInput) => {
    try {

        const res = await axios.get(`${apiUrl}/${id}`);
        
        // backend ต้องการ GraduationID + StatusStudentID + RejectReason
        const payload = {
            GraduationID: Number(id),
            StatusStudentID: data.StatusStudent,
            RejectReason: data.StatusStudent === "40" ? data.RejectReason : "",
        };

        //const res = await axios.put(`${apiUrl}/${id}`, payload);
        console.log(res.data);


        return {
            statusStudent: data.StatusStudent === "30" ? "อนุมัติ" : "ไม่อนุมัติ",
            reason: payload.RejectReason ?? "",
        };
    } catch (err) {
        console.error("Error updating graduation:", err);
        throw err;
    }
};

// ดึงข้อมูลผู้แจ้งจบทั้งหมด
export const getAllGraduations = async (): Promise<GraduationInterface[]> => {
    try {
        const res = await axios.get(`${apiUrl}/graduations/`);
        console.log("api graduations",res.data)
        //const res = await axios.get(apiUrl, { withCredentials: true });
        const items = res.data?.data ?? [];

        return items.map((item: any): GraduationInterface => ({
            id: item.GraduationID?.toString() || "",
            StudentID: item.StudentID || "",
            fullName: `${item.FirstName ?? ""} ${item.LastName ?? ""}`.trim(),
            curriculum: item.Curriculum ?? "",
            statusStudent: item.StatusStudent ?? "รอตรวจสอบ",
            reason: item.RejectReason ?? "",
            Date: item.Date ? new Date(item.Date) : null,
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
    data: GraduationInterface
): Promise<GraduationInterface> => {
    try {
        const res = await axios.post(`${apiUrl}/graduations/`, data);
        console.log("api create graduation:",res.data);
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
        const res = await axios.get(`${apiUrl}/id`, { withCredentials: true });
        const data = res.data?.data;

        if (!data) return null;

        return {
            id: data.GraduationID?.toString() || "",
            StudentID: data.StudentID || "",
            fullName: `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim(),
            curriculum: data.Curriculum ?? "",
            statusStudent: data.StatusStudent ?? "รอตรวจสอบ",
            reason: data.RejectReason ?? "",
            Date: data.Date ? new Date(data.Date) : null,
        };
    } catch (err) {
        console.error("Error fetching my graduation:", err);
        return null;
    }
};