package test

import (
	"reg_system/config"
	"reg_system/entity"
	"time"
)

func SubjectExample() {
	db := config.DB()

	subjects := []entity.Subject{
		{SubjectID: "233031", SubjectName: "System Anylist", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1},
		{SubjectID: "233001", SubjectName: "Computer Statistic", Credit: 2, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1},
		{SubjectID: "233072", SubjectName: "Embedded", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1},
		{SubjectID: "233012", SubjectName: "Data Mining", Credit: 4, FacultyID: "F01", MajorID: "ENG23", SemesterID: 1},
	}

	for _, subject := range subjects {
		db.Create(&subject)
	}

	// เพิ่มข้อมูล Section ทดสอบ
	sections := []entity.Section{
		{SectionID: 1, Group: 1, DateTeaching: time.Date(2024, 1, 15, 9, 0, 0, 0, time.UTC), SubjectID: "233031"},
		{SectionID: 2, Group: 2, DateTeaching: time.Date(2024, 1, 15, 13, 0, 0, 0, time.UTC), SubjectID: "233031"},
		{SectionID: 3, Group: 1, DateTeaching: time.Date(2024, 1, 16, 10, 0, 0, 0, time.UTC), SubjectID: "233001"},
		{SectionID: 4, Group: 1, DateTeaching: time.Date(2024, 1, 17, 14, 0, 0, 0, time.UTC), SubjectID: "233072"},
		{SectionID: 5, Group: 2, DateTeaching: time.Date(2024, 1, 17, 16, 0, 0, 0, time.UTC), SubjectID: "233072"},
		{SectionID: 6, Group: 1, DateTeaching: time.Date(2024, 1, 18, 9, 0, 0, 0, time.UTC), SubjectID: "233012"},
	}

	for _, section := range sections {
		db.Create(&section)
	}

	// เพิ่มข้อมูล SubjectStudyTime ทดสอบ
	studyTimes := []entity.SubjectStudyTime{
		{SubjectID: "233031", StartAt: time.Date(2024, 1, 15, 9, 0, 0, 0, time.UTC), EndAt: time.Date(2024, 1, 15, 12, 0, 0, 0, time.UTC)},
		{SubjectID: "233001", StartAt: time.Date(2024, 1, 16, 10, 0, 0, 0, time.UTC), EndAt: time.Date(2024, 1, 16, 12, 0, 0, 0, time.UTC)},
		{SubjectID: "233072", StartAt: time.Date(2024, 1, 17, 14, 0, 0, 0, time.UTC), EndAt: time.Date(2024, 1, 17, 17, 0, 0, 0, time.UTC)},
		{SubjectID: "233012", StartAt: time.Date(2024, 1, 18, 9, 0, 0, 0, time.UTC), EndAt: time.Date(2024, 1, 18, 12, 0, 0, 0, time.UTC)},
	}

	for _, studyTime := range studyTimes {
		db.Create(&studyTime)
	}
}
