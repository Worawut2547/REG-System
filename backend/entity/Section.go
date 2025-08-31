package entity

type Section struct {
	Section_id string `gorm:"primaryKey" json:"Section_id"`
	Group_Name string `json:"StudyGroup_Name"`
	Schedule   string `json:"Schedule"`

	Registrations []Registration `gorm:"foreignKey:Section_id;references:Section_id" json:"-"`

	Subject_id string  `json:"Subject_id"`
	Subject    *Subject `gorm:"foreignKey:Subject_id;references:Subject_id"`
}
