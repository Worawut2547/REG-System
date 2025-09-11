export interface ReviewerInterface {
  Reviewer_id?: string; // primary key (string)

  UserID?: number;      // FK to Users.ID
  User?: any;           // optional embedded user object (ตาม backend ส่งมา)
}
