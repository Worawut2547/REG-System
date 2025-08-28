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
		
		{ID: 4 ,SubjectID: "233031" , TotalScore: 75.65 , Grade: "B+" , StudentID: "B6630652"},
		{ID: 5 ,SubjectID: "233001" , TotalScore: 65.95 , Grade: "B" , StudentID: "B6630652"},
	}

	for _,grade := range grades{
		db.Save(&grade)
	}
}