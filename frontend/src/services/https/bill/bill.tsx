import { api } from "../api";
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

export interface APISubject {
  subject_id: string;
  subject_name: string;
  credit: number;
  term: number;
  academicYear: number;
}

export interface BillResponse {
  id: number;
  student_id: string;
  full_name: string;
  total_price: number;
  status: string;
  file_path?: string;
  date: string;
  year: number;
  term: number;
}

// ======================================================
// ดึงบิลของนักศึกษาคนเดียว
// ======================================================
/*export const getBillByStudentID = async (): Promise<BillResponse> => {
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
};*/

/*export const getBillByStudentID = async (): Promise<{
  id: number;
  subjects: APISubject[];
  status: string;
  filePath?: string | null;
  year: number;
  term: number;
}> => {
  try {
    const sid = localStorage.getItem('username');
    if (!sid) throw new Error("ไม่พบ Student ID ใน localStorage");

    const response = await axios.get(`${apiUrl}/bills/${sid}`);
    const data = response.data;

    return {
      id: data.id,
      subjects: data.subjects.map((s: any) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        credit: s.credit,
        term: s.term,
        academicYear: s.academic_year, // แปลงตรงนี้
      })),
      status: data.status || "ค้างชำระ",
      filePath: data.file_path ? `/uploads/${data.file_path}` : null,
      year: data.year,
      term: data.term,
    };
  } catch (error) {
    console.error("Error fetching bill student data:", error);
    throw error;
  }
};*/

/*export const getBillByStudentID = async (): Promise<{
  id: number;
  subjects: APISubject[];
  status: string;
  filePath?: string | null;
  year: number;
  term: number;
}> => {
  try {
    const sid = localStorage.getItem('username');
    if (!sid) throw new Error("ไม่พบ Student ID ใน localStorage");

    const response = await axios.get(`${apiUrl}/bills/${sid}`);
    const data = response.data;

    return {
      id: data.id,
      subjects: data.subjects.map((s: any) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        credit: s.credit,
        term: s.term,
        academicYear: s.academic_year, // แปลงตรงนี้
      })),
      status: data.status || "ค้างชำระ",
      filePath: data.file_path ? `/uploads/${data.file_path}` : null,
      year: data.year,
      term: data.term,
    };
  } catch (error) {
    console.error("Error fetching bill student data:", error);
    throw error;
  }
};*/

export const getBillByStudentID = async (): Promise<{
  id: number;
  subjects: APISubject[];
  statusMap: { [key: string]: string };
  filePathMap: { [key: string]: string };
  totalPriceMap: { [key: string]: number };
}> => {
  try {
    const sid = localStorage.getItem("username");
    if (!sid) throw new Error("ไม่พบ Student ID ใน localStorage");

    const response = await api.get(`/bills/${sid}`);
    const data = response.data;

    const subjects: APISubject[] = data.subjects.map((s: any) => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      credit: s.credit,
      term: s.term,
      academicYear: s.academic_year,
    }));

    const statusMap: { [key: string]: string } = data.status_map || {};
    const filePathMap: { [key: string]: string } = data.file_path_map || {};
    const totalPriceMap: { [key: string]: number } = data.total_price_map || {};

    return {
      id: data.id,
      subjects,
      statusMap,
      filePathMap,
      totalPriceMap,
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
    const response = await api.get(`/bills/admin/all`);

    return response.data

  } catch (error) {
    console.error("Error fetching all bills: ", error);
    throw error;
  }
};

// ======================================================
// นักเรียนอัปโหลดใบเสร็จ
// ======================================================
export const uploadReceipt = async (studentID: string, file: File, year: number, term: number) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/bills/upload/${studentID}/${year}/${term}`, formData, {
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
    const res = await api.put(`/bills/${billId}`, { status_id: 3 }, { withCredentials: true });
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