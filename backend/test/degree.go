package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func DegreeExample() {
	db := config.DB()

	degrees := []entity.Degree{
		{Degree: "ระดับปริญญาตรี"},
		{Degree: "ระดับปริญญาโท"},
		{Degree: "ระดับปริญญาเอก"},
	}
	db.CreateInBatches(&degrees , len(degrees))
}
