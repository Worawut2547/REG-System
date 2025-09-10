package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func ExampleData() {
	db := config.DB()

	FacultyExample()
	MajorExample()
	SubjectExample()
	PositionExample()
	DegreeExample()
	SemesterExample()
	GenderExample()
	StatusExample()
	CurriculumBookExample()
	CurriculumExample()

	RegistrationExample()
	StudentExample()
	BillExample()
	BillStatus()

	CurriculumBookExample()
	CurriculumExample()
	SubjectExample()
	GradeExample()
	//ScoresExample()

	GradeExample()

	teacher := entity.Teachers{
		TeacherID:  "T2900364",
		FirstName:  "Somchai",
		LastName:   "Jaidee",
		GenderID:   1,
		Email:      "Somchai@gmail.com",
		Phone:      "0996231058",
		CitizenID:  "1102633369746",
		FacultyID:  "F01",
		MajorID:    "ENG23",
		PositionID: 1, // Assuming PositionID 1 exists
	}
	db.FirstOrCreate(&teacher)
	hashedPasswordTeacher, _ := config.HashPassword(teacher.CitizenID)
	userTeacher := entity.Users{
		Username: teacher.TeacherID,
		Password: hashedPasswordTeacher,
		Role:     "teacher",
	}
	db.Create(&userTeacher)

	student := entity.Students{
		StudentID:       "B6616052",
		FirstName:       "Worawut",
		LastName:        "Tattong",
		GenderID:        1,
		Email:           "wut@gmail.com",
		Phone:           "0886161067",
		CitizenID:       "1102900069324",
		DegreeID:        1,
		FacultyID:       "F01",
		MajorID:         "ENG23",
		StatusStudentID: "10",
		CurriculumID:    "curr23",
		TeacherID:       "T2900364",
	}
	db.FirstOrCreate(&student)
	hashedPasswordStudent, _ := config.HashPassword(student.CitizenID)
	userStudent := entity.Users{
		Username: student.StudentID,
		Password: hashedPasswordStudent,
		Role:     "student",
	}
	db.Create(&userStudent)

	admin := entity.Admins{
		AdminID:   "admin",
		FirstName: "John",
		LastName:  "Doe",
		Gender:    "Male",
		Email:     "John@gmail.com",
		Phone:     "0556971369",
		CitizenID: "1139766402369",
	}
	db.FirstOrCreate(&admin)

	hashedPasswordAdmin, _ := config.HashPassword("admin")
	userAdmin := entity.Users{
		Username: "admin",
		Password: hashedPasswordAdmin,
		Role:     "admin",
	}
	db.Create(&userAdmin)
}
