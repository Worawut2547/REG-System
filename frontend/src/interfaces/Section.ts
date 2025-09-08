export interface SectionInterface {
  ID?: number;            // Primary Key (auto increment)
  SectionID?: string;     // Unique section code (e.g., "SEC001")
  Group?: number;         // Group number
  DateTeaching?: string;  // Teaching schedule/description

  SubjectID?: string;     // FK to Subject.SubjectID
  // Optional denormalized field for UI convenience
  SubjectName?: string;   // Subject name when needed
}
