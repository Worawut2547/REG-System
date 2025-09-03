package entity

type Payment struct {
	ID          int    `gorm:"primaryKey;autoIncrement" json:"ID"`

	PaymentID  string `gorm:"unique" json:"PaymentID"`

	PaymentMethod string `json:"PaymentMethod"` // e.g., "Credit Card", "Bank Transfer"
	PaymentStatus   string `json:"PaymentStatus"` // e.g., "Pending", "Completed", "Failed"

	BillID string `json:"BillID"` // Reference to the bill associated with this payment
	Bill *Bill `gorm:"foreignKey:BillID;reference:BillID" json:"Bill"` // Association with the Bill entity
}