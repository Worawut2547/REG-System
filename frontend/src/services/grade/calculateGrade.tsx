import { type GradeStudentInterface } from '../../interfaces/Grade';

const gradeToPoint = (grade: string) => {
  switch(grade) {
    case "A": return 4.0;
    case "B+": return 3.5;
    case "B": return 3.0;
    case "C+": return 2.5;
    case "C": return 2.0;
    case "D+": return 1.5;
    case "D": return 1.0;
    case "F": return 0;
    default: return 0;
  }
};

export const calculateSummary = (records: GradeStudentInterface[][]) => {
  const result: {
    termCredits: number;
    termGPA: number;
    cumulativeCredits: number;
    cumulativeGPA: number;
  }[] = [];

  records.forEach((termRecords, idx) => {
    const termCredits = termRecords.reduce((sum, r) => sum + (r.Credit ?? 0), 0);
    const termGradePoints = termRecords.reduce((sum, r) => sum + (gradeToPoint(r.Grade) * (r.Credit ?? 0)), 0);
    
    const termGPA = termCredits ? +(termGradePoints / termCredits).toFixed(2) : 0;

    const prev = idx > 0 ? result[idx - 1] : { cumulativeCredits: 0, cumulativeGPA: 0, termCredits: 0, termGPA: 0 };
    const cumulativeCredits = prev.cumulativeCredits + termCredits;
    const cumulativeGradePoints = prev.cumulativeGPA * prev.cumulativeCredits + termGradePoints;
    const cumulativeGPA = cumulativeCredits ? +(cumulativeGradePoints / cumulativeCredits).toFixed(2) : 0;

    result.push({
      termCredits,
      termGPA,
      cumulativeCredits,
      cumulativeGPA,
    });
  });

  return result;
};