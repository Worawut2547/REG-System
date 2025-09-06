package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func GradeExample() {
	db := config.DB()

	grades := []entity.Grades{

		{ID: 1 ,SubjectID: "233001" , TotalScore: 81.26, Grade: "A" , StudentID: "B6616052"},
		{ID: 2 ,SubjectID: "233001" , TotalScore: 75.32 , Grade: "B+" , StudentID: "B6630652"},

		{ID: 3 ,SubjectID: "233072" , TotalScore: 75.32 , Grade: "B+" , StudentID: "B6616052"},
		{ID: 4 ,SubjectID: "233072" , TotalScore: 70.32 , Grade: "B" , StudentID: "B6630652"},

		{ID: 5 ,SubjectID: "233032" , TotalScore: 82.39 , Grade: "A" , StudentID: "B6630652"},
		{ID: 6 ,SubjectID: "233032" , TotalScore: 81.47, Grade: "A" , StudentID: "B6616052"},

		{ID: 7 ,SubjectID: "233052" , TotalScore: 71.87 , Grade: "B" , StudentID: "B6630652"},
		{ID: 8 ,SubjectID: "233052" , TotalScore: 74.23, Grade: "B" , StudentID: "B6616052"},

		{ID: 9 ,SubjectID: "233054" , TotalScore: 75.36 , Grade: "B+" , StudentID: "B6630652"},
		{ID: 10 ,SubjectID: "233054" , TotalScore: 77.12, Grade: "B+" , StudentID: "B6616052"},

		{ID: 11 ,SubjectID: "234053" , TotalScore: 87.64 , Grade: "A" , StudentID: "B6630652"},
		{ID: 12 ,SubjectID: "234053" , TotalScore: 84.36, Grade: "A" , StudentID: "B6616052"},

		{ID: 13 ,SubjectID: "233053" , TotalScore: 87.64 , Grade: "A" , StudentID: "B6630652"},
		{ID: 14 ,SubjectID: "233053" , TotalScore: 84.36, Grade: "A" , StudentID: "B6616052"},

		{ID: 15 ,SubjectID: "233074" , TotalScore: 87.64 , Grade: "A" , StudentID: "B6630652"},
		{ID: 16 ,SubjectID: "233074" , TotalScore: 84.36, Grade: "A" , StudentID: "B6616052"},

		{ID: 17 ,SubjectID: "234033" , TotalScore: 76.31 , Grade: "B" , StudentID: "B6630652"},
		{ID: 18 ,SubjectID: "234033" , TotalScore: 74.31, Grade: "B" , StudentID: "B6616052"},

		{ID: 19 ,SubjectID: "234052" , TotalScore: 87.64 , Grade: "A" , StudentID: "B6630652"},
		{ID: 20 ,SubjectID: "234052" , TotalScore: 84.36, Grade: "A" , StudentID: "B6616052"},
	
	}
	for _,grade := range grades{
		db.Save(&grade)
	}
}