package entity
import "time"

type Bill struct {
	ID          int    `gorm:"autoIncrement" json:"ID"`
	BillID      string `gorm:"primaryKey;unique" json:"BillID"`
	Date		time.Time `json:"Date"`
	TotalPrice  float64 `json:"TotalPrice"`
	
	RegistrationID string `json:"RegistrationID"`
	Registration *Registration `gorm:"foreignKey:RegistrationID;references:RegistrationID"`
}