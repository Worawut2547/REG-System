export interface UserInterface {
  ID?: number;
  username?: string;
  role?: "student" | "teacher" | "admin" | string;
}

export interface ReviewerInterface {
  Reviewer_id: string;
  UserID?: number;
  User?: UserInterface | null;
}

// ใช้กับ Select
export interface ReviewerOption {
  value: string; // reviewer_id
  label: string; // ชื่ออาจารย์ (หรือ username) + (role)
}
