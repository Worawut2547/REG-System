package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func GradeExample() {
	db := config.DB()

	grades := []entity.Grades{
		{ID: 1 ,SubjectID: "233031" ,TotalScore: 79.69 , Grade: "A" , StudentID: "B6616052"},
		{ID: 2 ,SubjectID: "233001" , TotalScore: 84.36 , Grade: "A" , StudentID: "B6616052"},
		{ID: 3 ,SubjectID: "233072" , TotalScore: 75.98 , Grade: "B+" , StudentID: "B6616052"},
	}

	for _,grade := range grades{
		db.Save(&grade)
	}
}