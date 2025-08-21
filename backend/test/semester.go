package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SemesterExample() {
	db := config.DB()

	semesters := []entity.Semester{
		{Term: 1 , AcademicYeaar: 2568},
		{Term: 2 , AcademicYeaar: 2568},
		{Term: 3 , AcademicYeaar: 2568},
	}
	db.CreateInBatches(&semesters , len(semesters))
}