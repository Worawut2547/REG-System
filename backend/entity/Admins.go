package entity

import (
	"gorm.io/gorm"
)

type Admins struct {
	gorm.Model
	Admin_id 	string `gorm:"primaryKey" json:"Admin_id"`
	FirstName  string `json:"FirstName"`
	LastName   string `json:"LastName"`
	Citizen_id string `json:"Citizen_id"`
	Gender     string `json:"Gender"`
	Email      string `json:"Email"`
	Phone      string `json:"Phone"`
}