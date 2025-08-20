package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func StatusExample() {
	db := config.DB()

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
}
