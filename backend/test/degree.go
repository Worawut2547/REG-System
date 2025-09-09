package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func DegreeExample() {
	db := config.DB()

	degrees := []entity.Degree{
		{DegreeID: 1 , Degree: "ระดับปริญญาตรี"},
		{DegreeID: 2 ,Degree: "ระดับปริญญาโท"},
		{DegreeID: 3 ,Degree: "ระดับปริญญาเอก"},
	}

	for _,degr := range degrees{
		db.Save(&degr)
	}
}