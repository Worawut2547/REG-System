package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func StatusExample() {
	db := config.DB()

	statuses := []entity.StatusStudent{
		{StatusStudentID: "10", Status: "กำลังศึกษาอยู่"},
		{StatusStudentID: "20", Status: "แจ้งจบการศึกษา"},
		{StatusStudentID: "30", Status: "สำเร็จการศึกษา"},
		{StatusStudentID: "40", Status: "ไม่อนุมัติให้สำเร็จการศึกษา"},
		{StatusStudentID: "00", Status: "สิ้นสภาพการศึกษา"},
	}

	for _, s := range statuses {
		db.FirstOrCreate(&s)
	}
}
