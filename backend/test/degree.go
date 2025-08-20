package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func DegreeExample() {
	db := config.DB()

	options := []string{
		"ระดับปริญญาตรี",
		"ระดับปริญญาโท",
		"ระดับปริญญาเอก",
	}

	for i, opt := range options {
		degree := entity.Degree{
			DegreeID: i+1,
			Degree: opt,
		}

		db.FirstOrCreate(&degree , entity.Degree{DegreeID: degree.DegreeID})

	}
}
