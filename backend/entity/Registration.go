package entity

import (
    "fmt"
    "time"

    "gorm.io/gorm"
)

type Registration struct {
    ID int `gorm:"primaryKey;autoIncrement" json:"ID"`

    RegistrationID string    `gorm:"uniqueIndex" json:"RegistrationID"`
    Date           time.Time `json:"Date"`

    SubjectID string   `json:"SubjectID"`
    Subject   *Subject `gorm:"foreignKey:SubjectID;references:SubjectID"`

	SemesterID int       `json:"SemesterID"`
	Semester   *Semester `gorm:"foreignKey:SemesterID;references:ID"`

    StudentID string    `json:"StudentID"`
    Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"`
}

// หลังสร้างเรคคอร์ด กำหนด RegistrationID จากเลข ID ให้เป็นรูปแบบ REG###
func (r *Registration) AfterCreate(tx *gorm.DB) error {
    code := fmt.Sprintf("REG%03d", r.ID)
    return tx.Model(r).Update("registration_id", code).Error
}

