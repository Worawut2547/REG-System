package entity

import "time"

type Registration struct {
	ID 	int `gorm:"autoIncrement" json:"ID"`

	RegistrationID string    `gorm:"primaryKey;unique" json:"RegistrationID"`
	Date           time.Time `json:"Date"`

	StudentID string    `json:"StudentID"`
	Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"`

	SubjectID string    `json:"SubjectID"`
	Subject   []Subject `gorm:"foreignKey:SubjectID;references:SubjectID"`

	SectionID int       `json:"SectionID"`
	Section   []Section `gorm:"foreignKey:SectionID;references:SectionID"`

	SemesterID int       `json:"SemesterID"`
	Semester   *Semester `gorm:"foreignKey:SemesterID;references:SemesterID"`

	StudentsID string    `json:"StudentsID"`
	Students   *Students `gorm:"foreignKey:StudentsID;references:StudentID"`
}
