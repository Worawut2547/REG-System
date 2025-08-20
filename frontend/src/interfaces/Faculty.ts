import { type MajorInterface } from "./Major";

export interface FacultyInterface {
    FacultyID?: string;
    FacultyName?: string;

    Majors?: MajorInterface[];
}
