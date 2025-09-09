package entity

type Gender struct {
	ID     int    `gorm:"primaryKey;autoIncrement"`
	Gender string `gorm:"unique"`

	Students []Students `gorm:"foreignKey:ID" json:"-"`  // ระบุความสัมพันธ์เเบบ 1--many[Student]
	Teacher  []Teachers `gorm:"foreignKey:ID" json:"-"`  // ระบุความสัมพันธ์เเบบ 1--many[Teacher]
}