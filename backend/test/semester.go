package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SemesterExample() {
	db := config.DB()

	semesters := []entity.Semester{
		{ID: "1" ,Term: 1 , AcademicYear: 2566},
		{ID: "2" ,Term: 2 , AcademicYear: 2566},
		{ID: "3" ,Term: 3 , AcademicYear: 2566},

		{ID: "4" ,Term: 1 , AcademicYear: 2567},
		{ID: "5" ,Term: 2 , AcademicYear: 2567},
		{ID: "6" ,Term: 3 , AcademicYear: 2567},

		{ID: "7" ,Term: 1 , AcademicYear: 2568},
		{ID: "8" ,Term: 2 , AcademicYear: 2568},
		{ID: "9" ,Term: 3 , AcademicYear: 2568},
	}
	for _,semt := range semesters{
		db.FirstOrCreate(&semt)
	}
}