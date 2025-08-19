package entity

type Gender struct {
	ID     int `gorm:"primaryKey;autoIncrement"`
	Gender string

	Students []Students `gorm:"foreignKey:ID" json:"-"`
	Teacher  []Teachers `gorm:"foreignKey:ID" json:"-"`
}
