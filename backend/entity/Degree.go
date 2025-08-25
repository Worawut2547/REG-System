package entity

type Degree struct {
	DegreeID int    `gorm:"primaryKey;autoIncrement" json:"DegreeID"`
	Degree   string `gorm:"unique" json:"Degree"`

	Students []Students `gorm:"foreignKey:DegreeID" json:"-"` // ระบุความสัมพันธ์ 1--many [Degree]
}