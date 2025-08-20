package entity

type StatusStudent struct {
	StatusStudentID string `gorm:"primaryKey;" json:"StatusStudentID"`
	Status          string `json:"Status"`

	Students []Students `gorm:"foreignKey:StatusStudentID" json:"-"`
}
