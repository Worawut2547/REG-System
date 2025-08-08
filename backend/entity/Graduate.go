package entity

import (
	"time"
	"gorm.io/gorm"
)

type Graduate struct {
	gorm.Model
	Graduation_id  int       `gorm:"primaryKey" json:"Graduation_id"`
	Status         string    `json:"Status"`
	Type           string    `json:"Type"`
	Date           time.Time `json:"Date"`
	Student_id     string    `gorm:"foreign key" json:"Student_id"`
	Curriculum_id  string    `gorm:"foreign key" json:"Curriculum_id"`
}
