package test

import (
	"reg_system/config"
	"reg_system/entity"
	"time"
)

func BillExample() {
	db := config.DB()

	// สร้างตัวอย่างบิล
	bills := []entity.Bill{
		{
			TotalPrice: 1500.00,
			StudentID:  "B6616052",
			Date:       time.Now(),
			StatusID:   1,
		},
		{
			//BillID:     "BIL002",
			TotalPrice: 2000.00,
			StudentID:  "B6630652",
			//RegistrationID: "REG002",
			Date:     time.Now(),
			StatusID: 2,
		},
		{
			TotalPrice: 2400.00, // ตัวอย่างรวมหน่วยกิต * 800
			StudentID:  "B6630652",
			Date:       time.Now(),
			StatusID:   3,
		},
		{
			TotalPrice: 800.00,
			StudentID:  "B6630654",
			Date:       time.Now(),
			StatusID:   1,
		},
	}

	// บันทึกลง DB
	/*for _, r := range bills {
		db.FirstOrCreate(&r)
	}*/
	for _, b := range bills {
		db.FirstOrCreate(&b, entity.Bill{StudentID: b.StudentID})
	}

	/*
			เหตุผลที่ต้องแก้:

		FirstOrCreate ต้องมีเงื่อนไขค้นหาชัดเจน (primary key หรือ unique key)

		ไม่เช่นนั้น GORM อาจ ไม่สร้าง row ใหม่ สำหรับนักศึกษาอื่น

		แก้แล้ว → registration และ bill ของ B6630652 จะถูกสร้าง → /bills/B6630652 จะทำงานได้
	*/
}
