package entity
// ตารางวิชา
// entity/subject.go
type Subject struct {
    SubjectID   string    `gorm:"primaryKey;column:subject_id" json:"SubjectID"`
    SubjectName string    `json:"SubjectName"`
    Credit      int       `json:"Credit"`

    SemesterID  int        `json:"SemesterID"`
    Semester    *Semester  `gorm:"foreignKey:SemesterID;references:ID"`

    MajorID string  `json:"MajorID"`
    Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"`

    FacultyID string   `json:"FacultyID"`
    Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"`

    TeacherID string     `json:"TeacherID"`
    Teacher   *Teachers  `gorm:"foreignKey:TeacherID;references:TeacherID"`

    StudyTimes []SubjectStudyTime `json:"study_times" gorm:"foreignKey:SubjectID;references:SubjectID;constraint:OnDelete:CASCADE"`
    Grade      []Grades           `gorm:"foreignKey:SubjectID;references:SubjectID" json:"Grade"`
    Sections   []Section           `gorm:"foreignKey:SubjectID;references:SubjectID" json:"sections"`
}

