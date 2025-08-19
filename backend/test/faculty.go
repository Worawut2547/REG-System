package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func FacultyExample() {
	db := config.DB()

	faculties := []entity.Faculty{
		{FacultyID: "F01" , FacultyName: "สำนักวิชาวิศวกรรมศาสตร์" },
		{FacultyID: "F02" , FacultyName: "สำนักวิชาวิทยาศาสตร์" },
		{FacultyID: "F03" , FacultyName: "สำนักวิชาเทคโนโลยีสังคม" },
	}

	for _,faculty := range faculties {
		db.FirstOrCreate(&faculty , entity.Faculty{FacultyID: faculty.FacultyID})
	}
}
