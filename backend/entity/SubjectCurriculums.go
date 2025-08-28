package entity

type SubjectCurriculum struct {
  SubjectID           string `json:"subject_id"           gorm:"not null;size:64;uniqueIndex:ux_subject_curriculum"`
  CurriculumID        string `json:"curriculum_id"        gorm:"not null;size:64;uniqueIndex:ux_subject_curriculum"`
}
