package entity

type Semester struct {
	SemesterID   int    `gorm:"primaryKey;autoIncrement" json:"SemesterID"`
	Term          int `json:"Term"`
	AcademicYeaar int `json:"AcademicYeaar"`
}
