package entity

import (
	"gorm.io/gorm"
	"time"
)

type Scores struct {
	gorm.Model

	Date	time.Time 	`json:"Date"`
	List 	string 		`json:"List"`
	Score  	float64 	`json:"Score"`
	Score_Total	int 	`json:"Score_Total"`

	Student_id	*string 
	Students	Students	`gorm:"foreignKey:Student_id"`

	Subject_id	*string
	Subjects 	Subjects	`gorm:"foreignKey:Subject_id"`
}

