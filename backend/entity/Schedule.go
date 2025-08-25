package entity

type SubjectSchedules struct {
	ID int `gorm:"primaryKey;autoIncrement" json:"ID"`

	StartTime string `json:"StartTime"`
	EndTime   string `json:"EndTime"`

	DayOfWeekID int        `json:"DayOfWeekID"`                          // Foreign Key
	DayOfWeek   *DayOfWeek `gorm:"foreignKey:DayOfWeekID;references:ID"` // ระบุความสัมพันธ์เเบบ 1--1[DayOfWeek]

	SubjectID string   `json:"SubjectID"`                                  // Foreign Key
	Subject   *Subject `gorm:"foreignKey:SubjectID;references:SubjectID" ` // ระบุความสัมพันธ์เเบบ 1--1[Subject]
}
