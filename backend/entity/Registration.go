package entity

import "time"

type Registration struct {
	Registration_id   string    `gorm:"primaryKey" json:"Registration_id"`
	Registration_date time.Time `json:"Registration_date"`

	StudentID string     `json:"StudentID"`
	Student   *Students  `gorm:"foreignKey:StudentID;references:StudentID"`


	Subject_id string  `json:"Subject_id"`
	Subject    *Subject `gorm:"foreignKey:Subject_id;references:Subject_id"`

	Section_id string  `json:"Section_id"`
	Section    *Section `gorm:"foreignKey:Section_id;references:Section_id"`

	Semester_id string   `json:"Semester_id"`
	Semester    *Semester `gorm:"foreignKey:Semester_id;references:Semester_id"`
}
