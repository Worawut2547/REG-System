package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func PositionExample() {
	db := config.DB()

	options := []string{
		"ศาสตราจารย์",
		"รองศาสตราจารย์",
		"ผู้ช่วยศาสตราจารย์",
	}

	for i, opt := range options {
		position := entity.Position{
			ID: i+1,
			Position: opt,
		}

		db.FirstOrCreate(&position , entity.Position{ID: position.ID})

	}
}
