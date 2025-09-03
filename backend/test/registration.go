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
			StudentID:      "B6616052",
			SubjectID:      "233001",
		},
		{
			RegistrationID: "REG002",
			Date:           time.Now(),
			StudentID:      "B6616052",
			SubjectID:      "233031",
		},
		{
			RegistrationID: "REG003",
			Date:           time.Now(),
			StudentID:      "B6616052",
			SubjectID:      "233072",
		},
		{
			RegistrationID: "REG004",
			Date:           time.Now(),
			StudentID:      "B6616052",
			SubjectID:      "233012",
		},
		{
			RegistrationID: "REG005",
			Date:           time.Now(),
			StudentID:      "B6630652",
			SubjectID:      "233001",
		},
		{
			RegistrationID: "REG006",
			Date:           time.Now(),
			StudentID:      "B6630652",
			SubjectID:      "233031",
		},
		{
			RegistrationID: "REG007",
			Date:           time.Now(),
			StudentID:      "B6630652",
			SubjectID:      "233072",
		},
	}

	// บันทึกลง DB
	for _, r := range registrations {
		db.FirstOrCreate(&r)
	}
}
