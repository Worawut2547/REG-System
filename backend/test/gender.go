package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func GenderExample() {
	db := config.DB()

	genders := []entity.Gender{
		{ID: 1 ,Gender: "Male"},
		{ID: 2 ,Gender: "Female"},
	}

	for _,gend := range genders {
		db.Save(&gend)
	}
}
