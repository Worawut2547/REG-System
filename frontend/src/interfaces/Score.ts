export interface ScoreInterface {
  ID: number;
  StudentID: string;
  StudentName: string;
  SubjectID: string;
  Scores: {
    Score: number;
    FullScore: number;
    List: string;
  }[];
}
