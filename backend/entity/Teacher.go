package entity

import (
	"time"
	"gorm.io/gorm"
)

type Teachers struct {
	ID        int    `gorm:"autoIncrement" json:"ID"`
	TeacherID string `gorm:"primaryKey" json:"TeacherID"`
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	CitizenID string `json:"CitizenID"`
	Email     string `json:"Email"`
	Phone     string `json:"Phone"`
	
	GenderID int `json:"GenderID"`
	Gender *Gender `gorm:"foreignKey:GenderID;references:ID"`

	FacultyID string   `json:"FacultyID"` // Foreign Key
	Faculty   *Faculty `gorm:"foreignKey:FacultyID;references:FacultyID"`// ระบุความสัมพันธ์ 1--1 [Faculty]

	MajorID string  `json:"MajorID"` // Foreign Key
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"`// ระบุความสัมพันธ์ 1--1 [Majors]

	PositionID int       `json:"PositionID"`
	Position   *Position `gorm:"foreignKey:PositionID;references:ID"` // ระบุความสัมพันธ์ 1--1 [Position]

	CreatedAt time.Time      `json:"CreatedAt"`
	UpdatedAt time.Time      `json:"UpdatedAt"`
	DeletedAt gorm.DeletedAt `json:"DeletedAt,omitempty" gorm:"index"` // ใช้สำหรับ soft delete

}
