// รายงานคำร้อง + ความสัมพันธ์ที่ front ใช้อยู่
export type Attachment = {
  attachment_id?: string;
  Attachment_id?: string;

  file_name?: string;
  File_Name?: string;
  File_name?: string;
  Attachment_File_Name?: string;

  file_path?: string;
  File_Path?: string;
  File_path?: string;
  Attachment_File_Path?: string;

  uploaded_date?: string;
  Uploaded_date?: string;
  Attachment_Uploaded_date?: string;
};

export interface ReportInterface {
  Report_id: string;
  Report_details?: string;
  ReportSubmission_date?: string; // จาก backend (json:"ReportSubmission_date")
  ReportStatus?: string;

  // กันคีย์หลากหลายจากบริการเดิม
  Submittion_date?: string;
  Submission_date?: string;
  created_at?: string;
  CreatedAt?: string;

  StudentID?: string;

  Reviewer_id?: string;
  Reviewer?: { User?: { Username?: string } } | null;

  ReportType_id?: string;
  ReportType?: { ReportType_Name?: string } | null;

  // แนบไฟล์ (one-to-many)
  attachments?: Attachment[] | null;   // ตาม json:"attachments"
  Attachment?: Attachment | Attachment[] | null; // กันค่าเดิม
  Attachments?: Attachment[] | null;            // กันค่าเดิม
}
