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
			//BillID:     "BIL001",
			TotalPrice:     1500.00,
			//StudentID:  "STU001",
			StudentID: "B6616052",
			Date:       time.Now(),
		},
		{
			//BillID:     "BIL002",
			TotalPrice:     2000.00,
			StudentID:  "STU002",
			//RegistrationID: "REG002",
			Date:       time.Now(),
		},

	}

	// บันทึกลง DB
	for _, r := range bills {
		db.FirstOrCreate(&r)
	}
}