package entity

type Subject struct {
	ID		  int    `gorm:"primaryKey;autoIncrement" json:"ID"`
	SubjectID   string `json:"SubjectID"`
	SubjectName string `json:"SubjectName"` // Name of the subject
	Credit      int    `json:"Credit"` // Number of credits for the subject

	MajorID    string   `json:"MajorID"` // Foreign Key
	Major      *Majors   `gorm:"foreignKey:MajorID;references:MajorID" json:"Major"` // Association with the Major entity
}