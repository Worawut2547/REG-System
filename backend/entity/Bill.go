package entity

import "time"

type Bill struct {
    ID           int       `gorm:"autoIncrement" json:"ID"`
	
    StudentID    string    `json:"StudentID"`
    Student      *Students `gorm:"foreignKey:StudentID;references:StudentID"`
    
    AcademicYear int       `json:"AcademicYear"`
    Term         int       `json:"Term"`

    TotalPrice   int       `json:"TotalPrice"`
    Date         time.Time `json:"Date"`

    FilePath     string    `json:"FilePath"`

	StatusID  int         `json:"StatusID"`
	Status   *BillStatus `gorm:"foreignKey:StatusID"` // เชื่อมกับ BillStatus

	//RegistrationID string `json:"RegistrationID"`
	Registration []Registration `gorm:"many2many:bill_registrations;"`
}

