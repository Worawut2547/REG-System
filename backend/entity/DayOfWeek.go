package entity

type DayOfWeek struct {
	ID int `gorm:"primaryKey;autoIncrement" json:"ID"`
	Day string `gorm:"unique" json:"DayOfWeek"`

	SubjectSchedules []SubjectSchedules `gorm:"foreignKey:ID" json:"-"`  // ระบุความสัมพันธ์เเบบ 1--many[SubjectSchedules]
}