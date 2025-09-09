package entity

type Semester struct {
	ID            int `gorm:"primaryKey;autoIncrement" json:"ID"`
	Term          int `json:"Term"`
	AcademicYear int `json:"AcademicYear"`

	Subject []Subject `gorm:"foreignKey:SemesterID;references:ID" json:"-"`  // ระบุความสัมพันธ์เเบบ 1--many[Subject]
}