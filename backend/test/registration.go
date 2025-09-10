package test

import (
	"reg_system/config"
	"reg_system/entity"
	"time"
)

func RegistrationExample() {
	db := config.DB()

	registrations := []entity.Registration{
		// เทอม 1
		{RegistrationID: "REG005", Date: time.Now(), StudentID: "B6630652", SubjectID: "233001"},
		{RegistrationID: "REG006", Date: time.Now(), StudentID: "B6630652", SubjectID: "233031"},
		{RegistrationID: "REG007", Date: time.Now(), StudentID: "B6630652", SubjectID: "233072"},
		{RegistrationID: "REG008", Date: time.Now(), StudentID: "B6630652", SubjectID: "233012"},

		// เทอม 2
		{RegistrationID: "REG015", Date: time.Now(), StudentID: "B6630652", SubjectID: "233032"},
		{RegistrationID: "REG016", Date: time.Now(), StudentID: "B6630652", SubjectID: "233052"},
		{RegistrationID: "REG017", Date: time.Now(), StudentID: "B6630652", SubjectID: "233054"},
		{RegistrationID: "REG018", Date: time.Now(), StudentID: "B6630652", SubjectID: "234053"},

		// เทอม 3
		{RegistrationID: "REG025", Date: time.Now(), StudentID: "B6630652", SubjectID: "233053"},
		{RegistrationID: "REG026", Date: time.Now(), StudentID: "B6630652", SubjectID: "233074"},
		{RegistrationID: "REG027", Date: time.Now(), StudentID: "B6630652", SubjectID: "234033"},
		{RegistrationID: "REG028", Date: time.Now(), StudentID: "B6630652", SubjectID: "234052"},

		// B6630654
		// เทอม 1
		{RegistrationID: "REG105", Date: time.Now(), StudentID: "B6630654", SubjectID: "233001"},
		{RegistrationID: "REG106", Date: time.Now(), StudentID: "B6630654", SubjectID: "233031"},
		//{RegistrationID: "REG107", Date: time.Now(), StudentID: "B6630654", SubjectID: "233072"},
		//{RegistrationID: "REG108", Date: time.Now(), StudentID: "B6630654", SubjectID: "233012"},
		// เทอม 2
		{RegistrationID: "REG115", Date: time.Now(), StudentID: "B6630654", SubjectID: "233032"},
		{RegistrationID: "REG116", Date: time.Now(), StudentID: "B6630654", SubjectID: "233052"},
		//{RegistrationID: "REG117", Date: time.Now(), StudentID: "B6630654", SubjectID: "233054"},
		{RegistrationID: "REG118", Date: time.Now(), StudentID: "B6630654", SubjectID: "234053"},
		// เทอม 3
		{RegistrationID: "REG125", Date: time.Now(), StudentID: "B6630654", SubjectID: "233053"},
		{RegistrationID: "REG126", Date: time.Now(), StudentID: "B6630654", SubjectID: "233074"},
		{RegistrationID: "REG127", Date: time.Now(), StudentID: "B6630654", SubjectID: "234033"},
		//{RegistrationID: "REG128", Date: time.Now(), StudentID: "B6630654", SubjectID: "234052"},
	}
	

	// บันทึกลง DB โดยใช้ FirstOrCreate ป้องกัน duplicate
	for _, r := range registrations {
		db.FirstOrCreate(&r, entity.Registration{
			RegistrationID: r.RegistrationID,
		})
	}
}
