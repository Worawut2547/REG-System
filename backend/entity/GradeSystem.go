package entity

import (
	"time"
	"gorm.io/gorm"
)

type Semester struct {
	 
	Semester_id int `gorm:"primaryKey;autoIncrement" json:"Semester_id"`
	Term     int `json:"Term"`
	Academic int `json:"Academic"`

	// 1 Semester สามารถมีให้เรียนได้หลาย SemesterSubject
	SemesterSubject []SemesterSubject `gorm:"foreignKey:Semester_id"`
}

type Subjects struct {
	Subject_id    string    `gorm:"primaryKey" json:"Subject_id"`
	Subject_name  string    `json:"Subject_name"`
	Credit        string    `json:"Credit"`
	Date_Teaching time.Time `json:"Date_Teaching"`

	Teacher_ID *string
	Teachers   Teachers `gorm:"foreignKey:Teacher_id"`

	// 1 Subject สามารถเปิดให้เรียนได้หลาย SemesterSubject
	SemesterSubject []SemesterSubject `gorm:"foreignKey:Subject_id"`
}

type SemesterSubject struct {
	gorm.Model

	// Semester_id ทำหน้าที่เป็น FK
	Semester_id *uint
	Semester    Semester `gorm:"foreignKey:Semester_id"`

	// Subject_id ทำหน้าที่เป็น FK
	Subject_id *string
	Subjects   Subjects `gorm:"foreignKey:Subject_id"`
}

type Grades struct {
	gorm.Model

	Grade       string    `json:"Grade"`
	Total_Score float64   `json:"Total_Score"`
	Date        time.Time `json:"Date"`

	Student_id *string
	Students   Students `gorm:"foreignKey:Student_id"`

	Subject_id *string
	Subjects   Subjects `gorm:"foreignKey:Subject_id"`
}

type GradeSemester struct {
	gorm.Model

	Gpa        float64 `json:"Gpa"`
	Gpax       float64 `json:"Gpax"`
	Sum_Credit int     `json:Sum_Credit`

	Semester_id *uint
	Semester    Semester `gorm:"foreignKey:Semester_id"`

	Student_id *string
	Students   Students `gorm:"foreignKey:Student_id"`
}
