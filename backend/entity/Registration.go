package entity

import (
    "fmt"
    "time"

    "gorm.io/gorm"
)

type Registration struct {
    // ใช้เลข auto-increment เป็นคีย์หลักภายใน
    ID int `gorm:"primaryKey;autoIncrement" json:"ID"`

    // โค้ดอ่านง่ายสำหรับแสดงผล/ใช้งานภายนอก เช่น REG001, REG002 (unique)
    RegistrationID string    `gorm:"uniqueIndex" json:"RegistrationID"`
    Date           time.Time `json:"Date"`

    SubjectID string   `json:"SubjectID"`
    Subject   *Subject `gorm:"foreignKey:SubjectID;references:SubjectID"`

    SectionID int      `json:"SectionID"`
    Section   *Section `gorm:"foreignKey:SectionID;references:SectionID"`

    /*SemesterID int       `json:"SemesterID"`
    Semester   *Semester `gorm:"foreignKey:SemesterID;references:ID"`*/

    StudentID string    `json:"StudentID"`
    Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"`
}

// หลังสร้างเรคคอร์ด กำหนด RegistrationID จากเลข ID ให้เป็นรูปแบบ REG###
func (r *Registration) AfterCreate(tx *gorm.DB) error {
    // อย่างน้อย 3 หลัก เช่น REG001, REG012, REG123
    code := fmt.Sprintf("REG%03d", r.ID)
    return tx.Model(r).Update("registration_id", code).Error
}
