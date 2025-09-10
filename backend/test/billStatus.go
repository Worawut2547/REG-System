package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func BillStatus() {
	db := config.DB()

	statuses := []entity.BillStatus{
		{Status: "ค้างชำระ"},
		{Status: "รอตรวจสอบ"},
		{Status: "ชำระแล้ว"},
	}

	for _, s := range statuses {
		db.FirstOrCreate(&s, entity.BillStatus{Status: s.Status})
	}
}

