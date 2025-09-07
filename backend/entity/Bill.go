package entity

import "time"

type Bill struct {
	ID int `gorm:"autoIncrement" json:"ID"`
	//BillID      string `gorm:"primaryKey;unique" json:"BillID"`
	Date       time.Time `json:"Date"`
	TotalPrice int   `json:"TotalPrice"`

	StudentID string    `json:"StudentID"`
	Student   *Students `gorm:"foreignKey:StudentID;references:StudentID"`
	/*RegistrationID string `json:"RegistrationID"`
	Registration *Registration `gorm:"foreignKey:RegistrationID;references:RegistrationID"`*/
}
