package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SubjectExample() {
	db := config.DB()

	subjects := []entity.Subject{
		{SubjectID: "233031", SubjectName: "System Anylist", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1 , TeacherID: "T2900364"},
		{SubjectID: "233001", SubjectName: "Computer Statistic", Credit: 2, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1 , TeacherID: "T2900364"},
		{SubjectID: "233072", SubjectName: "Embedded", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1 ,TeacherID: "T2900364"},
		{SubjectID: "233012", SubjectName: "Data Mining", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1 , TeacherID: "T2900364"},

		{SubjectID: "233032", SubjectName: "Software Engineering", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 2 , TeacherID: "T2900364"},
		{SubjectID: "233052", SubjectName: "Computer Communation", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 2 , TeacherID: "T2900364"},
		{SubjectID: "233054", SubjectName: "Operating System", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 2},
		{SubjectID: "234053", SubjectName: "Computer Vision", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 2},

		{SubjectID: "233053", SubjectName: "Computer Network", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 3},
		{SubjectID: "233074", SubjectName: "Serverless and Cloud Architectures", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 3},
		{SubjectID: "234033", SubjectName: "Software Testing", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 3},
		{SubjectID: "234052", SubjectName: "Digital Image Processing", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 3},

	}

	for _, subject := range subjects {
		db.Create(&subject)

	}
}
