export interface StudyTimeInterface {
  start_at: string; // backend ส่ง snake_case สำหรับ StudyTimes
  end_at: string;
  day?: string;
}

export interface SectionInterface {
  // Numeric primary key of Section (entity.ID)
  SectionID: number;
  Group: number;
  DateTeaching: string; // ส่งมาเป็น string จาก backend (format ใน controller)
  SubjectID: string;
  // Optional human-friendly code (entity.SectionID string, e.g., SEC001)
  SectionCode?: string;
}

export interface SubjectInterface {
  SubjectID: string;
  SubjectName: string;
  Credit: number;

  SemesterID?: number;
  MajorID?: string;
  FacultyID?: string;

  StudyTimes?: StudyTimeInterface[];
  Sections?: SectionInterface[];
}
