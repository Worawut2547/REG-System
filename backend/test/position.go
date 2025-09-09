package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func PositionExample() {
	db := config.DB()
	positions := []entity.Position{
		{ID: 1, Position: "ศาสตราจารย์"},
		{ID: 2, Position: "รองศาสตราจารย์"},
		{ID: 3, Position: "ผู้ช่วยศาสตราจารย์"},
	}
	for _, post := range positions {
		db.Save(&post)
	}
}