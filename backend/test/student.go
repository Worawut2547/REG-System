package test

import (
	"log"
	"reg_system/config"
	"reg_system/entity"
)

func StudentExample() {
	db := config.DB()

	students := []entity.Students{
		{
			StudentID:       "B6630652",
			FirstName:       "Bamboo",
			LastName:        "Boobam",
			GenderID:        2,
			Email:           "bamboo@gmail.com",
			Phone:           "065912604",
			CitizenID:       "1112223334445",
			DegreeID:        1,
			FacultyID:       "F01",
			MajorID:         "ENG23",
			StatusStudentID: "10",
			CurriculumID:    "curr23",
			TeacherID:       "T2900364",
			Gpax:            3.00,
		},
		{
			StudentID:       "B6630654",
			FirstName:       "Charlie",
			LastName:        "Chaplin",
			GenderID:        2,
			Email:           "charlie@gmail.com",
			Phone:           "065912606",
			CitizenID:       "1112223334447",
			DegreeID:        1,
			FacultyID:       "F01",
			MajorID:         "ENG23",
			StatusStudentID: "10",
			CurriculumID:    "curr23",
			TeacherID:       "T2900366",
			Gpax:            3.50,
		},
	}

	for _, student := range students {
		// สร้างนักเรียน ถ้ามีแล้วไม่ซ้ำ
		if err := db.FirstOrCreate(&student, entity.Students{StudentID: student.StudentID}).Error; err != nil {
			log.Println("Failed to create student:", err)
			continue
		}

		// สร้างรหัสผ่าน hash
		hashedPasswordStudent, err := config.HashPassword(student.CitizenID)
		if err != nil {
			log.Println("Failed to hash password:", err)
			continue
		}

		// สร้างผู้ใช้งาน student
		userStudent := entity.Users{
			Username: student.StudentID,
			Password: hashedPasswordStudent,
			Role:     "student",
		}

		if err := db.FirstOrCreate(&userStudent, entity.Users{Username: userStudent.Username}).Error; err != nil {
			log.Println("Failed to create user:", err)
			continue
		}

		log.Println("Student and user created successfully:", student.StudentID)
	}
}
