package entity

import (
	"time"

	"gorm.io/gorm"
)

// =============================================================
// Central table for curriculum documents (simple & explicit)
// Fields:
// - id            : primary key (book ID)
// - book_path     : absolute or relative file path on disk
// - curriculum_id : references Curriculum (string like "CURR-2025-CS")
// =============================================================

type CurriculumBook struct {
	ID           int            `gorm:"primaryKey;autoIncrement" json:"id"`
	BookPath     string         `gorm:"type:text;not null" json:"book_path"`
	CurriculumID string         `gorm:"type:varchar(128);not null;index" json:"curriculum_id"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// Optional: explicit table name (avoid collision with old book_paths)
func (CurriculumBook) TableName() string { return "curriculum_books" }
