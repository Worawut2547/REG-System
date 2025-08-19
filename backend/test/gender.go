package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func GenderExample() {
	db := config.DB()
	genderMale := entity.Gender{
		ID:     1,
		Gender: "Male",
	}
	db.FirstOrCreate(&genderMale)

	genderFemale := entity.Gender{
		ID:     2,
		Gender: "Female",
	}
	db.FirstOrCreate(&genderFemale)
}
