package test
import (
	"reg_system/config"
	"reg_system/entity"
)
func StudentExample() {
	db := config.DB()

	student := entity.Students{
		StudentID:       "B6630652",
		FirstName:       "Bamboo",
		LastName:        "Boobam",
		GenderID:        2,
		Email:           "bamboo@gmail.com",
		Phone:           "065912604",
		CitizenID:       "1112223334445",
		DegreeID:        1,
		FacultyID:       "F01",
		MajorID:         "ENG23",
		StatusStudentID: "10",
	}
	db.FirstOrCreate(&student)
}
