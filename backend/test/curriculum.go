package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func CurriculumExample() {
	db := config.DB()

	curriculum := entity.Curriculum{
		CurriculumID: "curr23",
		CurriculumName:          "หลักสูตรวิศวกรรมคอมพิวเตอร์2565",
		TotalCredit: 175,
		BookID: 1,
		MajorID: "ENG23",
		FacultyID: "F01",
		StartYear: 2565,
		Description: "หลักสูตรวิศวกรรมคอมพิวเตอร์2565 ถูกพัฒนาขึ้นสำหรับนักศึกษาปีการศึกษา 2565 เป็นต้นไป",
	}
	db.FirstOrCreate(&curriculum)
}


func BookPathExample(){
	db := config.DB()

	book := entity.BookPath{
		ID: 1,
		Path: "user/uploads",
	}

	db.FirstOrCreate(&book)
}