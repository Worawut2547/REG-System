package entity

// ตารางวิชา
type Subjects struct {
	SubjectID   string `json:"subject_id" gorm:"primaryKey"`
	SubjectName string `json:"subject_name"`
	Credit      int    `json:"credit"`

	// ความสัมพันธ์กับ Major
	MajorID string  `json:"major_id"`
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"`

	// ความสัมพันธ์กับ Faculty
	FacultyID string   `json:"faculty_id"`
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"`

	// ความสัมพันธ์กับ StudyTime (One-to-Many)
	StudyTimes []SubjectStudyTime `json:"study_times" gorm:"foreignKey:SubjectID;constraint:OnDelete:CASCADE"`
}