package entity

import (
	"gorm.io/gorm"
	"time"
)

type Students struct {
	ID int `gorm:"autoIncrement" json:"ID"`

	StudentID   string    `gorm:"primaryKey" json:"StudentID"`
	FirstName   string    `json:"FirstName"`
	LastName    string    `json:"LastName"`
	CitizenID   string    `json:"CitizenID"`
	Email       string    `json:"Email"`
	Phone       string    `json:"Phone"`
	GraduteDate time.Time `json:"GraduteDate"`

	GenderID int     `json:"GenderID"`
	Gender   *Gender `gorm:"foreignKey:GenderID;references:ID"`

	DegreeID int     `json:"DegreeID"`
	Degree   *Degree `gorm:"foreignKey:DegreeID;references:DegreeID"` // ระบุความสัมพันธ์ 1--1 [Degree]*/

	FacultyID string   `json:"FacultyID"`                                 // Foreign Key
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"` // ระบุความสัมพันธ์ 1--1 [Faculty]

	MajorID string  `json:"MajorID"`                               // Foreign Key
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"` // ระบุความสัมพันธ์ 1--1 [Majors]

	StatusStudentID string         `json:"StatusStudentID"`                                       // Foreign Key
	StatusStudent   *StatusStudent `gorm:"foreignKey:StatusStudentID;references:StatusStudentID"` // ระบุความสัมพันธ์ 1--1 [StatusStudent]

	CurriculumID string      `json:"CurriculumID"`                                    // Foreign Key
	Curriculum   *Curriculum `gorm:"foreignKey:CurriculumID;references:CurriculumID"` // ระบุความสัมพันธ์ 1--1[Curriculum]

	CreatedAt time.Time      `json:"CreatedAt"`
	UpdatedAt time.Time      `json:"UpdatedAt"`
	DeletedAt gorm.DeletedAt `json:"DeletedAt,omitempty" gorm:"index"` // ใช้สำหรับ soft delete
}
