package entity

import (
	"gorm.io/gorm"
	"time"
)

type Scores struct {
	gorm.Model

	Date        time.Time `json:"Date"`
	List        string    `json:"List"`
	Score       float64   `json:"Score"`
	Score_Total int       `json:"Score_Total"`

	Student_id *string
	Students   Students `gorm:"foreignKey:Student_id"`

	SubjectID string  `json:"SubjectID"`
	Subject   Subject `gorm:"foreignKey:SubjectID;references:SubjectID"`
}
