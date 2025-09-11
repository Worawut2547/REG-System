package entity

import (
	"time"

	"gorm.io/gorm"
)

type Graduation struct {
	ID uint `gorm:"primaryKey" json:"GraduationID"`

	Date time.Time `json:"Date"`

	RejectReason *string `json:"RejectReason,omitempty"` // nil = ยังไม่ได้ reject

	StudentID string    `json:"StudentID"` // foreign key
	Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"` // preload student

	CurriculumID *string     `json:"CurriculumID,omitempty"` // optional
	Curriculum   *Curriculum `gorm:"foreignKey:CurriculumID;references:CurriculumID"`

	// ✅ ฟิลด์ใหม่ ใช้แสดงผลเท่านั้น (ไม่บันทึก DB)
	TotalCredits int `gorm:"-" json:"TotalCredits"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}