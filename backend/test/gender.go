package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func GenderExample() {
	db := config.DB()

	genders := []entity.Gender{
		{Gender: "Male"},
		{Gender: "Female"},
	}

	db.CreateInBatches(&genders, len(genders))
}
