import type { SubjectInterface } from "./Subjects";
import type { StudentInterface } from "./Student";

export interface RegistrationInterface {
  RegistrationID?: number | string;
  Date: string;         // ISO string
  SubjectID: string;
  SectionID?: number;
  StudentID: string;

  Subject?: SubjectInterface;
  Section?: any;
  Student?: StudentInterface;
}
