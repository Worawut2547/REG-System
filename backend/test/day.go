package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func DayExample() {
	db := config.DB()

	days := []entity.DayOfWeek{
		{Day: "วันอาทิตย์"},
		{Day: "วันจันทร์"},
		{Day: "วันอังคาร"},
		{Day: "วันพุธ"},
		{Day: "วันพฤหัสบดี"},
		{Day: "วันศุกร์"},
		{Day: "วันเสาร์"},
	}
	db.CreateInBatches(&days , len(days))
}