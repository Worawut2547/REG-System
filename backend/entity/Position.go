package entity

type Position struct {
	ID       int    `gorm:"autoIncrement" json:"ID"`
	Position string `gorm:"primaryKey" json:"Position"`

	Teachers []Teachers `gorm:"foreignKey:PositionID;references:ID"` // ระบุความสัมพันธ์ 1--N [Teachers]
}
