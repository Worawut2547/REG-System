package entity

import (
	"time"
	"gorm.io/gorm"
)

type Scores struct {
	ID        int       `gorm:"primaryKey;autoIncrement" json:"ID"`
	List      string    `json:"List"`
	Score     float64   `json:"Score"`
	FullScore int       `json:"FullScore"`

	StudentID string    `gorm:"uniqueIndex:idx_student_subject" json:"StudentID"`
	Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"` // ระบุความสัมพันธ์ 1--1 [Student]

	SubjectID string         `gorm:"uniqueIndex:idx_student_subject" json:"SubjectID"` // Foreign Key
	Subject   *Subject       `gorm:"foreignKey:SubjectID;references:SubjectID"`        // ระบุความสัมพันธ์ 1--many [Subject]

	CreatedAt time.Time      `json:"CreatedAt"`
	UpdatedAt time.Time      `json:"UpdatedAt"`
	DeletedAt gorm.DeletedAt `json:"DeletedAt,omitempty" gorm:"index"` // ใช้สำหรับ soft delete
}