package entity

import(
	"time"
	"gorm.io/gorm"
)

type BookPath struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"ID"`
	Path string `json:"Path"`

	CreatedAt time.Time `json:"CreatedAt"`
	UpdatedAt time.Time `json:"UpdatedAt"`
	DeletedAt gorm.DeletedAt `json:"DeletedAt,omitempty" gorm:"index"` // ใช้สำหรับ soft delete
}
