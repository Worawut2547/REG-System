package entity

import (
	"time"

	"gorm.io/gorm"
)


type Attachment struct {
	Attachment_id string    `gorm:"primaryKey" json:"Attachment_id"`
	File_Name     string    `json:"Attachment_File_Name"`
	File_Path     string    `json:"Attachment_File_Path"`
	Uploaded_date time.Time `json:"Attachment_Uploaded_date"`
	Deleted_at gorm.DeletedAt `gorm:"column:deleted_at;index"`

	Report_id string  `json:"Report_id"`
	Report    *Report `gorm:"foreignKey:Report_id;references:Report_id"`

}
