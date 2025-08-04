package entity

import (
	"gorm.io/gorm"
)

type Students struct {
	gorm.Model
	Student_id string `gorm:"primaryKey" json:"Student_id"`
	FirstName  string `json:"FirstName"`
	LastName   string `json:"LastName"`
	Citizen_id string `json:"Citizen_id"`
	Gender     string `json:"Gender"`
	Email      string `json:"Email"`
	Phone      string `json:"Phone"`
}