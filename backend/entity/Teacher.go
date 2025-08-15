package entity

type Teachers struct {
	ID        int    `gorm:"autoIncrement" json:"ID"`
	TeacherID string `gorm:"primaryKey" json:"TeacherID"`
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	CitizenID string `json:"CitizenID"`
	Gender    string `json:"Gender"`
	Email     string `json:"Email"`
	Phone     string `json:"Phone"`

	FacultyID string  `json:"FacultyID"` // Foreign Key
	Faculty   Faculty // ระบุความสัมพันธ์ 1--1 [Faculty]

	MajorID string `json:"MajorID"` // Foreign Key
	Major   Majors // ระบุความสัมพันธ์ 1--1 [Majors]
}
