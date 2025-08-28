package entity

type Position struct {
	ID       int    `gorm:"autoIncrement" json:"ID"`
	Position string `gorm:"primaryKey;unique" json:"Position"`

	Teachers []Teachers `gorm:"foreignKey:PositionID;references:ID" json:"-"` // ระบุความสัมพันธ์ 1--many[Teachers]
}
