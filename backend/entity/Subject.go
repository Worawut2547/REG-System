package entity
// ตารางวิชา
type Subject struct {
	SubjectID   string `gorm:"unique" json:"SubjectID"`
	SubjectName string `json:"SubjectName"`
	Credit      int    `json:"Credit"`
	// ความสัมพันธ์กับ Semester (One-to-Many)
    SemesterID int       `json:"SemesterID"`                          // Foreign Key
	Semester   *Semester `gorm:"foreignKey:SemesterID;references:ID"` // ระบุความสัมพันธ์เเบบ 1--1[Semester]
	// ความสัมพันธ์กับ Major
	MajorID string  `json:"MajorID"`
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"`

	// ความสัมพันธ์กับ Faculty
	FacultyID string   `json:"FacultyID"`
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"`

	// ความสัมพันธ์กับ StudyTime (One-to-Many)
	StudyTimes []SubjectStudyTime `json:"study_times" gorm:"foreignKey:SubjectID;references:SubjectID;constraint:OnDelete:CASCADE"`
	Grade []Grades `gorm:"foreignKey:SubjectID;references:SubjectID" json:"Grade"` // ระบุความสัมพันธ์เเบบ 1--many[Grade]

}

