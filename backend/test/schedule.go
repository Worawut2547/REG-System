package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SchedulesExample() {
	db := config.DB()
	schedules := []entity.SubjectSchedules{
		{SubjectID: "233031" , DayOfWeekID: 2 , StartTime: "13:00:00", EndTime: "16:00:00",},
		{SubjectID: "233031" , DayOfWeekID: 3 , StartTime: "10:00:00", EndTime: "12:00:00",},
		{SubjectID: "233001" , DayOfWeekID: 2 , StartTime: "08:00:00", EndTime: "10:00:00",},
	}
	db.CreateInBatches(&schedules , len(schedules))
}
