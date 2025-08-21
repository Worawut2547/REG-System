package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SubjectExample() {
	db := config.DB()

	subjects := []entity.Subject{
		{
			SubjectID:     "233031",
			SubjectName:   "System Anylis",
			FacultyID:     "F01",
			MajorID:       "ENG23",
			Credit:        4,
			SemesterID:    1,
		},

		{
			SubjectID:     "233001",
			SubjectName:   "Computer Statistic",
			FacultyID:     "F01",
			MajorID:       "ENG23",
			Credit:        2,
			SemesterID:    1,
		},
	}
	db.CreateInBatches(&subjects , len(subjects))
}
