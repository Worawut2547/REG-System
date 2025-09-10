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
		{
			RegistrationID: "REG008",
			Date:           time.Now(),
			StudentID:      "B6630654",
			SubjectID:      "233001",
		},
		{
			RegistrationID: "REG009",
			Date:           time.Now(),
			StudentID:      "B6616052",
			SubjectID:      "233052",
		},
		{
			RegistrationID: "REG010",
			Date:           time.Now(),
			StudentID:      "B6616052",
			SubjectID:      "233032",
		},
	}

	// บันทึกลง DB
	/*for _, r := range registrations {
		db.FirstOrCreate(&r)
	}*/
	for _, r := range registrations {
		db.FirstOrCreate(&r, entity.Registration{
			RegistrationID: r.RegistrationID,
		})
	}

	/*
			เหตุผลที่ต้องแก้:

		FirstOrCreate ต้องมีเงื่อนไขค้นหาชัดเจน (primary key หรือ unique key)

		ไม่เช่นนั้น GORM อาจ ไม่สร้าง row ใหม่ สำหรับนักศึกษาอื่น

		แก้แล้ว → registration และ bill ของ B6630652 จะถูกสร้าง → /bills/B6630652 จะทำงานได้
	*/

}
