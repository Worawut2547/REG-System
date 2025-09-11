export interface ReportInterface {
  // Primary and core fields
  Report_id?: string;
  Report_details?: string;
  ReportSubmission_date?: string; // ISO string (backend uses time.Time)
  ReportStatus?: string;

  // Timestamps
  Created_at?: string;
  Updated_at?: string;
  Deleted_at?: string | null;

  // Relations (by ID + optional embedded objects)
  StudentID?: string;
  Student?: any;

  Reviewer_id?: string;
  Reviewer?: any;

  ReportType_id?: string;
  ReportType?: any;

  // Attachments from backend (json:"attachments")
  attachments?: any[];
}
