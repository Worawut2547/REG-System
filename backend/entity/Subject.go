package entity

type Subject struct {

	ID          int    `gorm:"primaryKey;autoIncrement" json:"ID"`
	SubjectID   string `gorm:"unique" json:"SubjectID"`
	SubjectName string `json:"SubjectName"`
	Credit      int    `json:"Credit"`

	
	SubjectSchedules []SubjectSchedules `gorm:"foreignKey:SubjectID;references:SubjectID" json:"SubjectSchedules"` // ระบุความสัมพันธ์เเบบ 1--many[SubjectSchedules]

	SemesterID int       `json:"SemesterID"`                          // Foreign Key
	Semester   *Semester `gorm:"foreignKey:SemesterID;references:ID"` // ระบุความสัมพันธ์เเบบ 1--1[Semester]

	FacultyID string   `json:"FacultyID"`                                 // Foreign Key
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"` // ระบุความสัมพันธ์เเบบ 1--1[Faculty]

	MajorID string  `json:"MajorID"`                               // Foreign Key
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"` // ระบุความสัมพันธ์เเบบ 1--1[Majors]

	Grade []Grades `gorm:"foreignKey:SubjectID;references:SubjectID" json:"Grade"` // ระบุความสัมพันธ์เเบบ 1--many[Grade]

}
