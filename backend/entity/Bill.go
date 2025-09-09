package entity

import "time"

type Bill struct {
	ID int `gorm:"autoIncrement" json:"ID"`
	//BillID      string `gorm:"primaryKey;unique" json:"BillID"`
	Date       time.Time `json:"Date"`
	TotalPrice int       `json:"TotalPrice"`

	StudentID string    `json:"StudentID"`
	Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"`
	ReceiptNo string    `json:"ReceiptNo"`

	FilePath string `json:"FilePath"`

	StatusID  int         `json:"StatusID"`
	Status   *BillStatus `gorm:"foreignKey:StatusID"` // เชื่อมกับ BillStatus

	//RegistrationID string `json:"RegistrationID"`
	Registration []Registration `gorm:"many2many:bill_registrations;"`
}