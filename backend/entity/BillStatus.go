package entity

type BillStatus struct {
	ID     int    `gorm:"autoIncrement" json:"ID"`
	Status string `json:"Status"`
}