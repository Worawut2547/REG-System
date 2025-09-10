package entity

import (
	"time"

	"gorm.io/gorm"
)

type Report struct {
	Report_id       string    `gorm:"primaryKey" json:"Report_id"`
	Report_details  string    `json:"Report_details"`
	Submittion_date time.Time `json:"ReportSubmission_date"`
	Status          string    `json:"ReportStatus"`

	Created_at time.Time      `gorm:"column:created_at;autoCreateTime"`
	Updated_at time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	Deleted_at gorm.DeletedAt `gorm:"column:deleted_at;index"`

	StudentID string     `json:"StudentID"`
	Student   *Students  `gorm:"foreignKey:StudentID;references:StudentID"`

	Reviewer_id string   `json:"Reviewer_id"`
	Reviewer    *Reviewer `gorm:"foreignKey:Reviewer_id;references:Reviewer_id"`

	ReportType_id string     `json:"ReportType_id"`
	ReportType    *ReportType `gorm:"foreignKey:ReportType_id;references:ReportType_id"`

	Attachments []Attachment `gorm:"foreignKey:Report_id;references:Report_id" json:"attachments"`

	Comments []ReviewerComment `gorm:"foreignKey:Report_id;references:Report_id" json:"-"`
}
