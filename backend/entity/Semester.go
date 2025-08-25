package entity

type Semester struct {
	ID            int `gorm:"primaryKey;autoIncrement"`
	Term          int `json:"Term"`
	AcademicYeaar int `json:"AcademicYeaar"`

	Subject []Subject `gorm:"references:ID" json:"-"`  // ระบุความสัมพันธ์เเบบ 1--many[Subject]
}
