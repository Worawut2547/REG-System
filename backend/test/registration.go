package test

import (
	"reg_system/config"
	"reg_system/entity"
	"time"
)

func RegistrationExample() {
	db := config.DB()

	// สร้างตัวอย่างการลงทะเบียน
	registrations := []entity.Registration{
		{
			RegistrationID: "REG001",
			Date:           time.Now(),
			StudentID:      "STU001",
			SubjectID:      "SUB001",
			SectionID:      1,
			SemesterID:     1,
		},
		{
			RegistrationID: "REG002",
			Date:           time.Now(),
			StudentID:      "STU002",
			SubjectID:      "SUB002",
			SectionID:      2,
			SemesterID:     1,
		},
	}

	// บันทึกลง DB
	for _, r := range registrations {
		db.FirstOrCreate(&r)
	}
}