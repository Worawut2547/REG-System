package entity

type Grades struct {
	ID         int     `gorm:"primaryKey;autoIncrement" json:"ID"`
	TotalScore float32 `json:"TotalScore"`
	Grade      string  `json:"Grade"`

	StudentID string    `gorm:"uniqueIndex:idx_student_subject" json:"StudentID"`
	Students  *Students `gorm:"foreignKey:StudentID;references:StudentID"` // ระบุความสัมพันธ์ 1--1 [Student]

	SubjectID string   `gorm:"uniqueIndex:idx_student_subject" json:"SubjectID"` // Foreign Key
	Subject   *Subject `gorm:"foreignKey:SubjectID;references:SubjectID"`        // ระบุความสัมพันธ์ 1--many [Subject]

}