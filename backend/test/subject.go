package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SubjectExample() {
	db := config.DB()

	subjects := []entity.Subject{
		{SubjectID: "3025" , SubjectName: "Computer Statistic" , Credit: 3 , MajorID: "ENG23"},
		{SubjectID: "3026" , SubjectName: "Database System" , Credit: 4 , MajorID: "ENG23"},
		{SubjectID: "3027" , SubjectName: "Software Engineering" , Credit: 3 , MajorID: "ENG23"},
		{SubjectID: "3028" , SubjectName: "Computer Network" , Credit: 3 , MajorID: "ENG23"},
		{SubjectID: "3029" , SubjectName: "Computer Architecture" , Credit: 3 , MajorID: "ENG23"},
	}

	for _,subject := range subjects {
		db.FirstOrCreate(&subject)

	}
}