package entity

type Semester struct {
	Semester_id   string `gorm:"primaryKey" json:"Semester_id"`
	Term          string `json:"Term"`
	Academic_Year string `json:"Academic_Year"`

	Registrations []Registration `gorm:"foreignKey:Semester_id;references:Semester_id" json:"-"`
}
