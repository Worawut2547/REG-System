export interface RegistrationInterface {
  ID?: number;             // Primary key (auto increment)
  RegistrationID?: string; // e.g., "REG001"

  Date?: string;           // ISO string (time of registration)
  SubjectID?: string;      // FK to Subject
  SectionID?: number;      // FK to Section
  StudentID?: string;      // FK to Student
}
