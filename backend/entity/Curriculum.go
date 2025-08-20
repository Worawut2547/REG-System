package entity

import (
	"time"
	"gorm.io/gorm"
)

type Curriculum struct {
	CurriculumID   string `gorm:"primaryKey" json:"CurriculumID"`
	CurriculumName string `json:"CurriculumName"`
	TotalCredit    int    `json:"TotalCredit"`
	StartYear      int    `json:"StartYear"`
	Description    string `json:"Description"`

	FacultyID string   `json:"FacultyID"`
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"`

	MajorID string  `json:"MajorID"`
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"`

	BookID int       `json:"BookID"`
	Book   *BookPath `gorm:"foreignKey:BookID;references:ID"`

	CreatedAt time.Time `json:"CreatedAt"`
	UpdatedAt time.Time `json:"UpdatedAt"`
	DeletedAt gorm.DeletedAt `json:"DeletedAt,omitempty" gorm:"index"` // ใช้สำหรับ soft delete

	Students []Students `gorm:"foreignKey:CurriculumID" json:"-"` // ระบุความสัมพันธ์ 1--many [Student]
}
