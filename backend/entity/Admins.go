package entity

type Admins struct {
	AdminID   string `gorm:"primaryKey" json:"AdminID"`
	FirstName  string `json:"FirstName"`
	LastName   string `json:"LastName"`
	CitizenID string `json:"CitizenID"`
	Gender     string `json:"Gender"`
	Email      string `json:"Email"`
	Phone      string `json:"Phone"`
}
