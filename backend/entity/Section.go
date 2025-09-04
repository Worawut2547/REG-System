package entity

type Section struct {
	ID          int    `gorm:"primaryKey;autoIncrement" json:"ID"`

	SectionID   string `gorm:"unique" json:"SectionID"` // Unique identifier for the section

	Group 		int `json:"Group"` // Group number for the section

	DateTeaching string `json:"DateTeaching"` // Date and time when the section is taught
	
	SubjectID   string `json:"SubjectID"` // Reference to the subject associated with this
	Subject *Subject `gorm:"foreignKey:SubjectID;references:SubjectID" json:"Subject"` // Association with the Subject entity*/
}