package entity

type Faculty struct {
	FacultyID   string `gorm:"primaryKey;unique" json:"FacultyID"`
	FacultyName string `json:"FacultyName"`

	Students []Students `gorm:"foreignKey:FacultyID" json:"-"` // ระบุความสัมพันธ์ 1--many [Students]
	Teachers []Teachers `gorm:"foreignKey:FacultyID" json:"-"` // ระบุความสัมพันธ์ 1--many [Teachers]
	Majors   []Majors   `gorm:"foreignKey:FacultyID" json:"-"`   // ระบุความสัมพันธ์ 1--many [Majors]
	Curriculum []Curriculum `gorm:"foreignKey:FacultyID" json:"-"`   // ระบุความสัมพันธ์ 1--many [Curriculum]
}

