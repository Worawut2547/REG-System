import axios from "axios";
import { apiUrl } from "../../api";
export interface DataType {
  key: string;
  StudentID: string;
  no: number;
  fullName: string;
  receiptNo: string;
  paymentDate: string;
  year: string;
  term: string;
  totalPrice?: number;
  filePath?: string;
  status?: string;
}

export interface Subject {
  SubjectID: string;
  SubjectName: string;
  Credit: number;
  Term: number;
  AcademicYear: number;
}

export interface BillResponse {
  id: number;
  subjects: Subject[];
  status: string;
  filePath?: string | null;
}

// ======================================================
// ดึงบิลของนักศึกษาคนเดียว
// ======================================================
export const getBillByStudentID = async (): Promise<BillResponse> => {
  try {
    const sid = localStorage.getItem('username');
    if (!sid) throw new Error("ไม่พบ Student ID ใน localStorage");

    const response = await axios.get(`${apiUrl}/bills/${sid}`);
    const data = response.data;

    return {
      id: data.id,
      subjects: data.subjects || [],
      status: data.status || "ค้างชำระ",
      filePath: data.filePath ? `/uploads/${data.filePath}` : null,
    };
  } catch (error) {
    console.error("Error fetching bill student data:", error);
    throw error;
  }
};

// ======================================================
// ดึงบิลทั้งหมด (สำหรับแอดมิน)
// ======================================================
export const getAllBills = async (): Promise<BillResponse[]> => {
  try {
    const response = await axios.get(`${apiUrl}/bills/admin/all`);
    console.log("api bill data:",response.data);

    return response.data
    /*return response.data.map((bill: any) => ({
      key: String(bill.id),
      StudentID: bill.student_id ?? '-',
      no: bill.id,
      fullName: bill.full_name ?? '-',
      receiptNo: '-',
      paymentDate: bill.date ?? '-',
      year: String(bill.year ?? '-'),
      term: String(bill.term ?? '-'),
      totalPrice: bill.total_price ?? 0,
      filePath: bill.file_path ? `/uploads/${bill.file_path}` : null,
      status: bill.status ?? '-',
    }));*/
  } catch (error) {
    console.error("Error fetching all bills: ", error);
    throw error;
  }
};

// ======================================================
// นักเรียนอัปโหลดใบเสร็จ
// ======================================================
export const uploadReceipt = async (billID: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${apiUrl}/bills/upload/${billID}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading receipt:", error);
    throw error;
  }
};

// ======================================================
// แอดมินอนุมัติใบเสร็จ
// ======================================================
export const approveBill = async (billId: string) => {
  try {
    const res = await axios.put(`/bills/admin/update/${billId}`, { status_id: 3 }, { withCredentials: true });
    return res.data;
  } catch (err) {
    console.error('Failed to approve bill:', err);
    throw err;
  }
};

// ======================================================
// preview PDF (ใช้ <iframe src={filePath} />)
// ======================================================
export const getBillPreviewUrl = (filePath: string | null) => {
  if (!filePath) return null;
  return filePath.startsWith("/") ? filePath : `/uploads/${filePath}`;
};