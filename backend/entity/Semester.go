package entity

type Semester struct {
	ID           string `gorm:"primaryKey;autoIncrement" json:"SemesterID"`
	Term         int `json:"Term"`
	AcademicYear int `json:"AcademicYear"`

	Subject []Subject `gorm:"foreignKey:SemesterID;references:ID" json:"-"` // ระบุความสัมพันธ์เเบบ 1--many[Subject]
}

