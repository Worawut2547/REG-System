package entity

import (
	"time"

	"gorm.io/gorm"
)

type BookPath struct {
	ID          int            `gorm:"primaryKey;autoIncrement" json:"id"`
	OriginalName string        `json:"original_name"`                // ชื่อไฟล์ที่ผู้ใช้อัปโหลด
	StoredName   string        `json:"stored_name"`                  // ชื่อไฟล์ที่เก็บจริง (uuid.ext)
	Path         string        `json:"path"`                         // full disk path หรือ relative path
	PublicPath   string        `json:"public_path"`                  // path สำหรับเสิร์ฟผ่าน HTTP (เช่น /static/curriculums/uuid.pdf)
	MimeType     string        `json:"mime_type"`
	Size         int64         `json:"size"`
	Checksum     string        `json:"checksum"`                     // sha256
	Note         string        `json:"note"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}
