package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func MajorExample() {
	db := config.DB()

	majors := []entity.Majors{
		{MajorID: "SCI03", MajorName: "คณิตศาสตร์", FacultyID: "F02"},
		{MajorID: "SCI05", MajorName: "ฟิสิกส์", FacultyID: "F02"},
		{MajorID: "SCI02", MajorName: "เคมี", FacultyID: "F02"},

		{MajorID: "ENG23", MajorName: "คอมพิวเตอร์", FacultyID: "F01"},
		{MajorID: "ENG24", MajorName: "เคมี", FacultyID: "F01"},
		{MajorID: "ENG25", MajorName: "ไฟฟ้า", FacultyID: "F01"},

		{MajorID: "MT29", MajorName: "เทคโนโลยีการจัดการ", FacultyID: "F03"},
		{MajorID: "MT30", MajorName: "นวัตกรรมเทคโนโลยีอุตสาหากรรมบริการ", FacultyID: "F03"},
	}

	for _, major := range majors {
		db.FirstOrCreate(&major, entity.Majors{MajorID: major.MajorID})
	}
}
