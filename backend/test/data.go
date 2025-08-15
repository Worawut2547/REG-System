package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func ExampleData() {
	db := config.DB()

	degree := entity.Degree{
		DegreeID: 1,
		Degree:   "ระดับปริญญาตรี",
	}
	db.FirstOrCreate(&degree)

	status1 := entity.StatusStudent{
		StatusStudentID: "10",
		Status:          "กำลังศึกษาอยู่",
	}
	db.FirstOrCreate(&status1)

	status2 := entity.StatusStudent{
		StatusStudentID: "00",
		Status:          "สิ้นสภาพการศึกษา",
	}
	db.FirstOrCreate(&status2)

	faculty := entity.Faculty{
		FacultyID:   "ENG",
		FacultyName: "คณะวิศวกรรมศาสตร์",
	}
	db.FirstOrCreate(&faculty)

	major := entity.Majors{
		MajorID:   "23",
		MajorName: "คอมพิวเตอร์",
		FacultyID: "ENG",
	}
	db.FirstOrCreate(&major)

	student := entity.Students{
		StudentID:       "B6616052",
		FirstName:       "Worawut",
		LastName:        "Tattong",
		Gender:          "Male",
		Email:           "wut@gmail.com",
		Phone:           "0886161067",
		CitizenID:       "1102900069324",
		DegreeID:        1,
		FacultyID:       "ENG",
		MajorID:         "23",
		StatusStudentID: "10",
	}
	db.FirstOrCreate(&student)

	teacher := entity.Teachers{
		TeacherID: "T2900364",
		FirstName: "Somchai",
		LastName:  "Jaidee",
		Gender:    "Male",
		Email:     "Somchai@gmail.com",
		Phone:     "0996231058",
		CitizenID: "1102633369746",
		FacultyID: "ENG",
		MajorID:   "23",
	}
	db.FirstOrCreate(&teacher)

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
	db.FirstOrCreate(&userAdmin)

	hashedPasswordStudent, _ := config.HashPassword(student.CitizenID)
	userStudent := entity.Users{
		Username: student.StudentID,
		Password: hashedPasswordStudent,
		Role:     "student",
	}
	db.Create(&userStudent)

	hashedPasswordTeacher, _ := config.HashPassword(teacher.CitizenID)
	userTeacher := entity.Users{
		Username: teacher.TeacherID,
		Password: hashedPasswordTeacher,
		Role:     "teacher",
	}
	db.Create(&userTeacher)
}
