package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SubjectExample() {
	db := config.DB()

	subjects := []entity.Subject{
		{SubjectID: "233031" , SubjectName: "System Anylist" , Credit: 4 , MajorID: "ENG23"},
		{SubjectID: "233001" , SubjectName: "Computer Statistic" , Credit: 2 , MajorID: "ENG23"},
		{SubjectID: "233072" , SubjectName: "Embedded" , Credit: 4 , MajorID: "ENG23"},
		{SubjectID: "233012" , SubjectName: "Data Mining" , Credit: 4 , MajorID: "ENG23"},
	}

	for _,subject := range subjects {
		db.Create(&subject)

	}
}