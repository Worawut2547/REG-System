package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func DayExample() {
	db := config.DB()

	days := []entity.DayOfWeek{
		{ID: 1 ,Day: "วันอาทิตย์"},
		{ID: 2 ,Day: "วันจันทร์"},
		{ID: 3 ,Day: "วันอังคาร"},
		{ID: 4 ,Day: "วันพุธ"},
		{ID: 5 ,Day: "วันพฤหัสบดี"},
		{ID: 6 ,Day: "วันศุกร์"},
		{ID: 7 ,Day: "วันเสาร์"},
	}
	
	for _,day := range days {
		db.Save(&day)
	}
}