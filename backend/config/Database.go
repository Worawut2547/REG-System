package config

import (
	"fmt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"reg_system/entity"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {

	database, err := gorm.Open(sqlite.Open("testDB"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		panic("failed to connect")
	}
	fmt.Println("Connect to database successfully")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Students{},
		&entity.Teachers{},
		&entity.Admins{},
		&entity.Users{},
		&entity.Semester{},
		&entity.Subjects{},
		&entity.SemesterSubject{},
		&entity.Grades{},
		&entity.GradeSemester{},
		&entity.Scores{},
	)
	student := entity.Students{
		Student_id: "B6616052",
		FirstName:  "Worawut",
		LastName:   "Tattong",
		Gender:     "Male",
		Email:      "wut@gmail.com",
		Phone:      "0886161067",
		Citizen_id: "1102900069324",
	}
	db.FirstOrCreate(&student)

	teacher := entity.Teachers{
		Teacher_id: "T2900364",
		FirstName:  "Somchai",
		LastName:   "Jaidee",
		Gender:     "Male",
		Email:      "Somchai@gmail.com",
		Phone:      "0996231058",
		Citizen_id: "1102633369746",
	}
	db.FirstOrCreate(&teacher)

	admin := entity.Admins{
		Admin_id:   "admin",
		FirstName:  "John",
		LastName:   "Doe",
		Gender:     "Male",
		Email:      "John@gmail.com",
		Phone:      "0556971369",
		Citizen_id: "1139766402369",
	}
	db.FirstOrCreate(&admin)

	hashedPasswordAdmin, _ := HashPassword("admin")
	userAdmin := entity.Users{
		Username: "admin",
		Password: hashedPasswordAdmin,
		Role:     "admin",
	}
	db.FirstOrCreate(&userAdmin)

	hashedPasswordStudent, _ := HashPassword(student.Citizen_id)
	userStudent := entity.Users{
		Username: student.Student_id,
		Password: hashedPasswordStudent,
		Role:     "student",
	}
	db.Create(&userStudent)

	hashedPasswordTeacher, _ := HashPassword(teacher.Citizen_id)
	userTeacher := entity.Users{
		Username: teacher.Teacher_id,
		Password: hashedPasswordTeacher,
		Role:     "teacher",
	}
	db.Create(&userTeacher)

}
