package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func PositionExample() {
	db := config.DB()
	positions := []entity.Position{
		{Position: "ศาสตราจารย์"},
		{Position: "รองศาสตราจารย์"},
		{Position: "ผู้ช่วยศาสตราจารย์"},
	}
	db.CreateInBatches(&positions , len(positions))
}
