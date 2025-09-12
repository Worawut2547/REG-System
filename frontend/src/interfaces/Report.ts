export interface ReportInterface {
  Report_id?: string;
  Report_details?: string;
  ReportSubmission_date?: string;
  ReportStatus?: string;

  Created_at?: string;
  Updated_at?: string;
  Deleted_at?: string | null;

  StudentID?: string;
  Student?: any;

  Reviewer_id?: string;
  Reviewer?: any;

  ReportType_id?: string;
  ReportType?: any;

  attachments?: any[];
}