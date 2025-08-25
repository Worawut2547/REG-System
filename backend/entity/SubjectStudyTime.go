package entity

import (
	"time"
)

// ตารางเก็บเวลาเรียน
type SubjectStudyTime struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	SubjectID string    `json:"subject_id" gorm:"index;not null"`
	StartAt   time.Time `json:"start_at" gorm:"type:datetime;not null"`
	EndAt     time.Time `json:"end_at" gorm:"type:datetime;not null"`

	// ความสัมพันธ์กลับไปที่ Subject
	Subject *Subjects `json:"-" gorm:"foreignKey:SubjectID;references:SubjectID"`
}
