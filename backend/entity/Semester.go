package entity

import (
	"gorm.io/gorm"
)

type Semester struct {
	gorm.Model
	Term          int `json:"Term"`
	AcademicYeaar int `json:"AcademicYeaar"`
}
