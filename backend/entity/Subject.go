package entity

type Subject struct {
	Subject_id   string `gorm:"primaryKey" json:"Subject_id"`
	Subject_Name string `json:"Subject_Name"`
	Credit       int    `json:"Credit"`

	Registrations []Registration `gorm:"foreignKey:Subject_id;references:Subject_id" json:"-"`
}
