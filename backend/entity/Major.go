package entity

type Majors struct {
	MajorID   string `gorm:"primaryKey;unique" json:"MajorID"`
	MajorName string `json:"MajorName"`

	FacultyID string   `json:"FacultyID"`                                 // Foreign Key
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"` // ระบุความสัมพันธ์ 1--1 [Faculty]

	Students []Students `gorm:"foreignKey:MajorID" json:"-"` // ระบุความสัมพันธ์ 1--many [Students]
	Teachers []Teachers `gorm:"foreignKey:MajorID" json:"-"` // ระบุความสัมพันธ์ 1--many [Teachers]

	Curriculum []Curriculum `gorm:"foreignKey:MajorID" json:"-"` // ระบุความสัมพันธ์ 1--many [Curriculum]
	Subjects []Subjects `gorm:"foreignKey:MajorID" json:"-"` // ระบุความสัมพันธ์ 1--many [Subjects]
}
