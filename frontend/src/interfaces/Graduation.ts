export interface GraduationInterface {
    id: string;
    StudentID: string;
    fullName: string;
    curriculum: string;
    statusStudent: string;
    reason: string;
    Date?: Date | null;

    totalCredits: number; // ✅ จำนวนหน่วยกิตรวม
    GPAX: number; // ✅ เกรดเฉลี่ยสะสม
    // ✅ เพิ่มสำหรับ frontend logic
    isVerified?: boolean;
}

export interface CreateGraduationInput {
    StudentID: string;
    Date: string; // "2025-09-07T..." ISO string
}

export interface UpdateGraduationInput {
    StatusStudent: string;
    RejectReason?: string;
    GraduationID: string;
}