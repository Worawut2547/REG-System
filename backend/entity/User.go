package entity

import (
	"gorm.io/gorm"
)

type Users struct {
	gorm.Model
	Username string `gorm:"unique" json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}
